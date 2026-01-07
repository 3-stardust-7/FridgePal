/**
 * Detection Service
 * Handles communication with local AI backend for food detection
 */

import { BACKEND_CONFIG, API_URLS } from '../config/backend';

/**
 * Send image to backend for food detection
 * @param {string} base64Image - Base64 encoded image string
 * @returns {Promise<Object>} Detection results
 */
export const detectFoodItems = async (base64Image) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BACKEND_CONFIG.TIMEOUT);

    const response = await fetch(API_URLS.DETECT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Detection failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Detection request timed out. Check if backend is running.');
    }
    throw error;
  }
};

/**
 * Check if backend server is healthy
 * @returns {Promise<Object>} Health status
 */
export const checkBackendHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(API_URLS.HEALTH, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Backend unhealthy');
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Backend not reachable');
    }
    throw error;
  }
};

/**
 * Add detected items to inventory
 * @param {Array} items - Array of detected items
 * @returns {Promise<Object>} Inventory response with expiry estimates
 */
export const addToInventory = async (items) => {
  try {
    const response = await fetch(API_URLS.INVENTORY_ADD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(items),
    });

    if (!response.ok) {
      throw new Error('Failed to add items to inventory');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Process detection results and format for app use
 * @param {Object} detectionResponse - Raw detection response from backend
 * @returns {Array} Formatted items for fridge inventory
 */
export const processDetectionResults = (detectionResponse) => {
  const { detected_items } = detectionResponse;
  
  return detected_items.map((item, index) => ({
    id: `detected-${Date.now()}-${index}`,
    name: item.label,
    category: mapCategory(item.category),
    confidence: item.confidence,
    ocrText: item.extra || null,
    detectedAt: new Date().toISOString(),
  }));
};

/**
 * Map backend category to app category
 */
const mapCategory = (backendCategory) => {
  const categoryMap = {
    'fruit': 'fruits',
    'vegetable': 'vegetables',
    'packaged': 'packaged',
  };
  return categoryMap[backendCategory] || 'other';
};

export default {
  detectFoodItems,
  checkBackendHealth,
  addToInventory,
  processDetectionResults,
};
