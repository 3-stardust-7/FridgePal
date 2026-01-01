import { createSlice } from '@reduxjs/toolkit';
import { generateId } from '../../src/utils/helpers';

// Get today's date string
const getDateString = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

// Sample meals data
const todayDate = getDateString();
const yesterdayDate = getDateString(new Date(Date.now() - 86400000));

const sampleMeals = [
  {
    id: '1',
    date: todayDate,
    type: 'breakfast',
    name: 'Oatmeal with Berries',
    calories: 320,
    protein: 12,
    carbs: 54,
    fat: 6,
    fiber: 8,
    time: '08:30',
  },
  {
    id: '2',
    date: todayDate,
    type: 'lunch',
    name: 'Grilled Chicken Salad',
    calories: 420,
    protein: 35,
    carbs: 18,
    fat: 22,
    fiber: 5,
    time: '12:45',
  },
  {
    id: '3',
    date: todayDate,
    type: 'snack',
    name: 'Greek Yogurt',
    calories: 150,
    protein: 17,
    carbs: 8,
    fat: 4,
    fiber: 0,
    time: '15:30',
  },
  {
    id: '4',
    date: yesterdayDate,
    type: 'breakfast',
    name: 'Eggs & Toast',
    calories: 380,
    protein: 18,
    carbs: 32,
    fat: 20,
    fiber: 3,
    time: '09:00',
  },
  {
    id: '5',
    date: yesterdayDate,
    type: 'lunch',
    name: 'Turkey Sandwich',
    calories: 450,
    protein: 28,
    carbs: 42,
    fat: 18,
    fiber: 4,
    time: '13:00',
  },
  {
    id: '6',
    date: yesterdayDate,
    type: 'dinner',
    name: 'Salmon with Vegetables',
    calories: 520,
    protein: 40,
    carbs: 24,
    fat: 28,
    fiber: 6,
    time: '19:30',
  },
];

// Water intake tracking
const sampleWaterIntake = {
  [todayDate]: 1500, // ml
  [yesterdayDate]: 2200,
};

const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState: {
    meals: sampleMeals,
    waterIntake: sampleWaterIntake,
    selectedDate: todayDate,
    dailyGoals: {
      calories: 2000,
      protein: 50,
      carbs: 250,
      fat: 65,
      fiber: 25,
      water: 2500, // ml
    },
    weeklyData: [], // For charts
    isLoading: false,
  },
  reducers: {
    addMeal: (state, action) => {
      const newMeal = {
        ...action.payload,
        id: generateId(),
        date: state.selectedDate,
        time: new Date().toTimeString().slice(0, 5),
      };
      state.meals.push(newMeal);
    },
    updateMeal: (state, action) => {
      const index = state.meals.findIndex(
        meal => meal.id === action.payload.id,
      );
      if (index !== -1) {
        state.meals[index] = { ...state.meals[index], ...action.payload };
      }
    },
    deleteMeal: (state, action) => {
      state.meals = state.meals.filter(meal => meal.id !== action.payload);
    },
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
    addWater: (state, action) => {
      const amount = action.payload;
      const date = state.selectedDate;
      state.waterIntake[date] = (state.waterIntake[date] || 0) + amount;
    },
    setWaterIntake: (state, action) => {
      const { date, amount } = action.payload;
      state.waterIntake[date] = amount;
    },
    updateDailyGoals: (state, action) => {
      state.dailyGoals = { ...state.dailyGoals, ...action.payload };
    },
    logMealFromRecipe: (state, action) => {
      const { recipe, mealType, servings = 1 } = action.payload;
      const newMeal = {
        id: generateId(),
        date: state.selectedDate,
        type: mealType,
        name: recipe.name,
        calories: Math.round(recipe.calories * servings),
        protein: Math.round(recipe.protein * servings),
        carbs: Math.round(recipe.carbs * servings),
        fat: Math.round(recipe.fat * servings),
        fiber: Math.round((recipe.fiber || 0) * servings),
        time: new Date().toTimeString().slice(0, 5),
        recipeId: recipe.id,
      };
      state.meals.push(newMeal);
    },
  },
});

export const {
  addMeal,
  updateMeal,
  deleteMeal,
  setSelectedDate,
  addWater,
  setWaterIntake,
  updateDailyGoals,
  logMealFromRecipe,
} = nutritionSlice.actions;

// Selectors
export const selectAllMeals = state => state.nutrition.meals;
export const selectSelectedDate = state => state.nutrition.selectedDate;
export const selectDailyGoals = state => state.nutrition.dailyGoals;

export const selectMealsByDate = state => {
  const date = state.nutrition.selectedDate;
  return state.nutrition.meals.filter(meal => meal.date === date);
};

export const selectDailyTotals = state => {
  const meals = selectMealsByDate(state);
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + (meal.calories || 0),
      protein: totals.protein + (meal.protein || 0),
      carbs: totals.carbs + (meal.carbs || 0),
      fat: totals.fat + (meal.fat || 0),
      fiber: totals.fiber + (meal.fiber || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );
};

export const selectWaterIntake = state => {
  const date = state.nutrition.selectedDate;
  return state.nutrition.waterIntake[date] || 0;
};

export const selectDailyProgress = state => {
  const totals = selectDailyTotals(state);
  const goals = state.nutrition.dailyGoals;
  const water = selectWaterIntake(state);

  return {
    calories: Math.min(1, totals.calories / goals.calories),
    protein: Math.min(1, totals.protein / goals.protein),
    carbs: Math.min(1, totals.carbs / goals.carbs),
    fat: Math.min(1, totals.fat / goals.fat),
    fiber: Math.min(1, totals.fiber / goals.fiber),
    water: Math.min(1, water / goals.water),
  };
};

export const selectMealsByType = state => {
  const meals = selectMealsByDate(state);
  return {
    breakfast: meals.filter(m => m.type === 'breakfast'),
    lunch: meals.filter(m => m.type === 'lunch'),
    dinner: meals.filter(m => m.type === 'dinner'),
    snack: meals.filter(m => m.type === 'snack'),
  };
};

export const selectWeeklyCalories = state => {
  const today = new Date();
  const weekData = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayMeals = state.nutrition.meals.filter(m => m.date === dateStr);
    const totalCalories = dayMeals.reduce(
      (sum, m) => sum + (m.calories || 0),
      0,
    );

    weekData.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: dateStr,
      calories: totalCalories,
    });
  }

  return weekData;
};

export default nutritionSlice.reducer;
