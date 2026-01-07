"""
Pydantic schemas for API request/response validation
"""

from pydantic import BaseModel
from typing import List, Optional


class DetectionRequest(BaseModel):
    """Request body for /detect endpoint"""
    image: str  # base64 encoded image string
    
    class Config:
        json_schema_extra = {
            "example": {
                "image": "base64_encoded_image_string"
            }
        }


class DetectedItem(BaseModel):
    """Single detected food item"""
    category: str  # "vegetable" | "fruit" | "packaged"
    label: str  # e.g., "apple", "Milk Packet"
    confidence: float  # 0.0 to 1.0
    extra: Optional[str] = None  # OCR text if available
    
    class Config:
        json_schema_extra = {
            "example": {
                "category": "fruit",
                "label": "apple",
                "confidence": 0.91,
                "extra": None
            }
        }


class DetectionResponse(BaseModel):
    """Response body for /detect endpoint"""
    detected_items: List[DetectedItem]
    
    class Config:
        json_schema_extra = {
            "example": {
                "detected_items": [
                    {
                        "category": "fruit",
                        "label": "apple",
                        "confidence": 0.91,
                        "extra": None
                    },
                    {
                        "category": "packaged",
                        "label": "Milk Packet",
                        "confidence": 0.85,
                        "extra": "AMUL MILK"
                    }
                ]
            }
        }


class InventoryItem(BaseModel):
    """Item in fridge inventory"""
    label: str
    category: str
    estimated_expiry_days: int
    quantity: int = 1
    added_at: str


class InventoryResponse(BaseModel):
    """Inventory response"""
    inventory: List[InventoryItem]
