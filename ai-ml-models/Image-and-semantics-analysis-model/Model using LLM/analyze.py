import os
import logging
import json
from dotenv import load_dotenv
import google.generativeai as genai
from google import genai
from PIL import Image


logging.basicConfig(
    filename='gemini_analysis.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s'
)

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

def analyze_product(
    image_path: str,
    product_name: str,
    description: str,
    counterfeit_threshold: float = 0.5
) -> dict:
    """
    Analyze a product image + description via Gemini and return:
      - status: "Approved" or "Flagged as suspicious"
      - counterfeit_score: numeric
      - full analysis dict
    """
    try:
        logging.info(f"Analyzing product - Name: {product_name}")
        logging.info(f"Description: {description}")

        # Load the image
        with open(image_path, 'rb') as f:
            image = Image.open(f)

        # Build prompt
        prompt = (
            "Analyze this product image and determine:\n"
            "1. Is this image authentic or potentially manipulated? (Score 0–1)\n"
            f"2. Does the image match the product name '{product_name}'? (Score 0–1)\n"
            "3. Are there signs this could be counterfeit? (Score 0–1)\n"
            f"4. Does the image match the description: '{description}'?\n\n"
            "Return JSON with numeric scores and an explanation."
        )

        # Call Gemini
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=[image, prompt]
        )

        # Extract raw text
        raw = None
        if getattr(response, "candidates", None):
            candidate = response.candidates[0] if response.candidates and len(response.candidates) > 0 else None
            if candidate and hasattr(candidate, "content"):
                raw = candidate.content
        elif getattr(response, "text", None):
            raw = response.text

        if not raw:
            raise ValueError("Empty response from Gemini")

        logging.info(f"Raw Gemini output:\n{raw}")

        # Parse JSON
        try:
            if not isinstance(raw, str):
                raw = str(raw)
            data = json.loads(raw)
        except json.JSONDecodeError:
            logging.error(f"Failed to parse JSON:\n{raw}")
            raise

        # Extract numeric counterfeit score
        counterfeit_score = data.get("counterfeit", data.get("counterfeit_signs", 0.0))

        # Decide
        if counterfeit_score > counterfeit_threshold:
            status = "Flagged as suspicious"
            logging.warning(f"{status} (counterfeit={counterfeit_score})")
        else:
            status = "Approved"
            logging.info(f"{status} (counterfeit={counterfeit_score})")

        return {
            "status": status,
            "counterfeit_score": counterfeit_score,
            "analysis": data
        }

    except Exception as e:
        logging.error(f"Error analyzing product: {e}", exc_info=True)
        return {
            "status": "Error",
            "message": str(e)
        }