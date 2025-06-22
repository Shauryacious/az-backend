from PIL import Image
import torch
import torch.nn.functional as F
from transformers import BlipProcessor, BlipForImageTextRetrieval

SIMILARITY_THRESHOLD = 0.3

# Initialize
processor = BlipProcessor.from_pretrained("Salesforce/blip-itm-base-coco")
model     = BlipForImageTextRetrieval.from_pretrained("Salesforce/blip-itm-base-coco")
model.eval()

def predict_label_pt(image_path: str, text: str, threshold: float = SIMILARITY_THRESHOLD):
    # 1. Load & preprocess
    image = Image.open(image_path).convert("RGB")
    inputs = processor(images=image,text=text,return_tensors="pt",padding=True,truncation=True) # type: ignore
    # 2. Send tensors (not processor) to device
    inputs = {k: v.to(model.device) for k, v in inputs.items()}

    # 3. Forward pass with contrastive head
    with torch.no_grad():
        sim_matrix = model(**inputs, use_itm_head=False)[0]

    # 4. Extract score
    cos_sim = sim_matrix.flatten()[0].item()

    # 5. Threshold
    label = "Genuine" if cos_sim >= threshold else "Fake"
    return label, cos_sim

if __name__ == "__main__":
    lbl, score = predict_label_pt("path/to/img.jpg", "a description")
    print(f"Label: {lbl}, Cosine similarity: {score:.4f}")
