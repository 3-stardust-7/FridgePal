/**
 * Local AI Backend Configuration
 * Used for offline food detection via YOLOv8
 */

// Backend server running on laptop
// Change this IP to your laptop's IP address when on different networks
export const BACKEND_CONFIG = {
  // Your laptop's IP address
  BASE_URL: 'http://10.169.34.52:8000',
  
  // API endpoints
  ENDPOINTS: {
    DETECT: '/detect',
    HEALTH: '/health',
    INVENTORY_ADD: '/inventory/add',
  },
  
  // Request timeout (ms)
  TIMEOUT: 30000,
  
  // Image settings
  IMAGE: {
    QUALITY: 0.7,
    FORMAT: 'jpeg',
  },
};

// Full endpoint URLs
export const API_URLS = {
  DETECT: `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.DETECT}`,
  HEALTH: `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.HEALTH}`,
  INVENTORY_ADD: `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.INVENTORY_ADD}`,
};

export default BACKEND_CONFIG;
