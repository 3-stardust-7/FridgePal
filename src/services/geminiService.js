import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';

// Stable, broadly available model
const MODEL_NAME = 'gemini-2.5-flash';

// Get API key - try env first, then fallback
const getApiKey = () => {
  // First try the env variable
  if (
    GEMINI_API_KEY &&
    GEMINI_API_KEY !== 'undefined' &&
    GEMINI_API_KEY.length > 10
  ) {
    return GEMINI_API_KEY;
  }
  console.warn('GEMINI_API_KEY not loaded from environment');
  return null;
};

const callGeminiWithRetry = async (prompt, maxRetries = 5) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'Gemini API key not configured. Please add GEMINI_API_KEY to your .env file',
    );
  }

  const client = new GoogleGenerativeAI({ apiKey });
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  });

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const textContent = result?.response?.text();

      if (!textContent) {
        throw new Error('No content generated');
      }

      return textContent;
    } catch (error) {
      const message = error?.message || String(error);
      lastError = error;

      // Check if it's a rate/ quota / 429 style error
      if (
        attempt < maxRetries &&
        (message.includes('quota') ||
          message.includes('rate') ||
          message.includes('429'))
      ) {
        const waitTime = Math.pow(2, attempt) * 5000; // 10s, 20s, 40s, 80s, 160s
        console.log(
          `Rate limited. Waiting ${
            waitTime / 1000
          }s before retry ${attempt}/${maxRetries}...`,
        );
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // For 404 or model errors, bail out early
      if (
        message.includes('404') ||
        message.includes('not found') ||
        message.includes('model')
      ) {
        throw new Error(
          `Model unavailable. Tried ${MODEL_NAME}. Error: ${message}`,
        );
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
      I want to make "${dishName}" and I have these ingredients available:
      ${availableIngredients.join(', ')}
      
      Please suggest 3 variations of this dish I can make with my available ingredients.
      For each variation, provide a complete recipe.
      
      Return the response as a JSON array with this exact structure:
      [
        {
          "name": "Variation Name",
          "description": "Brief description",
          "prepTime": 15,
          "cookTime": 30,
          "servings": 4,
          "difficulty": "easy|medium|hard",
          "calories": 350,
          "protein": 25,
          "carbs": 30,
          "fat": 15,
          "ingredients": ["ingredient 1 with amount", "ingredient 2 with amount"],
          "instructions": ["Step 1", "Step 2"],
          "tags": ["tag1", "tag2"],
          "usesFromFridge": ["ingredient1", "ingredient2"],
          "needToBuy": ["ingredient1"]
        }
      ]
      
      Only return the JSON array, no other text.
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
    You are a professional chef and nutritionist. I have these ingredients in my fridge:
    ${ingredients.join(', ')}
    
    Please suggest ${numberOfRecipes} recipes I can make with these ingredients.
    ${
      constraints.length > 0
        ? `\nAdditional requirements:\n${constraints.join('\n')}`
        : ''
    }
    
    For each recipe, provide:
    - Creative and appetizing name
    - Brief description (1-2 sentences)
    - Prep time and cook time in minutes
    - Number of servings
    - Difficulty (easy, medium, or hard)
    - Estimated nutrition per serving (calories, protein in g, carbs in g, fat in g)
    - Complete ingredient list with amounts (mark which are from my fridge)
    - Step-by-step instructions
    - Relevant tags (breakfast, lunch, dinner, snack, quick, healthy, high-protein, low-carb, vegetarian, vegan, etc.)
    - List of ingredients I need to buy (if any) vs what I already have
    
    IMPORTANT: Return the response as a valid JSON array with this exact structure:
    [
      {
        "id": "ai_1",
        "name": "Recipe Name",
        "description": "Brief description of the dish",
        "image": "https://source.unsplash.com/400x300/?food,recipe-name",
        "prepTime": 15,
        "cookTime": 30,
        "servings": 4,
        "difficulty": "easy",
        "calories": 350,
        "protein": 25,
        "carbs": 30,
        "fat": 15,
        "ingredients": ["1 cup ingredient1", "2 tbsp ingredient2"],
        "instructions": ["Step 1 description", "Step 2 description"],
        "tags": ["dinner", "healthy", "quick"],
        "usesFromFridge": ["ingredient1", "ingredient2"],
        "needToBuy": ["ingredient3"],
        "matchPercentage": 85,
        "isAiGenerated": true
      }
    ]
    
    Make sure:
    1. Recipes primarily use the ingredients I have
    2. Recipes are practical and delicious
    3. Nutrition information is realistic
    4. matchPercentage reflects what % of ingredients I already have
    5. Only return the JSON array, no additional text or markdown
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
