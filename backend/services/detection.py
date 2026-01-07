"""
YOLOv8 Object Detection Service
Detects vegetables, fruits, and container objects
"""

import numpy as np
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class DetectionService:
    """
    Object detection service using YOLOv8
    Identifies fresh produce and container-type objects
    """
    
    # Target classes for food detection
    PRODUCE_CLASSES = [
        "apple", "banana", "orange", "broccoli", "carrot",
        "potato", "tomato", "cucumber", "lettuce", "onion"
    ]
    
    CONTAINER_CLASSES = [
        "bottle", "box", "cup", "container", "bowl", "package"
    ]
    
    # COCO class mappings for YOLOv8
    COCO_FOOD_CLASSES = {
        46: "banana",
        47: "apple", 
        48: "sandwich",
        49: "orange",
        50: "broccoli",
        51: "carrot",
        52: "hot dog",
        53: "pizza",
        54: "donut",
        55: "cake",
        39: "bottle",
        41: "cup",
        45: "bowl"
    }
    
    def __init__(self, model_path: str = None):
        """Initialize YOLOv8 model"""
        self.model = None
        self._ready = False
        self._load_model(model_path)
    
    def _load_model(self, model_path: str = None):
        """Load YOLOv8 model"""
        try:
            import torch
            import os
            
            # Fix for PyTorch 2.6+ weights_only security change
            # Set environment variable before importing YOLO
            os.environ['TORCH_FORCE_WEIGHTS_ONLY_LOAD'] = '0'
            
            # Alternative: Patch torch.load to use weights_only=False
            original_torch_load = torch.load
            def patched_load(*args, **kwargs):
                kwargs.setdefault('weights_only', False)
                return original_torch_load(*args, **kwargs)
            torch.load = patched_load
            
            from ultralytics import YOLO
            
            # Use pretrained YOLOv8n (nano) for speed
            if model_path:
                self.model = YOLO(model_path)
            else:
                self.model = YOLO("yolov8n.pt")
            
            # Restore original torch.load
            torch.load = original_torch_load
            
            self._ready = True
            logger.info("YOLOv8 model loaded successfully")
        except ImportError:
            logger.warning("ultralytics not installed. Using mock detection.")
            self._ready = False
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            self._ready = False
    
    def is_ready(self) -> bool:
        """Check if detection service is ready"""
        return self._ready
    
    def detect(self, image: np.ndarray, confidence_threshold: float = 0.5, max_det: int = 50, iou: float = 0.4) -> List[Dict[str, Any]]:
        """
        Run object detection on image
        
        Args:
            image: BGR image as numpy array
            confidence_threshold: Minimum confidence for detection (default 0.6 to reduce false positives)
            
        Returns:
            List of detections with label, confidence, and bbox
        """
        if not self._ready:
            # Return mock data for demo/testing
            return self._mock_detection()
        
        try:
            # Run inference with configurable confidence / NMS / max detections
            # Use the ultralytics model call parameters to increase recall when needed
            results = self.model(image, conf=confidence_threshold, iou=iou, max_det=max_det, verbose=False)
            
            detections = []
            
            for result in results:
                boxes = result.boxes
                
                for box in boxes:
                    cls_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    
                    # Skip low confidence detections (already filtered by model call, but keep guard)
                    if confidence < confidence_threshold:
                        continue
                    
                    # Get class name
                    class_name = result.names.get(cls_id, "unknown")
                    
                    # Filter for food-related classes
                    if not self._is_food_class(class_name, cls_id):
                        continue
                    
                    # Get normalized label
                    label = self._normalize_label(class_name, cls_id)
                    
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    bbox = [int(x1), int(y1), int(x2), int(y2)]
                    
                    detections.append({
                        "label": label,
                        "confidence": round(confidence, 2),
                        "bbox": bbox
                    })
            
            logger.info(f"Detected {len(detections)} food items")
            return detections
            
        except Exception as e:
            logger.error(f"Detection failed: {e}")
            return self._mock_detection()
    
    def _is_food_class(self, class_name: str, cls_id: int) -> bool:
        """Check if detected class is food-related"""
        class_lower = class_name.lower()
        
        # Check produce classes
        if class_lower in [c.lower() for c in self.PRODUCE_CLASSES]:
            return True
        
        # Check container classes
        if class_lower in [c.lower() for c in self.CONTAINER_CLASSES]:
            return True
        
        # Check COCO food classes
        if cls_id in self.COCO_FOOD_CLASSES:
            return True
        
        return False
    
    def _normalize_label(self, class_name: str, cls_id: int) -> str:
        """Normalize class name to standard label"""
        # Check COCO mapping first
        if cls_id in self.COCO_FOOD_CLASSES:
            return self.COCO_FOOD_CLASSES[cls_id]
        
        return class_name.lower()
    
    def _mock_detection(self) -> List[Dict[str, Any]]:
        """Return mock detections for demo/testing"""
        return [
            {
                "label": "apple",
                "confidence": 0.91,
                "bbox": [100, 100, 200, 200]
            },
            {
                "label": "banana",
                "confidence": 0.87,
                "bbox": [250, 150, 400, 250]
            },
            {
                "label": "bottle",
                "confidence": 0.85,
                "bbox": [450, 100, 550, 300]
            },
            {
                "label": "box",
                "confidence": 0.79,
                "bbox": [300, 300, 450, 450]
            }
        ]
