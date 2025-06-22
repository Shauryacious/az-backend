
from fastapi import FastAPI, HTTPException
import uvicorn

app = FastAPI()

# Load model and data structures
model = RGCN(in_feats=3, hidden_feats=16, num_rels=num_relations, num_classes=2)
model.load_state_dict(torch.load("rgcn_seller_fraud.pth"))
model.eval()
model.to(device)

# Maps from seller ID (brand name) to unified node index
seller_to_index = {...}  # precomputed mapping, e.g. {'Samsung': 1234, 'Sony': 5678, ...}
seller_features = {...}  # dict of seller feature dicts or arrays

@app.get("/seller/{seller_name}")
def query_seller(seller_name: str):
    if seller_name not in seller_to_index:
        raise HTTPException(status_code=404, detail="Seller not found")
    idx = seller_to_index[seller_name]
    # Extract features (if needed to return)
    feat = seller_features[seller_name]  # e.g. {"return_ratio": ..., "avg_rating": ..., "burstiness": ...}
    # Model inference: compute logits and probability for fraud class
    with torch.no_grad():
        out = model(x, edge_index, edge_type)  # full graph inference
        logits = out[idx].cpu().numpy()        # shape [2]
    prob = float(F.softmax(torch.tensor(logits), dim=0)[1])  # probability of class 1 (fraud)
    return {
        "seller": seller_name,
        "features": {
            "return_ratio": feat["return_ratio"],
            "avg_rating": feat["avg_rating"],
            "burstiness": feat["burstiness"]
        },
        "fraud_probability": prob
    }

# To run locally: uvicorn.run(app, host="0.0.0.0", port=8000)
