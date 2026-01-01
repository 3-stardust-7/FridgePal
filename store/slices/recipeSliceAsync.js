import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { recipeService } from '../../src/services/recipeService';
import { geminiService } from '../../src/services/geminiService';

// ==================== ASYNC THUNKS ====================

export const fetchRecipes = createAsyncThunk(
  'recipes/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const recipes = await recipeService.getAll();
      return recipes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Generate AI recipes based on fridge items using Gemini
 */
export const generateAiRecipes = createAsyncThunk(
  'recipes/generateAi',
  async ({ fridgeItems, options = {} }, { rejectWithValue }) => {
    try {
      const recipes = await geminiService.generateRecipes(fridgeItems, options);
      return recipes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Generate a meal plan using AI
 */
export const generateMealPlan = createAsyncThunk(
  'recipes/generateMealPlan',
  async ({ fridgeItems, preferences = {} }, { rejectWithValue }) => {
    try {
      const mealPlan = await geminiService.generateMealPlan(
        fridgeItems,
        preferences,
      );
      return mealPlan;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchMatchingRecipes = createAsyncThunk(
  'recipes/fetchMatching',
  async (fridgeItems, { rejectWithValue }) => {
    try {
      const recipes = await recipeService.getMatchingRecipes(fridgeItems);
      return recipes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchSavedRecipes = createAsyncThunk(
  'recipes/fetchSaved',
  async (_, { rejectWithValue }) => {
    try {
      const recipes = await recipeService.getSavedRecipes();
      return recipes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const saveRecipeAsync = createAsyncThunk(
  'recipes/save',
  async (recipeId, { rejectWithValue }) => {
    try {
      await recipeService.saveRecipe(recipeId);
      return recipeId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const unsaveRecipeAsync = createAsyncThunk(
  'recipes/unsave',
  async (recipeId, { rejectWithValue }) => {
    try {
      await recipeService.unsaveRecipe(recipeId);
      return recipeId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const searchRecipes = createAsyncThunk(
  'recipes/search',
  async (query, { rejectWithValue }) => {
    try {
      const recipes = await recipeService.search(query);
      return recipes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const createRecipe = createAsyncThunk(
  'recipes/create',
  async (recipe, { rejectWithValue }) => {
    try {
      const newRecipe = await recipeService.create(recipe);
      return newRecipe;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ==================== SLICE ====================

const initialState = {
  recipes: [],
  matchingRecipes: [],
  aiRecipes: [],
  mealPlan: null,
  savedRecipeIds: [],
  selectedTags: [],
  searchQuery: '',
  sortBy: 'match', // 'match', 'time', 'calories'
  loading: false,
  aiLoading: false,
  error: null,
  aiError: null,
};

const recipeSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    toggleTag: (state, action) => {
      const tag = action.payload;
      const index = state.selectedTags.indexOf(tag);
      if (index === -1) {
        state.selectedTags.push(tag);
      } else {
        state.selectedTags.splice(index, 1);
      }
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    clearFilters: state => {
      state.selectedTags = [];
      state.searchQuery = '';
      state.sortBy = 'match';
    },
    clearError: state => {
      state.error = null;
      state.aiError = null;
    },
    clearAiRecipes: state => {
      state.aiRecipes = [];
      state.aiError = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch all recipes
      .addCase(fetchRecipes.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.loading = false;
        state.recipes = action.payload.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          image: r.image_url,
          prepTime: r.prep_time,
          cookTime: r.cook_time,
          totalTime: (r.prep_time || 0) + (r.cook_time || 0),
          servings: r.servings,
          difficulty: r.difficulty,
          cuisine: r.cuisine,
          tags: r.tags || [],
          ingredients: r.ingredients || [],
          instructions: r.instructions || [],
          calories: r.calories,
          protein: r.protein,
          carbs: r.carbs,
          fat: r.fat,
          fiber: r.fiber,
        }));
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch matching recipes
      .addCase(fetchMatchingRecipes.pending, state => {
        state.loading = true;
      })
      .addCase(fetchMatchingRecipes.fulfilled, (state, action) => {
        state.loading = false;
        state.matchingRecipes = action.payload.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          image: r.image_url,
          prepTime: r.prep_time,
          cookTime: r.cook_time,
          totalTime: (r.prep_time || 0) + (r.cook_time || 0),
          servings: r.servings,
          difficulty: r.difficulty,
          cuisine: r.cuisine,
          tags: r.tags || [],
          ingredients: r.ingredients || [],
          instructions: r.instructions || [],
          calories: r.calories,
          protein: r.protein,
          carbs: r.carbs,
          fat: r.fat,
          fiber: r.fiber,
          matchPercentage: r.matchPercentage,
          matchedIngredients: r.matchedIngredients,
          missingIngredients: r.missingIngredients,
        }));
      })
      .addCase(fetchMatchingRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch saved recipes
      .addCase(fetchSavedRecipes.fulfilled, (state, action) => {
        state.savedRecipeIds = action.payload.map(r => r.id);
      })

      // Save recipe
      .addCase(saveRecipeAsync.fulfilled, (state, action) => {
        if (!state.savedRecipeIds.includes(action.payload)) {
          state.savedRecipeIds.push(action.payload);
        }
      })

      // Unsave recipe
      .addCase(unsaveRecipeAsync.fulfilled, (state, action) => {
        state.savedRecipeIds = state.savedRecipeIds.filter(
          id => id !== action.payload,
        );
      })

      // Search recipes
      .addCase(searchRecipes.fulfilled, (state, action) => {
        state.recipes = action.payload.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          image: r.image_url,
          prepTime: r.prep_time,
          cookTime: r.cook_time,
          totalTime: (r.prep_time || 0) + (r.cook_time || 0),
          servings: r.servings,
          difficulty: r.difficulty,
          cuisine: r.cuisine,
          tags: r.tags || [],
          ingredients: r.ingredients || [],
          instructions: r.instructions || [],
          calories: r.calories,
          protein: r.protein,
          carbs: r.carbs,
          fat: r.fat,
          fiber: r.fiber,
        }));
      })

      // Create recipe
      .addCase(createRecipe.fulfilled, (state, action) => {
        const r = action.payload;
        state.recipes.unshift({
          id: r.id,
          name: r.name,
          description: r.description,
          image: r.image_url,
          prepTime: r.prep_time,
          cookTime: r.cook_time,
          totalTime: (r.prep_time || 0) + (r.cook_time || 0),
          servings: r.servings,
          difficulty: r.difficulty,
          cuisine: r.cuisine,
          tags: r.tags || [],
          ingredients: r.ingredients || [],
          instructions: r.instructions || [],
          calories: r.calories,
          protein: r.protein,
          carbs: r.carbs,
          fat: r.fat,
          fiber: r.fiber,
        });
      })

      // Generate AI recipes
      .addCase(generateAiRecipes.pending, state => {
        state.aiLoading = true;
        state.aiError = null;
      })
      .addCase(generateAiRecipes.fulfilled, (state, action) => {
        state.aiLoading = false;
        state.aiRecipes = action.payload;
      })
      .addCase(generateAiRecipes.rejected, (state, action) => {
        state.aiLoading = false;
        state.aiError = action.payload;
      })

      // Generate meal plan
      .addCase(generateMealPlan.pending, state => {
        state.aiLoading = true;
        state.aiError = null;
      })
      .addCase(generateMealPlan.fulfilled, (state, action) => {
        state.aiLoading = false;
        state.mealPlan = action.payload;
      })
      .addCase(generateMealPlan.rejected, (state, action) => {
        state.aiLoading = false;
        state.aiError = action.payload;
      });
  },
});

// ==================== SELECTORS ====================

export const selectAllRecipes = state => state.recipes.recipes;
export const selectMatchingRecipes = state => state.recipes.matchingRecipes;
export const selectAiRecipes = state => state.recipes.aiRecipes;
export const selectMealPlan = state => state.recipes.mealPlan;
export const selectSavedRecipeIds = state => state.recipes.savedRecipeIds;
export const selectSelectedTags = state => state.recipes.selectedTags;
export const selectRecipeSearchQuery = state => state.recipes.searchQuery;
export const selectSortBy = state => state.recipes.sortBy;
export const selectRecipesLoading = state => state.recipes.loading;
export const selectAiLoading = state => state.recipes.aiLoading;
export const selectRecipesError = state => state.recipes.error;
export const selectAiError = state => state.recipes.aiError;

export const selectFilteredRecipes = state => {
  const { recipes, selectedTags, searchQuery, sortBy } = state.recipes;

  let filtered = recipes.filter(recipe => {
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some(tag => recipe.tags.includes(tag));
    const matchesSearch =
      !searchQuery ||
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTags && matchesSearch;
  });

  // Sort
  switch (sortBy) {
    case 'match':
      filtered.sort(
        (a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0),
      );
      break;
    case 'time':
      filtered.sort((a, b) => a.totalTime - b.totalTime);
      break;
    case 'calories':
      filtered.sort((a, b) => a.calories - b.calories);
      break;
    default:
      break;
  }

  return filtered;
};

export const selectTopMatches = state => {
  return state.recipes.matchingRecipes
    .filter(r => r.matchPercentage >= 50)
    .slice(0, 5);
};

export const selectSavedRecipes = state => {
  const { recipes, savedRecipeIds } = state.recipes;
  return recipes.filter(r => savedRecipeIds.includes(r.id));
};

export const isRecipeSaved = recipeId => state => {
  return state.recipes.savedRecipeIds.includes(recipeId);
};

export const {
  toggleTag,
  setSearchQuery,
  setSortBy,
  clearFilters,
  clearError,
  clearAiRecipes,
} = recipeSlice.actions;

export default recipeSlice.reducer;
