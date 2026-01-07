// Export all services
export { authService } from './authService';
export { fridgeService } from './fridgeService';
export { recipeService } from './recipeService';
export { nutritionService } from './nutritionService';
export { profileService } from './profileService';
export { geminiService } from './geminiService';
export { default as detectionService } from './detectionService';
export { detectFoodItems, checkBackendHealth, addToInventory, processDetectionResults } from './detectionService';
