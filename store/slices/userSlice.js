import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: {
      name: 'Alex Johnson',
      email: 'alex@example.com',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
      age: 28,
      height: 175, // cm
      weight: 70, // kg
      activityLevel: 'moderate', // sedentary, light, moderate, active, very_active
    },
    preferences: {
      dietType: 'balanced', // balanced, low-carb, high-protein, vegetarian, vegan, keto
      healthGoal: 'maintain', // maintain, lose, gain, health
      allergies: [],
      dislikedFoods: [],
      cuisinePreferences: ['italian', 'asian', 'mexican'],
    },
    notifications: {
      expiryReminders: true,
      mealReminders: true,
      weeklyReport: true,
      recipeSuggestions: true,
    },
    settings: {
      darkMode: false,
      language: 'en',
      measurementUnit: 'metric', // metric, imperial
      notificationTime: '08:00',
    },
    stats: {
      itemsSaved: 47,
      recipesCooked: 23,
      wasteReduced: '12 kg',
      moneySaved: '$156',
      streakDays: 14,
    },
    achievements: [
      { id: 'first_scan', name: 'First Scan', icon: 'camera', unlocked: true },
      {
        id: 'zero_waste',
        name: 'Zero Waste Week',
        icon: 'leaf',
        unlocked: true,
      },
      { id: 'chef', name: 'Master Chef', icon: 'chef-hat', unlocked: false },
      { id: 'healthy', name: 'Health Streak', icon: 'heart', unlocked: true },
    ],
    isAuthenticated: true,
  },
  reducers: {
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    updateNotifications: (state, action) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    addAllergy: (state, action) => {
      if (!state.preferences.allergies.includes(action.payload)) {
        state.preferences.allergies.push(action.payload);
      }
    },
    removeAllergy: (state, action) => {
      state.preferences.allergies = state.preferences.allergies.filter(
        a => a !== action.payload,
      );
    },
    addDislikedFood: (state, action) => {
      if (!state.preferences.dislikedFoods.includes(action.payload)) {
        state.preferences.dislikedFoods.push(action.payload);
      }
    },
    removeDislikedFood: (state, action) => {
      state.preferences.dislikedFoods = state.preferences.dislikedFoods.filter(
        f => f !== action.payload,
      );
    },
    toggleDarkMode: state => {
      state.settings.darkMode = !state.settings.darkMode;
    },
    setDietType: (state, action) => {
      state.preferences.dietType = action.payload;
    },
    setHealthGoal: (state, action) => {
      state.preferences.healthGoal = action.payload;
    },
    unlockAchievement: (state, action) => {
      const achievement = state.achievements.find(a => a.id === action.payload);
      if (achievement) {
        achievement.unlocked = true;
      }
    },
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    logout: state => {
      state.isAuthenticated = false;
    },
    login: state => {
      state.isAuthenticated = true;
    },
  },
});

export const {
  updateProfile,
  updatePreferences,
  updateNotifications,
  updateSettings,
  addAllergy,
  removeAllergy,
  addDislikedFood,
  removeDislikedFood,
  toggleDarkMode,
  setDietType,
  setHealthGoal,
  unlockAchievement,
  updateStats,
  logout,
  login,
} = userSlice.actions;

// Selectors
export const selectProfile = state => state.user.profile;
export const selectPreferences = state => state.user.preferences;
export const selectNotifications = state => state.user.notifications;
export const selectSettings = state => state.user.settings;
export const selectStats = state => state.user.stats;
export const selectAchievements = state => state.user.achievements;
export const selectIsAuthenticated = state => state.user.isAuthenticated;

export const selectBMI = state => {
  const { height, weight } = state.user.profile;
  if (!height || !weight) return null;
  const heightInM = height / 100;
  return (weight / (heightInM * heightInM)).toFixed(1);
};

export const selectDailyCalorieGoal = state => {
  const { age, height, weight, activityLevel } = state.user.profile;
  const { healthGoal } = state.user.preferences;

  // Basic BMR calculation (Mifflin-St Jeor)
  let bmr = 10 * weight + 6.25 * height - 5 * age + 5;

  // Activity multiplier
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  let tdee = bmr * (multipliers[activityLevel] || 1.55);

  // Adjust for goal
  switch (healthGoal) {
    case 'lose':
      tdee -= 500;
      break;
    case 'gain':
      tdee += 300;
      break;
    default:
      break;
  }

  return Math.round(tdee);
};

export default userSlice.reducer;
