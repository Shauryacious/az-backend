from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
import torch.nn.functional as F
import logging
import os

app = FastAPI()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s %(message)s',
)

# Robust path handling
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JOBLIB_DIR = os.path.join(BASE_DIR, 'joblib')

# Load tokenizer and model once at startup
tokenizer = DistilBertTokenizer.from_pretrained(os.path.join(JOBLIB_DIR, 'tokenizer'))
model = DistilBertForSequenceClassification.from_pretrained(
    'distilbert-base-uncased',
    num_labels=2
)
model.load_state_dict(torch.load(os.path.join(JOBLIB_DIR, 'model_state.pt'), map_location='cpu'))
model.eval()

@app.post("/analyze")
async def analyze(request: Request):
    try:
        data = await request.json()
        comment = data.get("comment")
        rating = data.get("rating")

        if not comment:
            return JSONResponse(status_code=400, content={"error": "Missing review comment."})
        # Prepare input string
        input_str = f"{comment} Rating: {rating}" if rating is not None else comment

        # Tokenize
        enc = tokenizer(
            input_str,
            truncation=True,
            padding='max_length',
            max_length=512,
            return_tensors='pt'
        )

        # Run model
        with torch.no_grad():
            logits = model(**enc).logits  # shape (1, 2)
            probs = F.softmax(logits, dim=-1).squeeze(0)  # shape (2,)

        pred_id = torch.argmax(probs).item()           # 0 or 1
        confidence = probs[pred_id].item()             # float in [0.0, 1.0]

        # Log input and output
        logging.info(f"INPUT - comment: \"{comment[:80]}...\", rating: {rating}")
        logging.info(f"OUTPUT - pred: {pred_id}, confidence: {confidence:.4f}")

        return {"pred": pred_id, "confidence": confidence}
    except Exception as exc:
        logging.error(f"Exception in /analyze: {exc}")
        return JSONResponse(status_code=500, content={"error": "Internal Server Error", "detail": str(exc)})
