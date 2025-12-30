import { configureStore } from '@reduxjs/toolkit';
import fridgeReducer from './slices/fridgeSlice';
import recipeReducer from './slices/recipeSlice';
import nutritionReducer from './slices/nutritionSlice';
import userReducer from './slices/userSlice';

const store = configureStore({
  reducer: {
    fridge: fridgeReducer,
    recipes: recipeReducer,
    nutrition: nutritionReducer,
    user: userReducer,
  },
});

export default store;