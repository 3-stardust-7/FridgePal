import { configureStore } from '@reduxjs/toolkit';
import fridgeReducer from './slices/fridgeSliceAsync';
import recipeReducer from './slices/recipeSliceAsync';
import nutritionReducer from './slices/nutritionSliceAsync';
import userReducer from './slices/userSliceAsync';

const store = configureStore({
  reducer: {
    fridge: fridgeReducer,
    recipes: recipeReducer,
    nutrition: nutritionReducer,
    user: userReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types (Supabase returns non-serializable data sometimes)
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store;
