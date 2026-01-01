import { createSlice } from '@reduxjs/toolkit';

// Sample recipes data
const sampleRecipes = [
  {
    id: '1',
    name: 'Spinach & Cheese Omelette',
    description:
      'A protein-packed breakfast with fresh spinach and melted cheese',
    image:
      'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400&h=300&fit=crop',
    ingredients: [
      'eggs',
      'spinach',
      'cheddar cheese',
      'butter',
      'salt',
      'pepper',
    ],
    instructions: [
      'Beat 3 eggs in a bowl with salt and pepper',
      'Heat butter in a non-stick pan over medium heat',
      'Pour eggs and let set slightly',
      'Add spinach and cheese on one half',
      'Fold omelette and cook until cheese melts',
      'Serve hot with toast',
    ],
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    calories: 350,
    protein: 24,
    carbs: 4,
    fat: 27,
    tags: ['breakfast', 'quick', 'high-protein', 'vegetarian'],
    difficulty: 'Easy',
    matchPercentage: 95,
  },
  {
    id: '2',
    name: 'Grilled Chicken Salad',
    description:
      'Fresh and healthy salad with grilled chicken breast and vegetables',
    image:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    ingredients: [
      'chicken breast',
      'spinach',
      'tomatoes',
      'bell peppers',
      'olive oil',
      'lemon',
    ],
    instructions: [
      'Season chicken with salt, pepper, and olive oil',
      'Grill chicken for 6-7 minutes each side',
      'Let rest for 5 minutes, then slice',
      'Arrange spinach, tomatoes, and peppers on plate',
      'Top with sliced chicken',
      'Drizzle with olive oil and lemon juice',
    ],
    prepTime: 15,
    cookTime: 15,
    servings: 2,
    calories: 320,
    protein: 35,
    carbs: 12,
    fat: 15,
    tags: ['lunch', 'dinner', 'healthy', 'high-protein', 'low-carb'],
    difficulty: 'Easy',
    matchPercentage: 90,
  },
  {
    id: '3',
    name: 'Creamy Tomato Pasta',
    description: 'Rich and creamy pasta with fresh tomatoes and herbs',
    image:
      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
    ingredients: ['pasta', 'tomatoes', 'cream', 'garlic', 'basil', 'parmesan'],
    instructions: [
      'Cook pasta according to package directions',
      'Sauté garlic in olive oil',
      'Add diced tomatoes and cook until soft',
      'Stir in cream and simmer',
      'Toss with drained pasta',
      'Top with parmesan and fresh basil',
    ],
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    calories: 480,
    protein: 14,
    carbs: 65,
    fat: 18,
    tags: ['dinner', 'comfort-food', 'vegetarian'],
    difficulty: 'Medium',
    matchPercentage: 60,
  },
  {
    id: '4',
    name: 'Greek Yogurt Parfait',
    description: 'Healthy breakfast parfait with yogurt, fruits, and granola',
    image:
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
    ingredients: ['greek yogurt', 'honey', 'granola', 'berries', 'banana'],
    instructions: [
      'Layer yogurt in a glass or bowl',
      'Add a layer of granola',
      'Top with fresh berries',
      'Repeat layers',
      'Drizzle with honey',
      'Serve immediately',
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    calories: 280,
    protein: 20,
    carbs: 38,
    fat: 6,
    tags: ['breakfast', 'healthy', 'quick', 'vegetarian'],
    difficulty: 'Easy',
    matchPercentage: 75,
  },
  {
    id: '5',
    name: 'Stuffed Bell Peppers',
    description:
      'Colorful bell peppers stuffed with savory meat and rice filling',
    image:
      'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop',
    ingredients: [
      'bell peppers',
      'ground beef',
      'rice',
      'tomatoes',
      'cheese',
      'onion',
    ],
    instructions: [
      'Cut tops off peppers and remove seeds',
      'Cook rice according to package',
      'Brown ground beef with onion',
      'Mix beef, rice, and diced tomatoes',
      'Stuff peppers with mixture',
      'Bake at 375°F for 30 minutes',
      'Top with cheese and bake 5 more minutes',
    ],
    prepTime: 20,
    cookTime: 35,
    servings: 4,
    calories: 380,
    protein: 22,
    carbs: 32,
    fat: 18,
    tags: ['dinner', 'meal-prep', 'family-friendly'],
    difficulty: 'Medium',
    matchPercentage: 70,
  },
  {
    id: '6',
    name: 'Avocado Toast with Eggs',
    description:
      'Trendy and nutritious breakfast with creamy avocado and poached eggs',
    image:
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop',
    ingredients: [
      'bread',
      'avocado',
      'eggs',
      'lemon',
      'red pepper flakes',
      'salt',
    ],
    instructions: [
      'Toast bread until golden',
      'Mash avocado with lemon juice and salt',
      'Poach or fry eggs to preference',
      'Spread avocado on toast',
      'Top with eggs',
      'Sprinkle with red pepper flakes',
    ],
    prepTime: 5,
    cookTime: 5,
    servings: 1,
    calories: 320,
    protein: 14,
    carbs: 28,
    fat: 18,
    tags: ['breakfast', 'quick', 'healthy', 'vegetarian'],
    difficulty: 'Easy',
    matchPercentage: 65,
  },
  {
    id: '7',
    name: 'Chicken Stir Fry',
    description:
      'Quick Asian-inspired stir fry with chicken and colorful vegetables',
    image:
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
    ingredients: [
      'chicken breast',
      'bell peppers',
      'broccoli',
      'soy sauce',
      'ginger',
      'garlic',
    ],
    instructions: [
      'Slice chicken into thin strips',
      'Cut vegetables into bite-sized pieces',
      'Heat oil in wok over high heat',
      'Stir fry chicken until golden',
      'Add vegetables and stir fry 3-4 minutes',
      'Add soy sauce, ginger, and garlic',
      'Serve over rice',
    ],
    prepTime: 15,
    cookTime: 10,
    servings: 3,
    calories: 290,
    protein: 28,
    carbs: 18,
    fat: 12,
    tags: ['dinner', 'quick', 'healthy', 'asian'],
    difficulty: 'Easy',
    matchPercentage: 85,
  },
  {
    id: '8',
    name: 'Caprese Salad',
    description:
      'Classic Italian salad with fresh mozzarella, tomatoes, and basil',
    image:
      'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&h=300&fit=crop',
    ingredients: [
      'tomatoes',
      'mozzarella',
      'basil',
      'olive oil',
      'balsamic vinegar',
    ],
    instructions: [
      'Slice tomatoes and mozzarella',
      'Arrange alternating on plate',
      'Tuck fresh basil leaves between',
      'Drizzle with olive oil',
      'Add balsamic vinegar',
      'Season with salt and pepper',
    ],
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    calories: 220,
    protein: 12,
    carbs: 8,
    fat: 16,
    tags: ['lunch', 'quick', 'vegetarian', 'italian'],
    difficulty: 'Easy',
    matchPercentage: 55,
  },
];

const recipeSlice = createSlice({
  name: 'recipes',
  initialState: {
    recipes: sampleRecipes,
    savedRecipes: [],
    selectedTags: [],
    searchQuery: '',
    sortBy: 'match', // match, time, calories
    isLoading: false,
  },
  reducers: {
    setRecipes: (state, action) => {
      state.recipes = action.payload;
    },
    saveRecipe: (state, action) => {
      if (!state.savedRecipes.includes(action.payload)) {
        state.savedRecipes.push(action.payload);
      }
    },
    unsaveRecipe: (state, action) => {
      state.savedRecipes = state.savedRecipes.filter(
        id => id !== action.payload,
      );
    },
    setSelectedTags: (state, action) => {
      state.selectedTags = action.payload;
    },
    toggleTag: (state, action) => {
      const tag = action.payload;
      if (state.selectedTags.includes(tag)) {
        state.selectedTags = state.selectedTags.filter(t => t !== tag);
      } else {
        state.selectedTags.push(tag);
      }
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    updateRecipeMatch: (state, action) => {
      const { recipeId, matchPercentage } = action.payload;
      const recipe = state.recipes.find(r => r.id === recipeId);
      if (recipe) {
        recipe.matchPercentage = matchPercentage;
      }
    },
  },
});

export const {
  setRecipes,
  saveRecipe,
  unsaveRecipe,
  setSelectedTags,
  toggleTag,
  setSearchQuery,
  setSortBy,
  updateRecipeMatch,
} = recipeSlice.actions;

// Selectors
export const selectAllRecipes = state => state.recipes.recipes;
export const selectSavedRecipes = state => state.recipes.savedRecipes;

export const selectFilteredRecipes = state => {
  let recipes = state.recipes.recipes;

  // Filter by tags
  if (state.recipes.selectedTags.length > 0) {
    recipes = recipes.filter(recipe =>
      state.recipes.selectedTags.some(tag => recipe.tags.includes(tag)),
    );
  }

  // Filter by search
  if (state.recipes.searchQuery) {
    const query = state.recipes.searchQuery.toLowerCase();
    recipes = recipes.filter(
      recipe =>
        recipe.name.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query) ||
        recipe.ingredients.some(ing => ing.toLowerCase().includes(query)),
    );
  }

  // Sort
  switch (state.recipes.sortBy) {
    case 'match':
      recipes = [...recipes].sort(
        (a, b) => b.matchPercentage - a.matchPercentage,
      );
      break;
    case 'time':
      recipes = [...recipes].sort(
        (a, b) => a.prepTime + a.cookTime - (b.prepTime + b.cookTime),
      );
      break;
    case 'calories':
      recipes = [...recipes].sort((a, b) => a.calories - b.calories);
      break;
    default:
      break;
  }

  return recipes;
};

export const selectTopMatches = state => {
  return [...state.recipes.recipes]
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 5);
};

export default recipeSlice.reducer;
