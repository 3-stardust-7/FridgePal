"""
Image processing utilities
"""

import numpy as np
import cv2
import base64
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)


def decode_base64_image(base64_string: str) -> np.ndarray:
    """
    Decode base64 image string to OpenCV BGR format
    
    Args:
        base64_string: Base64 encoded image string
        
    Returns:
        BGR image as numpy array
        
    Raises:
        ValueError: If decoding fails
    """
    try:
        # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_string)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        
        # Decode to OpenCV BGR format
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise ValueError("Failed to decode image - invalid image data")
        
        return image
        
    except Exception as e:
        logger.error(f"Image decoding failed: {e}")
        raise ValueError(f"Image decoding failed: {str(e)}")


def encode_image_base64(image: np.ndarray, format: str = ".jpg", quality: int = 90) -> str:
    """
    Encode OpenCV image to base64 string
    
    Args:
        image: BGR image as numpy array
        format: Image format (.jpg, .png)
        quality: JPEG quality (0-100)
        
    Returns:
        Base64 encoded string
    """
    try:
        encode_params = [cv2.IMWRITE_JPEG_QUALITY, quality] if format == ".jpg" else []
        _, buffer = cv2.imencode(format, image, encode_params)
        base64_string = base64.b64encode(buffer).decode('utf-8')
        return base64_string
    except Exception as e:
        logger.error(f"Image encoding failed: {e}")
        raise ValueError(f"Image encoding failed: {str(e)}")


def resize_image(image: np.ndarray, max_size: int = 800) -> np.ndarray:
    """
    Resize image while maintaining aspect ratio
    
    Args:
        image: BGR image as numpy array
        max_size: Maximum dimension (width or height)
        
    Returns:
        Resized image
    """
    height, width = image.shape[:2]
    
    if max(height, width) <= max_size:
        return image
    
    if width > height:
        new_width = max_size
        new_height = int(height * max_size / width)
    else:
        new_height = max_size
        new_width = int(width * max_size / height)
    
    resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
    return resized


def crop_region(image: np.ndarray, bbox: Tuple[int, int, int, int], padding: int = 5) -> np.ndarray:
    """
    Crop region from image with optional padding
    
    Args:
        image: BGR image as numpy array
        bbox: Bounding box (x1, y1, x2, y2)
        padding: Extra pixels to include around bbox
        
    Returns:
        Cropped image region
    """
    height, width = image.shape[:2]
    x1, y1, x2, y2 = bbox
    
    # Add padding with bounds checking
    x1 = max(0, x1 - padding)
    y1 = max(0, y1 - padding)
    x2 = min(width, x2 + padding)
    y2 = min(height, y2 + padding)
    
    return image[y1:y2, x1:x2]


def enhance_for_ocr(image: np.ndarray) -> np.ndarray:
    """
    Enhance image for better OCR results
    
    Args:
        image: BGR image as numpy array
        
    Returns:
        Enhanced grayscale image
    """
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    
    # Denoise
    denoised = cv2.fastNlMeansDenoising(enhanced, None, 10, 7, 21)
    
    # Sharpen
    kernel = np.array([[-1, -1, -1],
                       [-1,  9, -1],
                       [-1, -1, -1]])
    sharpened = cv2.filter2D(denoised, -1, kernel)
    
    return sharpened


def draw_detections(image: np.ndarray, detections: list) -> np.ndarray:
    """
    Draw detection bounding boxes on image
    
    Args:
        image: BGR image as numpy array
        detections: List of detection dictionaries
        
    Returns:
        Image with drawn bounding boxes
    """
    result = image.copy()
    
    for det in detections:
        label = det.get("label", "unknown")
        confidence = det.get("confidence", 0)
        bbox = det.get("bbox", [0, 0, 0, 0])
        
        x1, y1, x2, y2 = bbox
        
        # Draw rectangle
        color = (0, 255, 0)  # Green
        cv2.rectangle(result, (x1, y1), (x2, y2), color, 2)
        
        # Draw label
        label_text = f"{label}: {confidence:.2f}"
        label_size = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0]
        
        cv2.rectangle(result, (x1, y1 - 20), (x1 + label_size[0], y1), color, -1)
        cv2.putText(result, label_text, (x1, y1 - 5), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
    
    return result


def validate_image(image: np.ndarray) -> Tuple[bool, Optional[str]]:
    """
    Validate image for processing
    
    Args:
        image: Image as numpy array
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if image is None:
        return False, "Image is None"
    
    if not isinstance(image, np.ndarray):
        return False, "Image is not a numpy array"
    
    if image.size == 0:
        return False, "Image is empty"
    
    if len(image.shape) != 3:
        return False, "Image must be 3-dimensional (BGR)"
    
    if image.shape[2] != 3:
        return False, "Image must have 3 color channels"
    
    height, width = image.shape[:2]
    
    if height < 50 or width < 50:
        return False, "Image too small (minimum 50x50)"
    
    if height > 4000 or width > 4000:
        return False, "Image too large (maximum 4000x4000)"
    
    return True, None
