"""Test script to verify YOLOv8 is working"""
import torch
import os

# Fix for PyTorch 2.6+ weights_only security change
os.environ['TORCH_FORCE_WEIGHTS_ONLY_LOAD'] = '0'

# Patch torch.load to use weights_only=False
original_torch_load = torch.load
def patched_load(*args, **kwargs):
    kwargs.setdefault('weights_only', False)
    return original_torch_load(*args, **kwargs)
torch.load = patched_load

# Now import and load YOLO
from ultralytics import YOLO

print("Loading YOLOv8 model...")
model = YOLO("yolov8n.pt")
print("✅ YOLOv8 loaded successfully!")
print(f"Model type: {type(model)}")
print(f"Model names (first 10): {list(model.names.values())[:10]}")

# Restore original
torch.load = original_torch_load
print("\n✅ YOLOv8 is ready for detection!")
