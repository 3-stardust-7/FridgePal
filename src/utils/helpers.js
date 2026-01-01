// Helper functions for FridgePal

/**
 * Calculate days until expiry
 */
export const getDaysUntilExpiry = expiryDate => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get freshness status based on expiry
 */
export const getFreshnessStatus = expiryDate => {
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0)
    return { status: 'expired', color: '#EF4444', label: 'Expired' };
  if (days <= 2)
    return { status: 'expiring', color: '#F97316', label: 'Use Soon!' };
  if (days <= 5)
    return { status: 'moderate', color: '#F59E0B', label: `${days} days left` };
  return { status: 'fresh', color: '#22C55E', label: `${days} days left` };
};

/**
 * Format date to readable string
 */
export const formatDate = date => {
  const options = { month: 'short', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
};

/**
 * Calculate freshness progress (0-1)
 */
export const calculateFreshnessProgress = (purchaseDate, expiryDate) => {
  const purchase = new Date(purchaseDate).getTime();
  const expiry = new Date(expiryDate).getTime();
  const now = new Date().getTime();

  const totalTime = expiry - purchase;
  const elapsed = now - purchase;
  const remaining = 1 - elapsed / totalTime;

  return Math.max(0, Math.min(1, remaining));
};

/**
 * Generate unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Get items expiring soon (within days)
 */
export const getExpiringItems = (items, withinDays = 3) => {
  return items
    .filter(item => {
      const days = getDaysUntilExpiry(item.expiryDate);
      return days >= 0 && days <= withinDays;
    })
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
};

/**
 * Calculate nutrition totals
 */
export const calculateNutritionTotals = meals => {
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

/**
 * Get greeting based on time
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Calculate match percentage for recipe
 */
export const calculateRecipeMatch = (recipeIngredients, fridgeItems) => {
  const fridgeItemNames = fridgeItems.map(item => item.name.toLowerCase());
  const matchedIngredients = recipeIngredients.filter(ingredient =>
    fridgeItemNames.some(
      name =>
        name.includes(ingredient.toLowerCase()) ||
        ingredient.toLowerCase().includes(name),
    ),
  );
  return Math.round(
    (matchedIngredients.length / recipeIngredients.length) * 100,
  );
};

/**
 * Sort items by expiry (expiring soon first)
 */
export const sortByExpiry = items => {
  return [...items].sort(
    (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate),
  );
};

/**
 * Filter items by category
 */
export const filterByCategory = (items, category) => {
  if (category === 'all') return items;
  return items.filter(item => item.category === category);
};
