"""
Tesseract OCR Service
Extracts text from cropped container regions
"""

import numpy as np
import cv2
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class OCRService:
    """
    OCR service using Tesseract
    Extracts text from packaged food containers
    """
    
    def __init__(self):
        """Initialize Tesseract OCR"""
        self._ready = False
        self._initialize_tesseract()
    
    def _initialize_tesseract(self):
        """Initialize Tesseract OCR engine"""
        try:
            import pytesseract
            
            # Set Tesseract path for Windows (custom installation location)
            pytesseract.pytesseract.tesseract_cmd = r'D:\Tesseract\tesseract.exe'
            
            # Test if Tesseract is installed
            pytesseract.get_tesseract_version()
            self._ready = True
            logger.info("Tesseract OCR initialized successfully")
        except ImportError:
            logger.warning("pytesseract not installed. OCR will use mock data.")
            self._ready = False
        except Exception as e:
            logger.warning(f"Tesseract not available: {e}. OCR will use mock data.")
            self._ready = False
    
    def is_ready(self) -> bool:
        """Check if OCR service is ready"""
        return self._ready
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for better OCR results
        
        Args:
            image: BGR image as numpy array
            
        Returns:
            Preprocessed grayscale image
        """
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply slight blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(blurred)
        
        # Apply adaptive thresholding with better parameters
        thresh = cv2.adaptiveThreshold(
            enhanced, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11, 2
        )
        
        # Upscale for better OCR accuracy
        height, width = thresh.shape
        if height < 100 or width < 100:
            scale = max(100 / height, 100 / width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            thresh = cv2.resize(thresh, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
        else:
            # For larger images, slightly enlarge for better text recognition
            thresh = cv2.resize(thresh, (int(width * 1.2), int(height * 1.2)), interpolation=cv2.INTER_CUBIC)
        
        return thresh
    
    def extract_text(self, image: np.ndarray) -> Optional[str]:
        """
        Extract text from image region with improved preprocessing
        
        Args:
            image: BGR image as numpy array (cropped container region)
            
        Returns:
            Extracted text or None if no text found
        """
        if image is None or image.size == 0:
            return None
        
        if not self._ready:
            # Return mock OCR result for demo
            return self._mock_ocr()
        
        try:
            import pytesseract
            
            # Preprocess image
            processed = self.preprocess_image(image)
            
            # Run Tesseract OCR with improved config for food labels
            # --oem 3: Use both legacy and LSTM OCR engine mode
            # --psm 6: Assume single uniform block of text (better for labels)
            config = '--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 '
            text = pytesseract.image_to_string(processed, config=config)
            
            # Clean up text
            text = self._clean_text(text)
            
            if text:
                logger.info(f"OCR extracted: {text}")
                return text
            
            return None
            
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return None
    
    def _clean_text(self, text: str) -> Optional[str]:
        """Clean and normalize OCR text"""
        if not text:
            return None
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        # Remove special characters except basic punctuation
        cleaned = ''.join(c for c in text if c.isalnum() or c in ' .-')
        
        # Convert to uppercase for easier matching
        cleaned = cleaned.upper().strip()
        
        # Return None if too short (likely noise)
        if len(cleaned) < 2:
            return None
        
        return cleaned
    
    def _mock_ocr(self) -> str:
        """Return mock OCR result for demo"""
        import random
        mock_texts = [
            "AMUL MILK",
            "BREAD",
            "NOODLES",
            "YOGURT",
            "CHEESE",
            "BUTTER"
        ]
        return random.choice(mock_texts)
    
    def extract_text_with_confidence(self, image: np.ndarray) -> dict:
        """
        Extract text with confidence scores
        
        Args:
            image: BGR image as numpy array
            
        Returns:
            Dictionary with text and confidence
        """
        if not self._ready:
            return {"text": self._mock_ocr(), "confidence": 0.75}
        
        try:
            import pytesseract
            
            processed = self.preprocess_image(image)
            
            # Get detailed data
            data = pytesseract.image_to_data(processed, output_type=pytesseract.Output.DICT)
            
            # Combine text with good confidence
            texts = []
            confidences = []
            
            for i, conf in enumerate(data['conf']):
                if int(conf) > 60:  # Confidence threshold
                    text = data['text'][i].strip()
                    if text:
                        texts.append(text)
                        confidences.append(int(conf))
            
            if texts:
                combined_text = ' '.join(texts)
                avg_confidence = sum(confidences) / len(confidences) / 100
                return {
                    "text": self._clean_text(combined_text),
                    "confidence": round(avg_confidence, 2)
                }
            
            return {"text": None, "confidence": 0}
            
        except Exception as e:
            logger.error(f"OCR with confidence failed: {e}")
            return {"text": None, "confidence": 0}
