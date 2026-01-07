"""
Food Inference Engine
Rule-based inference for packaged foods and expiry estimation
"""

from typing import Optional, List, Dict
import logging

logger = logging.getLogger(__name__)


class FoodInferenceEngine:
    """
    Rule-based food inference engine
    Maps OCR text to food items and estimates expiry
    """
    
    # Keyword to food item mapping
    KEYWORD_MAPPINGS = {
        # Dairy products
        "MILK": "Milk",
        "AMUL": "Milk",
        "DAIRY": "Dairy Product",
        "CURD": "Yogurt",
        "YOGURT": "Yogurt",
        "DAHI": "Yogurt",
        "CHEESE": "Cheese",
        "BUTTER": "Butter",
        "PANEER": "Paneer",
        "CREAM": "Cream",
        
        # Bread and bakery
        "BREAD": "Bread",
        "LOAF": "Bread",
        "TOAST": "Bread",
        "BUN": "Bun",
        "CAKE": "Cake",
        
        # Noodles and pasta
        "NOODLES": "Instant Noodles",
        "MAGGI": "Instant Noodles",
        "PASTA": "Pasta",
        "RAMEN": "Instant Noodles",
        
        # Beverages
        "JUICE": "Juice",
        "WATER": "Water Bottle",
        "SODA": "Soda",
        "COLA": "Soda",
        "PEPSI": "Soda",
        "COKE": "Soda",
        
        # Condiments
        "KETCHUP": "Ketchup",
        "SAUCE": "Sauce",
        "MAYO": "Mayonnaise",
        "MUSTARD": "Mustard",
        
        # Eggs
        "EGG": "Eggs",
        "EGGS": "Eggs",
        
        # Meat and protein
        "CHICKEN": "Chicken",
        "MEAT": "Meat",
        "FISH": "Fish",
        "TOFU": "Tofu",
        
        # Fruits and vegetables (packaged)
        "APPLE": "Apple Juice",
        "ORANGE": "Orange Juice",
        "MANGO": "Mango Pulp",
        
        # Snacks
        "CHIPS": "Chips",
        "BISCUIT": "Biscuits",
        "COOKIE": "Cookies",
        "CHOCOLATE": "Chocolate"
    }
    
    # Default expiry estimation (in days)
    EXPIRY_ESTIMATES = {
        # Fresh produce
        "apple": 7,
        "banana": 5,
        "orange": 14,
        "broccoli": 5,
        "carrot": 14,
        "potato": 21,
        "tomato": 7,
        "cucumber": 7,
        "lettuce": 5,
        "onion": 30,
        
        # Dairy
        "milk": 3,
        "yogurt": 7,
        "cheese": 14,
        "butter": 30,
        "paneer": 7,
        "cream": 7,
        
        # Bakery
        "bread": 5,
        "bun": 3,
        "cake": 3,
        
        # Packaged foods
        "instant noodles": 180,
        "pasta": 365,
        "juice": 7,
        "soda": 180,
        "ketchup": 30,
        "sauce": 30,
        "mayonnaise": 60,
        "chips": 60,
        "biscuits": 90,
        "cookies": 60,
        "chocolate": 180,
        
        # Protein
        "eggs": 21,
        "chicken": 2,
        "meat": 2,
        "fish": 2,
        "tofu": 7,
        
        # Default
        "default": 7
    }
    
    def __init__(self):
        """Initialize food inference engine"""
        logger.info("Food inference engine initialized")
    
    def infer_from_text(self, text: Optional[str]) -> Optional[str]:
        """
        Infer food item from OCR text
        
        Args:
            text: OCR extracted text (uppercase)
            
        Returns:
            Inferred food item name or None
        """
        if not text:
            return None
        
        text_upper = text.upper()
        
        # Check for keyword matches
        for keyword, food_item in self.KEYWORD_MAPPINGS.items():
            if keyword in text_upper:
                logger.info(f"Inferred '{food_item}' from text '{text}'")
                return food_item
        
        # No match found
        logger.info(f"No inference match for text '{text}'")
        return None
    
    def estimate_expiry(self, item_label: str) -> int:
        """
        Estimate expiry days for food item
        
        Args:
            item_label: Food item label
            
        Returns:
            Estimated days until expiry
        """
        label_lower = item_label.lower()
        
        # Direct match
        if label_lower in self.EXPIRY_ESTIMATES:
            return self.EXPIRY_ESTIMATES[label_lower]
        
        # Partial match
        for key, days in self.EXPIRY_ESTIMATES.items():
            if key in label_lower or label_lower in key:
                return days
        
        # Default expiry
        return self.EXPIRY_ESTIMATES["default"]
    
    def deduplicate_items(self, items: List) -> List:
        """
        Remove duplicate detected items
        
        Args:
            items: List of DetectedItem objects
            
        Returns:
            Deduplicated list
        """
        seen = {}
        unique_items = []
        
        for item in items:
            key = (item.category, item.label.lower())
            
            if key not in seen:
                seen[key] = item
                unique_items.append(item)
            else:
                # Keep the one with higher confidence
                if item.confidence > seen[key].confidence:
                    # Replace in unique_items
                    for i, ui in enumerate(unique_items):
                        if (ui.category, ui.label.lower()) == key:
                            unique_items[i] = item
                            seen[key] = item
                            break
        
        logger.info(f"Deduplicated {len(items)} items to {len(unique_items)}")
        return unique_items
    
    def categorize_by_urgency(self, items: List[Dict]) -> Dict[str, List]:
        """
        Categorize items by expiry urgency
        
        Args:
            items: List of inventory items with expiry
            
        Returns:
            Dictionary with urgency categories
        """
        urgent = []      # Expires in 3 days or less
        soon = []        # Expires in 7 days or less
        normal = []      # Expires in more than 7 days
        
        for item in items:
            expiry = item.get("estimated_expiry_days", 7)
            
            if expiry <= 3:
                urgent.append(item)
            elif expiry <= 7:
                soon.append(item)
            else:
                normal.append(item)
        
        return {
            "urgent": urgent,
            "soon": soon,
            "normal": normal
        }
    
    def suggest_recipes(self, items: List[str]) -> List[Dict]:
        """
        Suggest simple recipes based on available items
        (Placeholder for future extension)
        
        Args:
            items: List of available food item labels
            
        Returns:
            List of recipe suggestions
        """
        # Simple rule-based suggestions
        suggestions = []
        
        items_lower = [i.lower() for i in items]
        
        if "banana" in items_lower and "milk" in items_lower:
            suggestions.append({
                "name": "Banana Smoothie",
                "ingredients": ["banana", "milk"],
                "difficulty": "easy"
            })
        
        if "bread" in items_lower and "cheese" in items_lower:
            suggestions.append({
                "name": "Grilled Cheese Sandwich",
                "ingredients": ["bread", "cheese", "butter"],
                "difficulty": "easy"
            })
        
        if "apple" in items_lower:
            suggestions.append({
                "name": "Apple Slices with Honey",
                "ingredients": ["apple", "honey"],
                "difficulty": "easy"
            })
        
        if "instant noodles" in items_lower:
            suggestions.append({
                "name": "Quick Noodles",
                "ingredients": ["instant noodles", "vegetables"],
                "difficulty": "easy"
            })
        
        return suggestions
