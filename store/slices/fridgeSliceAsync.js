import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fridgeService } from '../../src/services/fridgeService';

// ==================== ASYNC THUNKS ====================

export const fetchFridgeItems = createAsyncThunk(
  'fridge/fetchItems',
  async (_, { rejectWithValue }) => {
    try {
      console.log('fetchFridgeItems thunk called');
      const items = await fridgeService.getAll();
      console.log('fetchFridgeItems got:', items?.length, 'items');
      return items || [];
    } catch (error) {
      console.error('fetchFridgeItems error:', error);
      return rejectWithValue(error.message);
    }
  },
);

export const addFridgeItem = createAsyncThunk(
  'fridge/addItem',
  async (item, { rejectWithValue }) => {
    try {
      console.log('addFridgeItem thunk called with:', item);
      const newItem = await fridgeService.add(item);
      console.log('addFridgeItem result:', newItem);
      return newItem;
    } catch (error) {
      console.error('addFridgeItem error:', error);
      return rejectWithValue(error.message);
    }
  },
);

export const updateFridgeItem = createAsyncThunk(
  'fridge/updateItem',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const updatedItem = await fridgeService.update(id, updates);
      return updatedItem;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteFridgeItem = createAsyncThunk(
  'fridge/deleteItem',
  async (id, { rejectWithValue }) => {
    try {
      await fridgeService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateItemAmount = createAsyncThunk(
  'fridge/updateAmount',
  async ({ id, amountLeft }, { rejectWithValue }) => {
    try {
      const updatedItem = await fridgeService.updateAmountLeft(id, amountLeft);
      return updatedItem;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchFridgeStats = createAsyncThunk(
  'fridge/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await fridgeService.getStats();
      return stats;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// ==================== SLICE ====================

const initialState = {
  items: [],
  stats: {
    total: 0,
    expiring: 0,
    expired: 0,
    lowStock: 0,
  },
  selectedCategory: 'all',
  searchQuery: '',
  loading: false,
  error: null,
};

const fridgeSlice = createSlice({
  name: 'fridge',
  initialState,
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
    // For offline/optimistic updates
    optimisticAddItem: (state, action) => {
      state.items.unshift(action.payload);
    },
    optimisticRemoveItem: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    optimisticUpdateItem: (state, action) => {
      const index = state.items.findIndex(
        item => item.id === action.payload.id,
      );
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload.updates,
        };
      }
    },
  },
  extraReducers: builder => {
    builder
      // Fetch items
      .addCase(fetchFridgeItems.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFridgeItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          amountLeft: item.amount_left / 100, // Convert from percentage
          purchaseDate: item.purchase_date,
          expiryDate: item.expiry_date,
          image: item.image_url,
          notes: item.notes,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber,
        }));
      })
      .addCase(fetchFridgeItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add item
      .addCase(addFridgeItem.pending, state => {
        state.loading = true;
      })
      .addCase(addFridgeItem.fulfilled, (state, action) => {
        state.loading = false;
        const item = action.payload;
        state.items.unshift({
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          amountLeft: item.amount_left / 100,
          purchaseDate: item.purchase_date,
          expiryDate: item.expiry_date,
          image: item.image_url,
          notes: item.notes,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber,
        });
      })
      .addCase(addFridgeItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update item
      .addCase(updateFridgeItem.fulfilled, (state, action) => {
        const item = action.payload;
        const index = state.items.findIndex(i => i.id === item.id);
        if (index !== -1) {
          state.items[index] = {
            id: item.id,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            amountLeft: item.amount_left / 100,
            purchaseDate: item.purchase_date,
            expiryDate: item.expiry_date,
            image: item.image_url,
            notes: item.notes,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            fiber: item.fiber,
          };
        }
      })

      // Delete item
      .addCase(deleteFridgeItem.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      })

      // Update amount
      .addCase(updateItemAmount.fulfilled, (state, action) => {
        const item = action.payload;
        const index = state.items.findIndex(i => i.id === item.id);
        if (index !== -1) {
          state.items[index].amountLeft = item.amount_left / 100;
        }
      })

      // Fetch stats
      .addCase(fetchFridgeStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

// ==================== SELECTORS ====================

export const selectAllItems = state => state.fridge.items;
export const selectFridgeLoading = state => state.fridge.loading;
export const selectFridgeError = state => state.fridge.error;
export const selectFridgeStats = state => state.fridge.stats;
export const selectSelectedCategory = state => state.fridge.selectedCategory;
export const selectSearchQuery = state => state.fridge.searchQuery;

export const selectFilteredItems = state => {
  const { items, selectedCategory, searchQuery } = state.fridge;

  return items.filter(item => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
};

export const selectExpiringItems = state => {
  const today = new Date();
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  return state.fridge.items.filter(item => {
    const expiryDate = new Date(item.expiryDate);
    return expiryDate >= today && expiryDate <= threeDaysLater;
  });
};

export const selectExpiredItems = state => {
  const today = new Date();
  return state.fridge.items.filter(item => {
    const expiryDate = new Date(item.expiryDate);
    return expiryDate < today;
  });
};

export const selectLowStockItems = state => {
  return state.fridge.items.filter(item => item.amountLeft <= 0.25);
};

export const selectItemsByCategory = state => {
  const items = state.fridge.items;
  const grouped = {};

  items.forEach(item => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  });

  return grouped;
};

export const {
  setSelectedCategory,
  setSearchQuery,
  clearError,
  optimisticAddItem,
  optimisticRemoveItem,
  optimisticUpdateItem,
} = fridgeSlice.actions;

export default fridgeSlice.reducer;
