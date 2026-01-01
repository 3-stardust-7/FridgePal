import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { profileService } from '../../src/services/profileService';

// ==================== ASYNC THUNKS ====================

export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const profile = await profileService.getProfile();
      return profile;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateProfileAsync = createAsyncThunk(
  'user/updateProfile',
  async (updates, { rejectWithValue }) => {
    try {
      const profile = await profileService.updateProfile(updates);
      return profile;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updatePreferencesAsync = createAsyncThunk(
  'user/updatePreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const profile = await profileService.updatePreferences(preferences);
      return profile;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateDailyGoalsAsync = createAsyncThunk(
  'user/updateDailyGoals',
  async (goals, { rejectWithValue }) => {
    try {
      const profile = await profileService.updateDailyGoals(goals);
      return profile;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateNotificationsAsync = createAsyncThunk(
  'user/updateNotifications',
  async (notifications, { rejectWithValue }) => {
    try {
      const profile = await profileService.updateNotifications(notifications);
      return profile;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const incrementStatAsync = createAsyncThunk(
  'user/incrementStat',
  async (statName, { rejectWithValue }) => {
    try {
      const profile = await profileService.incrementStat(statName);
      return { statName, profile };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const uploadAvatarAsync = createAsyncThunk(
  'user/uploadAvatar',
  async (imageUri, { rejectWithValue }) => {
    try {
      const avatarUrl = await profileService.uploadAvatar(imageUri);
      return avatarUrl;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ==================== SLICE ====================

const initialState = {
  profile: {
    id: null,
    email: '',
    name: '',
    avatarUrl: null,
    age: null,
    height: null,
    weight: null,
    gender: null,
    activityLevel: 'moderate',
  },
  preferences: {
    dietType: 'standard',
    healthGoal: 'maintain',
    allergies: [],
  },
  dailyGoals: {
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65,
    fiber: 25,
    water: 2000,
  },
  notifications: {
    expiryReminders: true,
    recipeSuggestions: true,
    waterReminder: true,
    mealReminder: true,
  },
  stats: {
    streak: 0,
    itemsSaved: 0,
    recipesMade: 0,
  },
  loading: false,
  error: null,
  isProfileLoaded: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setDietType: (state, action) => {
      state.preferences.dietType = action.payload;
    },
    setHealthGoal: (state, action) => {
      state.preferences.healthGoal = action.payload;
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
    toggleNotification: (state, action) => {
      const key = action.payload;
      if (state.notifications[key] !== undefined) {
        state.notifications[key] = !state.notifications[key];
      }
    },
    clearError: state => {
      state.error = null;
    },
    resetUser: state => {
      return initialState;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch profile
      .addCase(fetchProfile.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.isProfileLoaded = true;
        const p = action.payload;

        state.profile = {
          id: p.id,
          email: p.email,
          name: p.name,
          avatarUrl: p.avatar_url,
          age: p.age,
          height: p.height,
          weight: p.weight,
          gender: p.gender,
          activityLevel: p.activity_level,
        };

        state.preferences = {
          dietType: p.diet_type || 'standard',
          healthGoal: p.health_goal || 'maintain',
          allergies: p.allergies || [],
        };

        state.dailyGoals = {
          calories: p.daily_calorie_goal || 2000,
          protein: p.daily_protein_goal || 50,
          carbs: p.daily_carbs_goal || 250,
          fat: p.daily_fat_goal || 65,
          fiber: p.daily_fiber_goal || 25,
          water: p.daily_water_goal || 2000,
        };

        state.notifications = {
          expiryReminders: p.notifications_expiry ?? true,
          recipeSuggestions: p.notifications_recipes ?? true,
          waterReminder: p.notifications_water ?? true,
          mealReminder: p.notifications_meals ?? true,
        };

        state.stats = {
          streak: p.streak || 0,
          itemsSaved: p.items_saved || 0,
          recipesMade: p.recipes_made || 0,
        };
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update profile
      .addCase(updateProfileAsync.fulfilled, (state, action) => {
        const p = action.payload;
        state.profile = {
          ...state.profile,
          name: p.name,
          avatarUrl: p.avatar_url,
          age: p.age,
          height: p.height,
          weight: p.weight,
          gender: p.gender,
          activityLevel: p.activity_level,
        };
      })

      // Update preferences
      .addCase(updatePreferencesAsync.fulfilled, (state, action) => {
        const p = action.payload;
        state.preferences = {
          dietType: p.diet_type,
          healthGoal: p.health_goal,
          allergies: p.allergies || [],
        };
      })

      // Update daily goals
      .addCase(updateDailyGoalsAsync.fulfilled, (state, action) => {
        const p = action.payload;
        state.dailyGoals = {
          calories: p.daily_calorie_goal,
          protein: p.daily_protein_goal,
          carbs: p.daily_carbs_goal,
          fat: p.daily_fat_goal,
          fiber: p.daily_fiber_goal,
          water: p.daily_water_goal,
        };
      })

      // Update notifications
      .addCase(updateNotificationsAsync.fulfilled, (state, action) => {
        const p = action.payload;
        state.notifications = {
          expiryReminders: p.notifications_expiry,
          recipeSuggestions: p.notifications_recipes,
          waterReminder: p.notifications_water,
          mealReminder: p.notifications_meals,
        };
      })

      // Increment stat
      .addCase(incrementStatAsync.fulfilled, (state, action) => {
        const { statName, profile } = action.payload;
        state.stats = {
          streak: profile.streak,
          itemsSaved: profile.items_saved,
          recipesMade: profile.recipes_made,
        };
      })

      // Upload avatar
      .addCase(uploadAvatarAsync.pending, state => {
        state.loading = true;
      })
      .addCase(uploadAvatarAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.profile.avatarUrl = action.payload;
      })
      .addCase(uploadAvatarAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ==================== SELECTORS ====================

export const selectProfile = state => state.user.profile;
export const selectPreferences = state => state.user.preferences;
export const selectDailyGoals = state => state.user.dailyGoals;
export const selectNotifications = state => state.user.notifications;
export const selectStats = state => state.user.stats;
export const selectUserLoading = state => state.user.loading;
export const selectUserError = state => state.user.error;
export const selectIsProfileLoaded = state => state.user.isProfileLoaded;

export const selectBMI = state => {
  const { height, weight } = state.user.profile;
  if (!height || !weight) return null;
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

export const selectDailyCalorieGoal = state => {
  const { profile, preferences } = state.user;
  const { weight, height, age, gender, activityLevel } = profile;

  if (!weight || !height || !age) return state.user.dailyGoals.calories;

  // Mifflin-St Jeor Equation
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const multiplier = multipliers[activityLevel] || 1.55;
  let tdee = bmr * multiplier;

  // Adjust for health goal
  switch (preferences.healthGoal) {
    case 'lose':
      tdee -= 500;
      break;
    case 'gain':
      tdee += 300;
      break;
    case 'muscle':
      tdee += 200;
      break;
    default:
      break;
  }

  return Math.round(tdee);
};

export const {
  setDietType,
  setHealthGoal,
  addAllergy,
  removeAllergy,
  toggleNotification,
  clearError,
  resetUser,
} = userSlice.actions;

export default userSlice.reducer;
