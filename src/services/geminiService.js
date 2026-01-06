import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '@env';


// Stable, broadly available model
const MODEL_NAME = 'gemini-2.5-flash';
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});


const callGeminiWithRetry = async (prompt, maxRetries = 5) => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.6,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      const textContent = result?.candidates?.[0]?.content?.parts
        ?.map(p => p.text)
        .join("");

      if (!textContent) {
        throw new Error("No content generated");
      }

      return textContent;
    } catch (error) {
      const message = error?.message || String(error);
      lastError = error;

      // Retry only for rate/quota issues
      if (
        attempt < maxRetries &&
        (message.includes("429") ||
          message.includes("quota") ||
          message.includes("rate"))
      ) {
        const waitTime = Math.pow(2, attempt) * 5000;
        console.log(
          `Rate limited. Waiting ${
            waitTime / 1000
          }s before retry ${attempt}/${maxRetries}...`,
        );
        await new Promise(res => setTimeout(res, waitTime));
        continue;
      }

      // API key issues → fail fast
      if (
        message.includes("API_KEY_INVALID") ||
        message.includes("API key not valid")
      ) {
        throw new Error("Invalid Gemini API key");
      }

      throw error;
    }
  }

  throw lastError;
};

/**
 * Gemini AI Service for recipe generation
 */
export const geminiService = {
  /**
   * Generate recipes based on available fridge items
   * @param {Array} fridgeItems - Array of items in the fridge
   * @param {Object} options - Additional options for recipe generation
   * @returns {Promise<Array>} - Array of generated recipes
   */
  generateRecipes: async (fridgeItems, options = {}) => {
    const {
      numberOfRecipes = 5,
      dietaryPreferences = [],
      mealType = null,
      maxCookTime = null,
      difficulty = null,
    } = options;

    // Extract ingredient names from fridge items
    const ingredients = fridgeItems.map(item => {
      const quantity = item.quantity
        ? `${item.quantity} ${item.unit || ''}`.trim()
        : '';
      return quantity ? `${item.name} (${quantity})` : item.name;
    });

    // Build the prompt
    const prompt = buildRecipePrompt(ingredients, {
      numberOfRecipes,
      dietaryPreferences,
      mealType,
      maxCookTime,
      difficulty,
    });

    try {
      const textContent = await callGeminiWithRetry(prompt);
      const recipes = parseRecipeResponse(textContent);
      return recipes;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  },

  /**
   * Get a single recipe suggestion based on specific ingredients
   * @param {Array} ingredients - Specific ingredients to use
   * @param {string} cuisineType - Type of cuisine (optional)
   */
  getSingleRecipe: async (ingredients, cuisineType = null) => {
    const recipes = await geminiService.generateRecipes(
      ingredients.map(name => ({ name })),
      { numberOfRecipes: 1, cuisineType },
    );
    return recipes[0] || null;
  },

  /**
   * Get recipe variations for a specific dish
   * @param {string} dishName - Name of the dish
   * @param {Array} availableIngredients - Available ingredients
   */
  getRecipeVariations: async (dishName, availableIngredients) => {
    const prompt = `
I want to make "${dishName}" using these ingredients:
${availableIngredients.join(", ")}

Suggest 1 simple variation of this dish that mostly uses my ingredients.

Return ONLY a JSON array in this format:
[
  {
    "name": "Variation name",
    "description": "Short description",
    "prepTime": 10,
    "cookTime": 20,
    "servings": 2,
    "difficulty": "easy",
    "ingredients": ["ingredient with amount"],
    "instructions": ["Step 1", "Step 2"],
    "tags": ["quick", "home-style"],
    "usesFromFridge": ["ingredient"],
    "needToBuy": ["ingredient"]
  }
]

Rules:
- Max 5 instruction steps
- Short strings only
- No extra text
`;


    try {
      const textContent = await callGeminiWithRetry(prompt);
      return parseRecipeResponse(textContent);
    } catch (error) {
      console.error('Error getting recipe variations:', error);
      throw error;
    }
  },

  /**
   * Get meal plan for the week based on fridge items
   * @param {Array} fridgeItems - Items in the fridge
   * @param {Object} preferences - User preferences
   */
  generateMealPlan: async (fridgeItems, preferences = {}) => {
    const ingredients = fridgeItems.map(item => item.name);
    const { days = 7, mealsPerDay = 3 } = preferences;

    const prompt = `
      Create a ${days}-day meal plan using these ingredients I have:
      ${ingredients.join(', ')}
      
      For each day, suggest ${mealsPerDay} meals (breakfast, lunch, dinner).
      Prioritize using ingredients that might expire soon.
      
      Return the response as a JSON object with this structure:
      {
        "mealPlan": [
          {
            "day": 1,
            "meals": [
              {
                "type": "breakfast",
                "name": "Recipe Name",
                "description": "Brief description",
                "prepTime": 15,
                "calories": 300,
                "mainIngredients": ["ingredient1", "ingredient2"]
              }
            ]
          }
        ],
        "shoppingList": ["items you might need to buy"]
      }
      
      Only return the JSON object, no other text.
    `;

    try {
      const textContent = await callGeminiWithRetry(prompt);
      // Clean and parse JSON
      const cleanedJson = textContent.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedJson);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw error;
    }
  },
};

/**
 * Build the recipe generation prompt
 */
function buildRecipePrompt(ingredients, options) {
  const {
    numberOfRecipes,
    dietaryPreferences,
    mealType,
    maxCookTime,
    difficulty,
  } = options;

  let constraints = [];
  if (dietaryPreferences?.length > 0) {
    constraints.push(`Dietary preferences: ${dietaryPreferences.join(', ')}`);
  }
  if (mealType) {
    constraints.push(`Meal type: ${mealType}`);
  }
  if (maxCookTime) {
    constraints.push(`Maximum cooking time: ${maxCookTime} minutes`);
  }
  if (difficulty) {
    constraints.push(`Difficulty level: ${difficulty}`);
  }

 return `
I have these ingredients:
${ingredients.join(", ")}

Suggest ${Math.min(numberOfRecipes, 2)} simple recipes using mostly these ingredients.
${constraints.length ? constraints.join("\n") : ""}

Return ONLY a JSON array in this format:
[
  {
    "id": "ai_1",
    "name": "Recipe name",
    "description": "Short description",
    "prepTime": 10,
    "cookTime": 20,
    "servings": 2,
    "difficulty": "easy",
    "ingredients": ["ingredient with amount"],
    "instructions": ["Step 1", "Step 2"],
    "tags": ["quick"],
    "usesFromFridge": ["ingredient"],
    "needToBuy": ["ingredient"]
  }
]

Rules:
- Max 5 instruction steps
- Short strings only
- No extra text
`;

}

/**
 * Parse the recipe response from Gemini
 */
function parseRecipeResponse(textContent) {
  try {
    // Remove markdown code blocks if present
    let cleanedJson = textContent
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Try to find JSON array in the response
    const jsonMatch = cleanedJson.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedJson = jsonMatch[0];
    }

    const recipes = JSON.parse(cleanedJson);

    // Validate and normalize recipes
    return recipes.map((recipe, index) => ({
      id: recipe.id || `ai_${Date.now()}_${index}`,
      name: recipe.name || 'Unnamed Recipe',
      description: recipe.description || '',
      image:
        recipe.image ||
        `https://source.unsplash.com/400x300/?food,${encodeURIComponent(
          recipe.name || 'dish',
        )}`,
      prepTime: parseInt(recipe.prepTime) || 15,
      cookTime: parseInt(recipe.cookTime) || 30,
      servings: parseInt(recipe.servings) || 4,
      difficulty: recipe.difficulty || 'medium',
      calories: parseInt(recipe.calories) || 0,
      protein: parseInt(recipe.protein) || 0,
      carbs: parseInt(recipe.carbs) || 0,
      fat: parseInt(recipe.fat) || 0,
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      instructions: Array.isArray(recipe.instructions)
        ? recipe.instructions
        : [],
      tags: Array.isArray(recipe.tags) ? recipe.tags : [],
      usesFromFridge: recipe.usesFromFridge || [],
      needToBuy: recipe.needToBuy || [],
      matchPercentage: parseInt(recipe.matchPercentage) || 0,
      isAiGenerated: true,
    }));
  } catch (error) {
    console.error('Error parsing recipe response:', error);
    console.error('Raw response:', textContent);
    throw new Error('Failed to parse recipe response from AI');
  }
}

export default geminiService;
