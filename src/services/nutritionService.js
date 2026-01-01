import { supabase } from '../config/supabase';

/**
 * Nutrition Service - Meals and water tracking
 */
export const nutritionService = {
  // ==================== MEALS ====================

  /**
   * Get meals for a specific date
   */
  getMealsByDate: async date => {
    const dateStr =
      date instanceof Date ? date.toISOString().split('T')[0] : date;

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('date', dateStr)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Get meals grouped by type for a date
   */
  getMealsGroupedByType: async date => {
    const meals = await nutritionService.getMealsByDate(date);

    return {
      breakfast: meals.filter(m => m.meal_type === 'breakfast'),
      lunch: meals.filter(m => m.meal_type === 'lunch'),
      dinner: meals.filter(m => m.meal_type === 'dinner'),
      snack: meals.filter(m => m.meal_type === 'snack'),
    };
  },

  /**
   * Add a meal
   */
  addMeal: async meal => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('meals')
      .insert({
        user_id: user.id,
        date: meal.date || new Date().toISOString().split('T')[0],
        meal_type: meal.type,
        name: meal.name,
        recipe_id: meal.recipeId || null,
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
        fiber: meal.fiber || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Log meal from a recipe
   */
  logMealFromRecipe: async (recipe, mealType, date) => {
    return nutritionService.addMeal({
      date,
      type: mealType,
      name: recipe.name,
      recipeId: recipe.id,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      fiber: recipe.fiber,
    });
  },

  /**
   * Delete a meal
   */
  deleteMeal: async mealId => {
    const { error } = await supabase.from('meals').delete().eq('id', mealId);

    if (error) throw error;
    return true;
  },

  /**
   * Update a meal
   */
  updateMeal: async (mealId, updates) => {
    const { data, error } = await supabase
      .from('meals')
      .update(updates)
      .eq('id', mealId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==================== WATER INTAKE ====================

  /**
   * Get water intake for a date
   */
  getWaterIntake: async date => {
    const dateStr =
      date instanceof Date ? date.toISOString().split('T')[0] : date;

    const { data, error } = await supabase
      .from('water_intake')
      .select('*')
      .eq('date', dateStr);

    if (error) throw error;

    const total = data.reduce((sum, entry) => sum + entry.amount, 0);
    return { entries: data, total };
  },

  /**
   * Add water intake
   */
  addWater: async (amount, date) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('water_intake')
      .insert({
        user_id: user.id,
        date: date || new Date().toISOString().split('T')[0],
        amount,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete water intake entry
   */
  deleteWater: async entryId => {
    const { error } = await supabase
      .from('water_intake')
      .delete()
      .eq('id', entryId);

    if (error) throw error;
    return true;
  },

  // ==================== DAILY TOTALS ====================

  /**
   * Get daily nutrition totals
   */
  getDailyTotals: async date => {
    const meals = await nutritionService.getMealsByDate(date);
    const water = await nutritionService.getWaterIntake(date);

    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
        fiber: acc.fiber + (meal.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );

    return {
      ...totals,
      water: water.total,
      mealsCount: meals.length,
    };
  },

  /**
   * Get weekly nutrition data
   */
  getWeeklyData: async () => {
    const dates = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    const weeklyData = await Promise.all(
      dates.map(async date => {
        const totals = await nutritionService.getDailyTotals(date);
        return { date, ...totals };
      }),
    );

    return weeklyData;
  },

  /**
   * Get monthly summary
   */
  getMonthlySummary: async (year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: meals, error } = await supabase
      .from('meals')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
        fiber: acc.fiber + (meal.fiber || 0),
        count: acc.count + 1,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, count: 0 },
    );

    const daysWithMeals = [...new Set(meals.map(m => m.date))].length;

    return {
      totals,
      averages: {
        calories: Math.round(totals.calories / daysWithMeals) || 0,
        protein: Math.round(totals.protein / daysWithMeals) || 0,
        carbs: Math.round(totals.carbs / daysWithMeals) || 0,
        fat: Math.round(totals.fat / daysWithMeals) || 0,
        fiber: Math.round(totals.fiber / daysWithMeals) || 0,
      },
      daysTracked: daysWithMeals,
      totalMeals: totals.count,
    };
  },

  // ==================== DAILY SUMMARY CACHE ====================

  /**
   * Update or create daily summary
   */
  updateDailySummary: async date => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const totals = await nutritionService.getDailyTotals(date);

    const { data, error } = await supabase
      .from('daily_summaries')
      .upsert(
        {
          user_id: user.id,
          date,
          total_calories: totals.calories,
          total_protein: totals.protein,
          total_carbs: totals.carbs,
          total_fat: totals.fat,
          total_fiber: totals.fiber,
          total_water: totals.water,
          meals_count: totals.mealsCount,
        },
        {
          onConflict: 'user_id,date',
        },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Subscribe to real-time meal changes
   */
  subscribeMeals: callback => {
    return supabase
      .channel('meals_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meals' },
        payload => callback(payload),
      )
      .subscribe();
  },
};

export default nutritionService;
