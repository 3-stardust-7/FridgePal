// App Constants
export const COLORS = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F97316',
  success: '#22C55E',

  // Neutrals
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',

  // Freshness colors
  fresh: '#22C55E',
  moderate: '#F59E0B',
  expiringSoon: '#F97316',
  expired: '#EF4444',
};

export const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'view-grid' },
  { id: 'dairy', name: 'Dairy', icon: 'cheese' },
  { id: 'vegetables', name: 'Vegetables', icon: 'carrot' },
  { id: 'fruits', name: 'Fruits', icon: 'food-apple' },
  { id: 'meat', name: 'Meat', icon: 'food-steak' },
  { id: 'beverages', name: 'Beverages', icon: 'cup' },
  { id: 'condiments', name: 'Condiments', icon: 'bottle-soda' },
  { id: 'frozen', name: 'Frozen', icon: 'snowflake' },
  { id: 'other', name: 'Other', icon: 'food' },
];

export const DIET_TYPES = [
  { id: 'balanced', name: 'Balanced', description: 'Balanced nutrition' },
  { id: 'low-carb', name: 'Low Carb', description: 'Reduced carbohydrates' },
  { id: 'high-protein', name: 'High Protein', description: 'Protein-focused' },
  { id: 'vegetarian', name: 'Vegetarian', description: 'No meat' },
  { id: 'vegan', name: 'Vegan', description: 'Plant-based only' },
  { id: 'keto', name: 'Keto', description: 'Very low carb, high fat' },
];

export const HEALTH_GOALS = [
  { id: 'maintain', name: 'Maintain Weight', icon: 'scale-balance' },
  { id: 'lose', name: 'Lose Weight', icon: 'trending-down' },
  { id: 'gain', name: 'Gain Muscle', icon: 'arm-flex' },
  { id: 'health', name: 'Eat Healthier', icon: 'heart-pulse' },
];

export const MEAL_TYPES = [
  { id: 'breakfast', name: 'Breakfast', icon: 'weather-sunny' },
  { id: 'lunch', name: 'Lunch', icon: 'white-balance-sunny' },
  { id: 'dinner', name: 'Dinner', icon: 'weather-night' },
  { id: 'snack', name: 'Snack', icon: 'cookie' },
];

// Default expiry days for common items
export const DEFAULT_EXPIRY_DAYS = {
  dairy: 7,
  vegetables: 5,
  fruits: 7,
  meat: 3,
  beverages: 14,
  condiments: 30,
  frozen: 90,
  other: 7,
};

// Nutrition daily values (based on 2000 cal diet)
export const DAILY_VALUES = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fat: 78,
  fiber: 28,
  sugar: 50,
  sodium: 2300,
  water: 2500, // ml
};
