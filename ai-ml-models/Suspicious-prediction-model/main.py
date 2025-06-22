import os
from seller_suspicion import classify_seller_suspicion
import requests
from dotenv import load_dotenv

# load .env from current directory
load_dotenv()

# pull in the GEMINI_API_KEY variable
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise RuntimeError("Please set GEMINI_API_KEY in your .env")

res = classify_seller_suspicion(
    api_key=API_KEY,
    return_rate="10%",
    average_rating="3.4/5",
    recent_reviews=[
        "The product was a good product",
        "Loved the item, definitely got was exactly what I not ordered.",
        "Delayed delivery, but its okay finally I can swim",
        "the product was not as described, very disappointed",
    ],
    use_message_endpoint=False,
    temperature=0.0,
    verbose=False
)
# Pretty‐print
separator = "=" * 40
print(f"\n{separator}")
print("       Seller Suspicion Report")
print(separator)
print(f" Classification : {res['classification'].capitalize()}")
print(f" Confidence     : {res['confidence']}%")
# print(f" Justification  : {res['justification']}")
print(separator)
