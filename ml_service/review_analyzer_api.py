import sys
import os
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import joblib
import pandas as pd
import logging

# Add current directory to sys.path for custom imports
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

import custom_features

# Monkey-patch for unpickling
sys.modules['__main__'].compute_length = custom_features.compute_length
sys.modules['__main__'].compute_avg_word_length = custom_features.compute_avg_word_length

import sklearn.compose._column_transformer as _ct
class _RemainderColsList(list):
    pass
_ct._RemainderColsList = _RemainderColsList

app = FastAPI()

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s %(message)s',
)

JOBLIB_DIR = os.path.join(BASE_DIR, 'joblib')
model = joblib.load(os.path.join(JOBLIB_DIR, 'review_detector.joblib'))

@app.post("/analyze")
async def analyze(request: Request):
    try:
        data = await request.json()
        comment = data.get("comment")
        rating = data.get("rating")

        if not comment:
            return JSONResponse(status_code=400, content={"error": "Missing review comment."})

        X_new = pd.DataFrame({
            "review": [comment],
            "rating": [rating]
        })

        ai_confidence = float(model.predict_proba(X_new)[0, 1])  # Probability of AI

        logging.info(f"INPUT  - comment: \"{comment[:80]}...\", rating: {rating}")
        logging.info(f"OUTPUT - ai_confidence: {ai_confidence:.4f}")

        return {"confidence": ai_confidence}

    except Exception as exc:
        import traceback
        tb_str = traceback.format_exc()
        logging.error(f"Exception in /analyze: {exc}\nTraceback:\n{tb_str}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "detail": str(exc),
                "traceback": tb_str
            }
        )
