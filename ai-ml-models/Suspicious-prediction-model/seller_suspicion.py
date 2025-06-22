import os
import requests
from typing import List, Optional, Dict, Any

def classify_seller_suspicion(
    api_key: Optional[str] = None,
    return_rate: str = "",
    average_rating: str = "",
    recent_reviews: Optional[List[str]] = None,
    model_name: str = "gemini-2.0-flash",
    use_message_endpoint: bool = False,
    temperature: float = 0.0,
    verbose: bool = False
) -> Dict[str, Any]:
    reviews = recent_reviews or []
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("No API key provided. Set GEMINI_API_KEY or pass api_key.")

    endpoint = "generateMessage" if use_message_endpoint else "generateContent"
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model_name}:{endpoint}?key={key}"
    )

    bullets = ""
    if reviews:
        bullets = "\n  • " + "\n  • ".join(reviews)

    prompt_text = (
        "Analyze the following seller data and answer ONLY with either \"suspicious\" "
        "or \"not suspicious\", followed by a brief justification and a confidence score (0-100)."
        "Respond in this format:\nClassification: [label]\nJustification: [text]\nConfidence: [score]\n\n"
        f"Seller Data:\n"
        f"- Return rate: {return_rate}\n"
        f"- Average product rating: {average_rating}\n"
        f"- Recent reviews:{bullets}\n"
    )

    payload = {
        "contents": [
            {"parts": [{"text": prompt_text}]}
        ],
        "generationConfig": {
            "temperature": temperature
        }
    }

    if verbose:
        print(f"→ URL: {url}")
        print("→ Payload:", payload)

    resp = requests.post(url, json=payload)
    try:
        resp.raise_for_status()
    except requests.HTTPError:
        if verbose:
            print("→ HTTP Error:", resp.status_code)
            try:
                print("→ Response JSON:", resp.json())
            except Exception:
                print("→ Response Text:", resp.text)
        raise

    data = resp.json()
    candidate = data["candidates"][0].get("content", "")
    if isinstance(candidate, dict) and "parts" in candidate:
        text_out = "".join(p["text"] for p in candidate["parts"])
    else:
        text_out = str(candidate)

    lines = text_out.strip().split("\n")
    label, justification, confidence = "", "", ""
    for line in lines:
        if line.lower().startswith("classification:"):
            label = line.split(":", 1)[1].strip().lower()
        elif line.lower().startswith("justification:"):
            justification = line.split(":", 1)[1].strip()
        elif line.lower().startswith("confidence:"):
            confidence = line.split(":", 1)[1].strip()

    return {
        "classification": label,
        "confidence": confidence,
        "raw": data,
        "justification": justification
    }