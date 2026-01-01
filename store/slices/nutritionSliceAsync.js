import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { nutritionService } from '../../src/services/nutritionService';

// ==================== ASYNC THUNKS ====================

export const fetchMealsByDate = createAsyncThunk(
  'nutrition/fetchMealsByDate',
  async (date, { rejectWithValue }) => {
    try {
      const meals = await nutritionService.getMealsByDate(date);
      return { date, meals };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchMealsGrouped = createAsyncThunk(
  'nutrition/fetchMealsGrouped',
  async (date, { rejectWithValue }) => {
    try {
      const mealsByType = await nutritionService.getMealsGroupedByType(date);
      return { date, mealsByType };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const addMealAsync = createAsyncThunk(
  'nutrition/addMeal',
  async (meal, { rejectWithValue }) => {
    try {
      const newMeal = await nutritionService.addMeal(meal);
      return newMeal;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteMealAsync = createAsyncThunk(
  'nutrition/deleteMeal',
  async (mealId, { rejectWithValue }) => {
    try {
      await nutritionService.deleteMeal(mealId);
      return mealId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const logMealFromRecipeAsync = createAsyncThunk(
  'nutrition/logFromRecipe',
  async ({ recipe, mealType, date }, { rejectWithValue }) => {
    try {
      const meal = await nutritionService.logMealFromRecipe(
        recipe,
        mealType,
        date,
      );
      return meal;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchWaterIntake = createAsyncThunk(
  'nutrition/fetchWater',
  async (date, { rejectWithValue }) => {
    try {
      const water = await nutritionService.getWaterIntake(date);
      return { date, water };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const addWaterAsync = createAsyncThunk(
  'nutrition/addWater',
  async ({ amount, date }, { rejectWithValue }) => {
    try {
      const entry = await nutritionService.addWater(amount, date);
      return { entry, amount };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchDailyTotals = createAsyncThunk(
  'nutrition/fetchDailyTotals',
  async (date, { rejectWithValue }) => {
    try {
      const totals = await nutritionService.getDailyTotals(date);
      return { date, totals };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchWeeklyData = createAsyncThunk(
  'nutrition/fetchWeeklyData',
  async (_, { rejectWithValue }) => {
    try {
      const data = await nutritionService.getWeeklyData();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ==================== SLICE ====================

const getToday = () => new Date().toISOString().split('T')[0];

const initialState = {
  selectedDate: getToday(),
  meals: [],
  mealsByType: {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  },
  waterIntake: 0,
  dailyTotals: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  },
  dailyGoals: {
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65,
    fiber: 25,
    water: 2000,
  },
  weeklyData: [],
  loading: false,
  error: null,
};

const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState,
  reducers: {
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
    setDailyGoals: (state, action) => {
      state.dailyGoals = { ...state.dailyGoals, ...action.payload };
    },
    clearError: state => {
      state.error = null;
    },
    // Optimistic updates
    optimisticAddMeal: (state, action) => {
      const meal = action.payload;
      state.meals.push(meal);
      if (state.mealsByType[meal.meal_type]) {
        state.mealsByType[meal.meal_type].push(meal);
      }
      // Update totals
      state.dailyTotals.calories += meal.calories || 0;
      state.dailyTotals.protein += meal.protein || 0;
      state.dailyTotals.carbs += meal.carbs || 0;
      state.dailyTotals.fat += meal.fat || 0;
      state.dailyTotals.fiber += meal.fiber || 0;
    },
    optimisticAddWater: (state, action) => {
      state.waterIntake += action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch meals by date
      .addCase(fetchMealsByDate.pending, state => {
        state.loading = true;
      })
      .addCase(fetchMealsByDate.fulfilled, (state, action) => {
        state.loading = false;
        state.meals = action.payload.meals.map(m => ({
          id: m.id,
          date: m.date,
          type: m.meal_type,
          name: m.name,
          recipeId: m.recipe_id,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
          fiber: m.fiber,
        }));
      })
      .addCase(fetchMealsByDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch meals grouped
      .addCase(fetchMealsGrouped.fulfilled, (state, action) => {
        const { mealsByType } = action.payload;
        state.mealsByType = {
          breakfast: mealsByType.breakfast.map(m => ({
            id: m.id,
            name: m.name,
            calories: m.calories,
            protein: m.protein,
            carbs: m.carbs,
            fat: m.fat,
          })),
          lunch: mealsByType.lunch.map(m => ({
            id: m.id,
            name: m.name,
            calories: m.calories,
            protein: m.protein,
            carbs: m.carbs,
            fat: m.fat,
          })),
          dinner: mealsByType.dinner.map(m => ({
            id: m.id,
            name: m.name,
            calories: m.calories,
            protein: m.protein,
            carbs: m.carbs,
            fat: m.fat,
          })),
          snack: mealsByType.snack.map(m => ({
            id: m.id,
            name: m.name,
            calories: m.calories,
            protein: m.protein,
            carbs: m.carbs,
            fat: m.fat,
          })),
        };
      })

      // Add meal
      .addCase(addMealAsync.pending, state => {
        state.loading = true;
      })
      .addCase(addMealAsync.fulfilled, (state, action) => {
        state.loading = false;
        const m = action.payload;
        const meal = {
          id: m.id,
          date: m.date,
          type: m.meal_type,
          name: m.name,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
          fiber: m.fiber,
        };
        state.meals.push(meal);
        if (state.mealsByType[m.meal_type]) {
          state.mealsByType[m.meal_type].push(meal);
        }
        // Update totals
        state.dailyTotals.calories += meal.calories || 0;
        state.dailyTotals.protein += meal.protein || 0;
        state.dailyTotals.carbs += meal.carbs || 0;
        state.dailyTotals.fat += meal.fat || 0;
        state.dailyTotals.fiber += meal.fiber || 0;
      })
      .addCase(addMealAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete meal
      .addCase(deleteMealAsync.fulfilled, (state, action) => {
        const mealId = action.payload;
        const meal = state.meals.find(m => m.id === mealId);
        if (meal) {
          // Update totals
          state.dailyTotals.calories -= meal.calories || 0;
          state.dailyTotals.protein -= meal.protein || 0;
          state.dailyTotals.carbs -= meal.carbs || 0;
          state.dailyTotals.fat -= meal.fat || 0;
          state.dailyTotals.fiber -= meal.fiber || 0;

          // Remove from meals array
          state.meals = state.meals.filter(m => m.id !== mealId);

          // Remove from mealsByType
          Object.keys(state.mealsByType).forEach(type => {
            state.mealsByType[type] = state.mealsByType[type].filter(
              m => m.id !== mealId,
            );
          });
        }
      })

      // Log meal from recipe
      .addCase(logMealFromRecipeAsync.fulfilled, (state, action) => {
        const m = action.payload;
        const meal = {
          id: m.id,
          date: m.date,
          type: m.meal_type,
          name: m.name,
          recipeId: m.recipe_id,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
          fiber: m.fiber,
        };
        state.meals.push(meal);
        if (state.mealsByType[m.meal_type]) {
          state.mealsByType[m.meal_type].push(meal);
        }
        state.dailyTotals.calories += meal.calories || 0;
        state.dailyTotals.protein += meal.protein || 0;
        state.dailyTotals.carbs += meal.carbs || 0;
        state.dailyTotals.fat += meal.fat || 0;
        state.dailyTotals.fiber += meal.fiber || 0;
      })

      // Fetch water
      .addCase(fetchWaterIntake.fulfilled, (state, action) => {
        state.waterIntake = action.payload.water.total;
      })

      // Add water
      .addCase(addWaterAsync.fulfilled, (state, action) => {
        state.waterIntake += action.payload.amount;
      })

      // Fetch daily totals
      .addCase(fetchDailyTotals.fulfilled, (state, action) => {
        state.dailyTotals = action.payload.totals;
        state.waterIntake = action.payload.totals.water;
      })

      // Fetch weekly data
      .addCase(fetchWeeklyData.fulfilled, (state, action) => {
        state.weeklyData = action.payload;
      });
  },
});

// ==================== SELECTORS ====================

export const selectSelectedDate = state => state.nutrition.selectedDate;
export const selectMeals = state => state.nutrition.meals;
export const selectMealsByType = state => state.nutrition.mealsByType;
export const selectWaterIntake = state => state.nutrition.waterIntake;
export const selectDailyTotals = state => state.nutrition.dailyTotals;
export const selectDailyGoals = state => state.nutrition.dailyGoals;
export const selectWeeklyData = state => state.nutrition.weeklyData;
export const selectNutritionLoading = state => state.nutrition.loading;
export const selectNutritionError = state => state.nutrition.error;

export const selectDailyProgress = state => {
  const { dailyTotals, dailyGoals } = state.nutrition;
  return {
    calories: Math.round((dailyTotals.calories / dailyGoals.calories) * 100),
    protein: Math.round((dailyTotals.protein / dailyGoals.protein) * 100),
    carbs: Math.round((dailyTotals.carbs / dailyGoals.carbs) * 100),
    fat: Math.round((dailyTotals.fat / dailyGoals.fat) * 100),
    fiber: Math.round((dailyTotals.fiber / dailyGoals.fiber) * 100),
    water: Math.round((state.nutrition.waterIntake / dailyGoals.water) * 100),
  };
};

export const selectRemainingCalories = state => {
  const { dailyTotals, dailyGoals } = state.nutrition;
  return Math.max(0, dailyGoals.calories - dailyTotals.calories);
};

export const {
  setSelectedDate,
  setDailyGoals,
  clearError,
  optimisticAddMeal,
  optimisticAddWater,
} = nutritionSlice.actions;

export default nutritionSlice.reducer;
