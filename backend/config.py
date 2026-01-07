"""
Backend configuration settings
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Application configuration"""
    
    # Server settings
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    
    # Model settings
    YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
    DETECTION_CONFIDENCE_THRESHOLD = float(os.getenv("DETECTION_CONFIDENCE", 0.5))
    
    # OCR settings
    TESSERACT_PATH = os.getenv("TESSERACT_PATH", None)
    OCR_CONFIDENCE_THRESHOLD = float(os.getenv("OCR_CONFIDENCE", 0.6))
    
    # Image processing
    MAX_IMAGE_SIZE = int(os.getenv("MAX_IMAGE_SIZE", 1024))
    JPEG_QUALITY = int(os.getenv("JPEG_QUALITY", 90))
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")


# Create config instance
config = Config()
