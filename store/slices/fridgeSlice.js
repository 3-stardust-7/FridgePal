import { createSlice } from '@reduxjs/toolkit';
import { generateId } from '../../src/utils/helpers';

// Sample fridge items data
const initialItems = [
  {
    id: '1',
    name: 'Milk',
    category: 'dairy',
    quantity: 2,
    unit: 'L',
    amountLeft: 0.75,
    purchaseDate: '2024-12-28',
    expiryDate: '2025-01-05',
    image:
      'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&h=200&fit=crop',
    notes: 'Whole milk',
    calories: 149,
    protein: 8,
    carbs: 12,
    fat: 8,
  },
  {
    id: '2',
    name: 'Eggs',
    category: 'dairy',
    quantity: 12,
    unit: 'pieces',
    amountLeft: 0.5,
    purchaseDate: '2024-12-26',
    expiryDate: '2025-01-10',
    image:
      'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200&h=200&fit=crop',
    notes: 'Free range',
    calories: 78,
    protein: 6,
    carbs: 1,
    fat: 5,
  },
  {
    id: '3',
    name: 'Spinach',
    category: 'vegetables',
    quantity: 300,
    unit: 'g',
    amountLeft: 0.3,
    purchaseDate: '2024-12-29',
    expiryDate: '2025-01-02',
    image:
      'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200&h=200&fit=crop',
    notes: 'Fresh baby spinach',
    calories: 23,
    protein: 3,
    carbs: 4,
    fat: 0,
  },
  {
    id: '4',
    name: 'Chicken Breast',
    category: 'meat',
    quantity: 500,
    unit: 'g',
    amountLeft: 0.9,
    purchaseDate: '2024-12-30',
    expiryDate: '2025-01-03',
    image:
      'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&h=200&fit=crop',
    notes: 'Boneless',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 4,
  },
  {
    id: '5',
    name: 'Greek Yogurt',
    category: 'dairy',
    quantity: 500,
    unit: 'g',
    amountLeft: 0.6,
    purchaseDate: '2024-12-27',
    expiryDate: '2025-01-08',
    image:
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop',
    notes: 'Plain, no sugar',
    calories: 100,
    protein: 17,
    carbs: 6,
    fat: 1,
  },
  {
    id: '6',
    name: 'Bell Peppers',
    category: 'vegetables',
    quantity: 3,
    unit: 'pieces',
    amountLeft: 1.0,
    purchaseDate: '2024-12-29',
    expiryDate: '2025-01-06',
    image:
      'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=200&h=200&fit=crop',
    notes: 'Mixed colors',
    calories: 31,
    protein: 1,
    carbs: 6,
    fat: 0,
  },
  {
    id: '7',
    name: 'Cheddar Cheese',
    category: 'dairy',
    quantity: 200,
    unit: 'g',
    amountLeft: 0.8,
    purchaseDate: '2024-12-25',
    expiryDate: '2025-01-15',
    image:
      'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=200&h=200&fit=crop',
    notes: 'Sharp cheddar',
    calories: 113,
    protein: 7,
    carbs: 0,
    fat: 9,
  },
  {
    id: '8',
    name: 'Tomatoes',
    category: 'vegetables',
    quantity: 6,
    unit: 'pieces',
    amountLeft: 0.5,
    purchaseDate: '2024-12-28',
    expiryDate: '2025-01-04',
    image:
      'https://images.unsplash.com/photo-1546470427-f5c9e4460a5d?w=200&h=200&fit=crop',
    notes: 'Roma tomatoes',
    calories: 18,
    protein: 1,
    carbs: 4,
    fat: 0,
  },
  {
    id: '9',
    name: 'Orange Juice',
    category: 'beverages',
    quantity: 1,
    unit: 'L',
    amountLeft: 0.4,
    purchaseDate: '2024-12-26',
    expiryDate: '2025-01-05',
    image:
      'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop',
    notes: 'Fresh squeezed',
    calories: 112,
    protein: 2,
    carbs: 26,
    fat: 0,
  },
  {
    id: '10',
    name: 'Butter',
    category: 'dairy',
    quantity: 250,
    unit: 'g',
    amountLeft: 0.7,
    purchaseDate: '2024-12-20',
    expiryDate: '2025-02-01',
    image:
      'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=200&h=200&fit=crop',
    notes: 'Unsalted',
    calories: 102,
    protein: 0,
    carbs: 0,
    fat: 12,
  },
];

const fridgeSlice = createSlice({
  name: 'fridge',
  initialState: {
    items: initialItems,
    selectedCategory: 'all',
    searchQuery: '',
    sortBy: 'expiry', // expiry, name, category
    isLoading: false,
  },
  reducers: {
    addItem: (state, action) => {
      const newItem = {
        ...action.payload,
        id: generateId(),
        amountLeft: 1.0,
      };
      state.items.push(newItem);
    },
    updateItem: (state, action) => {
      const index = state.items.findIndex(
        item => item.id === action.payload.id,
      );
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    },
    removeItem: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    updateAmountLeft: (state, action) => {
      const { id, amountLeft } = action.payload;
      const item = state.items.find(item => item.id === id);
      if (item) {
        item.amountLeft = amountLeft;
      }
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    consumeItem: (state, action) => {
      const { id, percentage } = action.payload;
      const item = state.items.find(item => item.id === id);
      if (item) {
        item.amountLeft = Math.max(0, item.amountLeft - percentage);
        if (item.amountLeft <= 0) {
          state.items = state.items.filter(i => i.id !== id);
        }
      }
    },
  },
});

export const {
  addItem,
  updateItem,
  removeItem,
  updateAmountLeft,
  setSelectedCategory,
  setSearchQuery,
  setSortBy,
  consumeItem,
} = fridgeSlice.actions;

// Selectors
export const selectAllItems = state => state.fridge.items;
export const selectSelectedCategory = state => state.fridge.selectedCategory;
export const selectSearchQuery = state => state.fridge.searchQuery;

export const selectFilteredItems = state => {
  let items = state.fridge.items;

  // Filter by category
  if (state.fridge.selectedCategory !== 'all') {
    items = items.filter(
      item => item.category === state.fridge.selectedCategory,
    );
  }

  // Filter by search
  if (state.fridge.searchQuery) {
    const query = state.fridge.searchQuery.toLowerCase();
    items = items.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query),
    );
  }

  // Sort
  switch (state.fridge.sortBy) {
    case 'expiry':
      items = [...items].sort(
        (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate),
      );
      break;
    case 'name':
      items = [...items].sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'amount':
      items = [...items].sort((a, b) => a.amountLeft - b.amountLeft);
      break;
    default:
      break;
  }

  return items;
};

export const selectExpiringItems = state => {
  const today = new Date();
  return state.fridge.items
    .filter(item => {
      const expiry = new Date(item.expiryDate);
      const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 3;
    })
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
};

export const selectExpiredItems = state => {
  const today = new Date();
  return state.fridge.items.filter(item => new Date(item.expiryDate) < today);
};

export default fridgeSlice.reducer;
