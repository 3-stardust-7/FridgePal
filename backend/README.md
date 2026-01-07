# FridgePal Backend

Offline AI-powered Smart Fridge Assistant Backend

## Overview

This backend server receives images of fridge contents from the React Native app, performs object detection using YOLOv8, runs OCR on packaged items, and returns structured inventory data.

## Features

- 🔍 **Object Detection**: YOLOv8 for detecting fruits, vegetables, and containers
- 📝 **OCR**: Tesseract for reading text on packaged items
- 🧠 **Food Inference**: Rule-based mapping of OCR text to food items
- ⏰ **Expiry Estimation**: Heuristic-based expiry day estimation
- 🚀 **Fast API**: High-performance async API with FastAPI

## Requirements

- Python 3.9+
- Tesseract OCR installed on system
- ~2GB disk space for YOLO model

## Installation

### 1. Install Tesseract OCR

**Windows:**
```bash
# Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
# Add to PATH after installation
```

**macOS:**
```bash
brew install tesseract
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

### 2. Set up Python Environment

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Download YOLOv8 Model

The model will be automatically downloaded on first run, or you can pre-download:

```bash
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

## Running the Server

```bash
# Make sure virtual environment is activated
# Windows:
venv\Scripts\activate

# Start the server
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server will be available at `http://0.0.0.0:8000`

## API Endpoints

### Health Check

```
GET /
GET /health
```

### Detect Food Items

```
POST /detect
Content-Type: application/json

{
  "image": "base64_encoded_image_string"
}
```

**Response:**
```json
{
  "detected_items": [
    {
      "category": "fruit",
      "label": "apple",
      "confidence": 0.91,
      "extra": null
    },
    {
      "category": "packaged",
      "label": "Milk Packet",
      "confidence": 0.85,
      "extra": "AMUL MILK"
    }
  ]
}
```

### Add to Inventory

```
POST /inventory/add
Content-Type: application/json

[
  {
    "category": "fruit",
    "label": "apple",
    "confidence": 0.91
  }
]
```

## Connecting from React Native App

1. Find your laptop's IP address:
   - Windows: `ipconfig`
   - macOS/Linux: `ifconfig` or `ip addr`

2. Update the app to use: `http://<YOUR_LAPTOP_IP>:8000`

3. Ensure phone and laptop are on the same network (Wi-Fi or USB tethering)

## Project Structure

```
backend/
├── main.py              # FastAPI application
├── models/
│   ├── __init__.py
│   └── schemas.py       # Pydantic models
├── services/
│   ├── __init__.py
│   ├── detection.py     # YOLOv8 detection
│   ├── ocr.py          # Tesseract OCR
│   └── food_inference.py # Food inference engine
├── utils/
│   ├── __init__.py
│   └── image_utils.py   # Image processing utilities
├── requirements.txt
└── README.md
```

## Demo Mode

If YOLOv8 or Tesseract is not available, the services will return mock data for demo purposes. This allows testing the API flow without full AI setup.

## Troubleshooting

### "ModuleNotFoundError: No module named 'cv2'"
```bash
pip install opencv-python
```

### "tesseract is not installed or not in PATH"
Ensure Tesseract is installed and added to system PATH.

### "Connection refused" from React Native app
- Check firewall settings
- Verify laptop IP address
- Ensure both devices are on same network
- Try disabling Windows Defender temporarily

### YOLO model download issues
```bash
# Manual download
pip install gdown
gdown https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt
```

## License

MIT License - Hackathon MVP
