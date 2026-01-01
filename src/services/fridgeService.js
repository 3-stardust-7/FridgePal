import { supabase } from '../config/supabase';

/**
 * Fridge Items Service - CRUD operations for fridge inventory
 */
export const fridgeService = {
  /**
   * Get all fridge items for current user
   */
  getAll: async () => {
    console.log('fridgeService.getAll called');
    const { data, error } = await supabase
      .from('fridge_items')
      .select('*')
      .order('expiry_date', { ascending: true });

    console.log('getAll result:', { data, error });
    if (error) throw error;
    return data || [];
  },

  /**
   * Get fridge items by category
   */
  getByCategory: async category => {
    const { data, error } = await supabase
      .from('fridge_items')
      .select('*')
      .eq('category', category)
      .order('expiry_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Get expiring items (within X days)
   */
  getExpiring: async (days = 3) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from('fridge_items')
      .select('*')
      .lte('expiry_date', futureDate.toISOString().split('T')[0])
      .gte('expiry_date', new Date().toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Get expired items
   */
  getExpired: async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('fridge_items')
      .select('*')
      .lt('expiry_date', today)
      .order('expiry_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Get single item by ID
   */
  getById: async id => {
    const { data, error } = await supabase
      .from('fridge_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Add new fridge item
   */
  add: async item => {
    console.log('fridgeService.add called with:', item);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log('Current user:', user?.id);
    if (!user) throw new Error('User not authenticated');

    const insertData = {
      user_id: user.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity || 1,
      unit: item.unit || 'pcs',
      amount_left: item.amountLeft || 100,
      purchase_date:
        item.purchaseDate || new Date().toISOString().split('T')[0],
      expiry_date: item.expiryDate,
      image_url: item.imageUrl,
      notes: item.notes,
      calories: item.calories || 0,
      protein: item.protein || 0,
      carbs: item.carbs || 0,
      fat: item.fat || 0,
      fiber: item.fiber || 0,
    };
    console.log('Inserting:', insertData);

    const { data, error } = await supabase
      .from('fridge_items')
      .insert(insertData)
      .select()
      .single();

    console.log('Insert result:', { data, error });
    if (error) throw error;
    return data;
  },

  /**
   * Update fridge item
   */
  update: async (id, updates) => {
    const updateData = {};

    // Map frontend fields to database columns
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.amountLeft !== undefined)
      updateData.amount_left = updates.amountLeft;
    if (updates.expiryDate !== undefined)
      updateData.expiry_date = updates.expiryDate;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.calories !== undefined) updateData.calories = updates.calories;
    if (updates.protein !== undefined) updateData.protein = updates.protein;
    if (updates.carbs !== undefined) updateData.carbs = updates.carbs;
    if (updates.fat !== undefined) updateData.fat = updates.fat;
    if (updates.fiber !== undefined) updateData.fiber = updates.fiber;

    const { data, error } = await supabase
      .from('fridge_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update amount left (quick update for consumption)
   */
  updateAmountLeft: async (id, amountLeft) => {
    const { data, error } = await supabase
      .from('fridge_items')
      .update({ amount_left: amountLeft })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete fridge item
   */
  delete: async id => {
    const { error } = await supabase.from('fridge_items').delete().eq('id', id);

    if (error) throw error;
    return true;
  },

  /**
   * Search items by name
   */
  search: async query => {
    const { data, error } = await supabase
      .from('fridge_items')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name');

    if (error) throw error;
    return data;
  },

  /**
   * Get fridge stats
   */
  getStats: async () => {
    const today = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const threeDaysStr = threeDaysLater.toISOString().split('T')[0];

    // Get all items for stats
    const { data: items, error } = await supabase
      .from('fridge_items')
      .select('*');

    if (error) throw error;

    const total = items.length;
    const expiring = items.filter(
      i => i.expiry_date <= threeDaysStr && i.expiry_date >= today,
    ).length;
    const expired = items.filter(i => i.expiry_date < today).length;
    const lowStock = items.filter(i => i.amount_left <= 25).length;

    return { total, expiring, expired, lowStock };
  },

  /**
   * Subscribe to real-time changes
   */
  subscribe: callback => {
    return supabase
      .channel('fridge_items_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fridge_items' },
        payload => callback(payload),
      )
      .subscribe();
  },
};

export default fridgeService;
