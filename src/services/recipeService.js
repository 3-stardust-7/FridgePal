import { supabase } from '../config/supabase';

/**
 * Recipes Service - CRUD operations for recipes
 */
export const recipeService = {
  /**
   * Get all public recipes
   */
  getAll: async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Get recipe by ID
   */
  getById: async id => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Search recipes by name or tags
   */
  search: async query => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_public', true)
      .order('name');

    if (error) throw error;
    return data;
  },

  /**
   * Get recipes by tag
   */
  getByTag: async tag => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .contains('tags', [tag])
      .eq('is_public', true);

    if (error) throw error;
    return data;
  },

  /**
   * Get recipes by multiple tags
   */
  getByTags: async tags => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .overlaps('tags', tags)
      .eq('is_public', true);

    if (error) throw error;
    return data;
  },

  /**
   * Get recipes matching fridge items
   * Returns recipes sorted by match percentage
   */
  getMatchingRecipes: async fridgeItems => {
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_public', true);

    if (error) throw error;

    // Calculate match percentage for each recipe
    const fridgeItemNames = fridgeItems.map(item => item.name.toLowerCase());

    const recipesWithMatch = recipes.map(recipe => {
      const ingredients = recipe.ingredients || [];
      const requiredIngredients = ingredients.filter(i => !i.optional);

      let matchCount = 0;
      const matchedIngredients = [];
      const missingIngredients = [];

      requiredIngredients.forEach(ingredient => {
        const ingredientName = ingredient.name.toLowerCase();
        const isMatched = fridgeItemNames.some(
          fridgeName =>
            fridgeName.includes(ingredientName) ||
            ingredientName.includes(fridgeName),
        );

        if (isMatched) {
          matchCount++;
          matchedIngredients.push(ingredient.name);
        } else {
          missingIngredients.push(ingredient.name);
        }
      });

      const matchPercentage =
        requiredIngredients.length > 0
          ? Math.round((matchCount / requiredIngredients.length) * 100)
          : 0;

      return {
        ...recipe,
        matchPercentage,
        matchedIngredients,
        missingIngredients,
      };
    });

    // Sort by match percentage
    return recipesWithMatch.sort(
      (a, b) => b.matchPercentage - a.matchPercentage,
    );
  },

  /**
   * Get user's saved recipes
   */
  getSavedRecipes: async () => {
    const { data, error } = await supabase
      .from('saved_recipes')
      .select(
        `
        recipe_id,
        saved_at,
        recipes (*)
      `,
      )
      .order('saved_at', { ascending: false });

    if (error) throw error;
    return data.map(item => ({
      ...item.recipes,
      savedAt: item.saved_at,
    }));
  },

  /**
   * Save a recipe
   */
  saveRecipe: async recipeId => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('saved_recipes')
      .insert({
        user_id: user.id,
        recipe_id: recipeId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Unsave a recipe
   */
  unsaveRecipe: async recipeId => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId);

    if (error) throw error;
    return true;
  },

  /**
   * Check if recipe is saved
   */
  isRecipeSaved: async recipeId => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('saved_recipes')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  /**
   * Create a new recipe (user-generated)
   */
  create: async recipe => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('recipes')
      .insert({
        created_by: user.id,
        name: recipe.name,
        description: recipe.description,
        image_url: recipe.imageUrl,
        prep_time: recipe.prepTime,
        cook_time: recipe.cookTime,
        servings: recipe.servings || 2,
        difficulty: recipe.difficulty || 'easy',
        cuisine: recipe.cuisine,
        tags: recipe.tags || [],
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        calories: recipe.calories || 0,
        protein: recipe.protein || 0,
        carbs: recipe.carbs || 0,
        fat: recipe.fat || 0,
        fiber: recipe.fiber || 0,
        is_public: recipe.isPublic ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a recipe
   */
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a recipe
   */
  delete: async id => {
    const { error } = await supabase.from('recipes').delete().eq('id', id);

    if (error) throw error;
    return true;
  },

  /**
   * Get recipes by difficulty
   */
  getByDifficulty: async difficulty => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('difficulty', difficulty)
      .eq('is_public', true);

    if (error) throw error;
    return data;
  },

  /**
   * Get quick recipes (under X minutes)
   */
  getQuickRecipes: async (maxMinutes = 30) => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .lte('prep_time', maxMinutes)
      .eq('is_public', true)
      .order('prep_time');

    if (error) throw error;
    return data;
  },
};

export default recipeService;
