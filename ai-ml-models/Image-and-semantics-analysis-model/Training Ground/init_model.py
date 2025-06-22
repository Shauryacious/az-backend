# Load model directly
from transformers import AutoProcessor, BlipForImageTextRetrieval

processor = AutoProcessor.from_pretrained("Salesforce/blip-itm-large-coco",useFast=True)
model = BlipForImageTextRetrieval.from_pretrained("Salesforce/blip-itm-large-coco")
model.eval()
print("Model and processor loaded successfully.")