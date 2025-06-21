from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError
import torch
from transformers import BlipProcessor, BlipForImageTextRetrieval
import io
import logging
import traceback

app = FastAPI()

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

processor = BlipProcessor.from_pretrained("Salesforce/blip-itm-base-coco")
model = BlipForImageTextRetrieval.from_pretrained("Salesforce/blip-itm-base-coco")
model.eval()
SIMILARITY_THRESHOLD = 0.3

def predict_label_pt(image_bytes, text: str, threshold: float = SIMILARITY_THRESHOLD):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except UnidentifiedImageError as e:
        logging.error(f"Image cannot be opened: {e}")
        raise ValueError("Invalid image file")
    inputs = processor(images=image, text=text, return_tensors="pt", padding=True, truncation=True)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = model(**inputs)
    if hasattr(outputs, 'logits_per_image'):
        cos_sim = outputs.logits_per_image.item()
    elif hasattr(outputs, 'itm_score'):
        itm_score = outputs.itm_score
        if itm_score.numel() == 1:
            cos_sim = itm_score.item()
        else:
            cos_sim = itm_score.mean().item()
    else:
        raise ValueError("Similarity score not found in model output")
    label = "Genuine" if cos_sim >= threshold else "Fake"
    return label, cos_sim

@app.post("/predict")
async def predict(image: UploadFile, description: str = Form(...)):
    try:
        image_bytes = await image.read()
        image_info = f"{image.filename} ({len(image_bytes)} bytes)"
        desc_preview = (description[:80] + '...') if len(description) > 80 else description

        label, score = predict_label_pt(image_bytes, description)

        logging.info(f"INPUT - image: {image_info}, description: \"{desc_preview}\"")
        logging.info(f"OUTPUT - label: {label}, score: {score:.4f}")

        return JSONResponse({
            "label": label,
            "score": score
        })
    except Exception as exc:
        logging.error("Exception in /predict endpoint:\n" + traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": "Internal Server Error", "detail": str(exc)}
        )
