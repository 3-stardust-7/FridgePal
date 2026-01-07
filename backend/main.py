"""
FridgePal Backend - FastAPI Server
Offline AI-powered Smart Fridge Assistant
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import base64
import numpy as np
import cv2

from services.detection import DetectionService
from services.ocr import OCRService
from services.food_inference import FoodInferenceEngine
from utils.image_utils import crop_region
from models.schemas import DetectionRequest, DetectionResponse, DetectedItem

app = FastAPI(
    title="FridgePal Backend",
    description="Offline AI-powered Smart Fridge Assistant API",
    version="1.0.0"
)

# CORS middleware for React Native app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
detection_service = DetectionService()
ocr_service = OCRService()
food_inference = FoodInferenceEngine()


def decode_base64_image(base64_string: str) -> np.ndarray:
    """Decode base64 image string to OpenCV BGR format"""
    try:
        # Remove data URL prefix if present
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_string)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        
        # Decode to OpenCV BGR format
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise ValueError("Failed to decode image")
        
        return image
    except Exception as e:
        raise ValueError(f"Image decoding failed: {str(e)}")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "FridgePal Backend",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "detection": detection_service.is_ready(),
            "ocr": ocr_service.is_ready()
        }
    }


@app.post("/detect", response_model=DetectionResponse)
async def detect_items(request: DetectionRequest):
    """
    Main detection endpoint
    Receives base64 image and returns detected food items
    """
    try:
        # Decode base64 image
        image = decode_base64_image(request.image)
        
        # Run object detection (YOLOv8)
        detections = detection_service.detect(image)
        
        detected_items: List[DetectedItem] = []
        
        for detection in detections:
            label = detection["label"]
            confidence = detection["confidence"]
            bbox = detection["bbox"]
            
            # Determine category
            if label in detection_service.PRODUCE_CLASSES:
                category = "fruit" if label in ["apple", "banana", "orange"] else "vegetable"
                detected_items.append(DetectedItem(
                    category=category,
                    label=label,
                    confidence=confidence,
                    extra=None
                ))
            
            elif label in detection_service.CONTAINER_CLASSES:
                # Crop region for OCR with padding to capture label text
                cropped = crop_region(image, bbox, padding=15)
                
                # Run OCR on container region (two-pass: simple, then detailed if empty)
                ocr_text = ocr_service.extract_text(cropped)
                if not ocr_text:
                    ocr_detailed = ocr_service.extract_text_with_confidence(cropped)
                    ocr_text = ocr_detailed.get("text") if ocr_detailed else None
                
                # Infer packaged food from OCR text
                inferred_item = food_inference.infer_from_text(ocr_text)
                
                detected_items.append(DetectedItem(
                    category="packaged",
                    label=inferred_item or f"Unknown {label}",
                    confidence=confidence,
                    extra=ocr_text if ocr_text else None
                ))
        
        # Deduplicate items
        detected_items = food_inference.deduplicate_items(detected_items)
        
        return DetectionResponse(detected_items=detected_items)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


@app.post("/inventory/add")
async def add_to_inventory(items: List[DetectedItem]):
    """Add detected items to inventory with expiry estimation"""
    inventory_items = []
    
    for item in items:
        expiry = food_inference.estimate_expiry(item.label)
        inventory_items.append({
            "label": item.label,
            "category": item.category,
            "estimated_expiry_days": expiry,
            "added_at": "now"
        })
    
    return {"inventory": inventory_items}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
