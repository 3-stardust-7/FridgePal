import { supabase } from '../config/supabase';

/**
 * Profile Service - User profile and preferences
 */
export const profileService = {
  /**
   * Get current user's profile
   */
  getProfile: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update profile
   */
  updateProfile: async updates => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const profileUpdates = {};

    // Map fields
    if (updates.name !== undefined) profileUpdates.name = updates.name;
    if (updates.avatarUrl !== undefined)
      profileUpdates.avatar_url = updates.avatarUrl;
    if (updates.age !== undefined) profileUpdates.age = updates.age;
    if (updates.height !== undefined) profileUpdates.height = updates.height;
    if (updates.weight !== undefined) profileUpdates.weight = updates.weight;
    if (updates.gender !== undefined) profileUpdates.gender = updates.gender;
    if (updates.activityLevel !== undefined)
      profileUpdates.activity_level = updates.activityLevel;

    const { data, error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update diet preferences
   */
  updatePreferences: async preferences => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updates = {};

    if (preferences.dietType !== undefined)
      updates.diet_type = preferences.dietType;
    if (preferences.healthGoal !== undefined)
      updates.health_goal = preferences.healthGoal;
    if (preferences.allergies !== undefined)
      updates.allergies = preferences.allergies;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update daily goals
   */
  updateDailyGoals: async goals => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updates = {};

    if (goals.calories !== undefined)
      updates.daily_calorie_goal = goals.calories;
    if (goals.protein !== undefined) updates.daily_protein_goal = goals.protein;
    if (goals.carbs !== undefined) updates.daily_carbs_goal = goals.carbs;
    if (goals.fat !== undefined) updates.daily_fat_goal = goals.fat;
    if (goals.fiber !== undefined) updates.daily_fiber_goal = goals.fiber;
    if (goals.water !== undefined) updates.daily_water_goal = goals.water;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update notification settings
   */
  updateNotifications: async notifications => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updates = {};

    if (notifications.expiryReminders !== undefined)
      updates.notifications_expiry = notifications.expiryReminders;
    if (notifications.recipeSuggestions !== undefined)
      updates.notifications_recipes = notifications.recipeSuggestions;
    if (notifications.waterReminder !== undefined)
      updates.notifications_water = notifications.waterReminder;
    if (notifications.mealReminder !== undefined)
      updates.notifications_meals = notifications.mealReminder;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update stats (items saved, recipes made, streak)
   */
  updateStats: async stats => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updates = {};

    if (stats.itemsSaved !== undefined) updates.items_saved = stats.itemsSaved;
    if (stats.recipesMade !== undefined)
      updates.recipes_made = stats.recipesMade;
    if (stats.streak !== undefined) updates.streak = stats.streak;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Increment a stat
   */
  incrementStat: async statName => {
    const profile = await profileService.getProfile();

    const statMap = {
      itemsSaved: 'items_saved',
      recipesMade: 'recipes_made',
      streak: 'streak',
    };

    const dbField = statMap[statName];
    if (!dbField) throw new Error('Invalid stat name');

    const currentValue = profile[dbField] || 0;

    return profileService.updateStats({
      [statName]: currentValue + 1,
    });
  },

  /**
   * Calculate BMI
   */
  calculateBMI: (height, weight) => {
    if (!height || !weight) return null;
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  },

  /**
   * Calculate daily calorie needs (Mifflin-St Jeor Equation)
   */
  calculateDailyCalories: profile => {
    const { weight, height, age, gender, activityLevel } = profile;

    if (!weight || !height || !age) return 2000;

    // Base Metabolic Rate
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multiplier
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const multiplier = multipliers[activityLevel] || 1.55;

    return Math.round(bmr * multiplier);
  },

  /**
   * Upload avatar image
   */
  uploadAvatar: async imageUri => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileName = `${user.id}-${Date.now()}.jpg`;
    const filePath = `avatars/${fileName}`;

    // Convert URI to blob (React Native specific)
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath);

    // Update profile with new avatar URL
    await profileService.updateProfile({ avatarUrl: publicUrl });

    return publicUrl;
  },
};

export default profileService;
