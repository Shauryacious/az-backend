# Amazon Seller Fraud Detection with RGCN

## Overview and Motivation

Detecting fraudulent behavior among online sellers is critical to maintain trust and safety on e-commerce platforms. Traditional approaches often rely on rule-based heuristics (e.g., "return ratio > threshold") or classical machine learning on flat feature sets. However, seller behavior, user interactions, and product reviews naturally form a **heterogeneous graph**:

- **Users** review **Products**
- **Products** are offered by **Sellers**
- Review timestamps, ratings, and text carry rich relational signals

By leveraging a **Relational Graph Convolutional Network (RGCN)**, we can:

1. **Capture relational patterns** across different entity types and edge types (e.g., collusive reviewing)
2. **Aggregate features** from neighbors in a principled way, learning from structure and attributes jointly
3. **Generalize** better to unseen or subtle fraud patterns compared to flat models

### Why RGCN? What Are the Alternatives?

- **Rule-Based Methods**: Easy to implement (e.g., if return\_ratio > 0.3 flag seller). However, brittle to new fraud tactics and yield many false positives.
- **Flat Machine Learning** (e.g., XGBoost on tabular features): Better than simple rules but ignores the relational structure (reviewer networks, bursts).
- **Graph-Based Autoencoders / GATs**: Alternative GNNs (e.g., Graph Attention Networks) can also model heterogeneity. We choose RGCN because:
  - It natively supports **multiple edge types** (relations) with separate weight matrices
  - It is **memory-efficient** and well-supported in PyTorch Geometric
  - Its **message-passing design** aligns closely with knowledge-graph style data

## Project Structure

```
amazon_fraud_detection/
├── data/
│   └── HOPE WE FOUND
│
├── src/
│   ├── __init__.py
│   ├── preprocessing.py    # Parsing, graph construction, feature computation
│   ├── model.py            # RGCN class definition
│   ├── train.py            # Training loop, label simulation, model saving
│   ├── inference.py        # Loading model + data helpers for API
│   └── api.py              # FastAPI service for real-time predictions
│
├── frontend/
│   └── checkSeller.js      # Node.js snippet to query the FastAPI endpoint
│
├── requirements.txt        # Python dependencies
└── README.md               # This file
```


## Flow Diagram


[1] Data Ingestion
       │
       ▼
[2] Preprocessing (src/preprocessing.py)
       ├─ Parse reviews_Electronics_5.json.gz → Users, Products, Ratings, Timestamps
       ├─ Load meta_Electronics.json.gz → map Products → Sellers (brands)
       ├─ Compute node features for Users, Products, Sellers
       └─ Build edge lists (user→product, product→seller, user→seller)
       │
       ▼
[3] Graph Construction
       ├─ Assemble HeteroData (PyG) with node features and edge_index, edge_type
       └─ Serialize tensors and mappings (.pt, .json)
       │
       ▼
[4] Model Definition (src/model.py)
       └─ Define two-layer RGCNConv network for multi-relation graph
       │
       ▼
[5] Training (src/train.py)
       ├─ Load preprocessed graph tensors
       ├─ Simulate seller fraud labels and masks
       ├─ Train RGCN with CrossEntropyLoss on seller nodes
       └─ Save weights (rgcn_seller_fraud.pth)
       │
       ▼
[6] Inference Helper (src/inference.py)
       ├─ Load model weights and graph tensors
       └─ Expose predict_seller() function returning fraud probability + features
       │
       ▼
[7] API Deployment (src/api.py)
       ├─ Initialize FastAPI application
       ├─ Define GET /seller/{seller_name} endpoint
       └─ Return JSON with node features and fraud score
       │
       ▼
[8] Frontend Integration (frontend/checkSeller.js)
       └─ Use Axios (Node.js) to call FastAPI endpoint and display results


### Detailed Explanation

## Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd amazon_fraud_detection
   ```

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Download SNAP Data**

   ```bash
   wget -P data/ https://snap.stanford.edu/data/amazon/productGraph/categoryFiles/reviews_Electronics_5.json.gz
   wget -P data/ https://snap.stanford.edu/data/amazon/productGraph/categoryFiles/meta_Electronics.json.gz
   ```

## Step-by-Step Guide

### 1. Preprocessing (`src/preprocessing.py`)

**What?**

- Parse the compressed JSON review file (`reviews_Electronics_5.json.gz`) to extract:
  - **Users** (`reviewerID`)
  - **Products** (`asin`)
  - **Ratings** (`overall`), **timestamps** (`unixReviewTime`)
- Load metadata (`meta_Electronics.json.gz`) to map each product to its **brand**, which we treat as the **seller**.
- **Compute node features**:
  - **Seller**: return ratio proxy (fraction of low ratings), average rating, review burstiness (reviews per day)
  - **User**: total reviews, mean rating given, product diversity
  - **Product**: total reviews, average rating, rating variance
- **Build edge lists** for relations:
  - `user -> product` (reviews)
  - `product -> seller` (sold\_by)
  - `user -> seller` (inferred purchase)
- Save feature tensors (`.pt`) and index mappings (`.json`) for downstream use.

**Why?**

- Clean separation of data processing avoids repeating expensive parsing steps.
- Precomputed tensors speed up training and inference.

```bash
python src/preprocessing.py
```

This generates files like `node_features.pt`, `edge_index.pt`, `edge_type.pt`, and mapping JSONs in `src/`.

### 2. Model Definition (`src/model.py`)

**What?**

- Defines the `RGCN` PyTorch module:
  - Two `RGCNConv` layers from PyG
  - First layer: transforms input features to a hidden space (e.g., 16 dims)
  - Second layer: maps hidden embeddings to 2 output classes (fraud vs. legit)
  - ReLU nonlinearity between layers

**Why?**

- Encapsulates model architecture separately for clarity and reuse (e.g., swapping hidden sizes or number of layers).

```python
import torch.nn.functional as F
from torch_geometric.nn import RGCNConv

class RGCN(torch.nn.Module):
    def __init__(self, in_feats, hidden_feats, num_rels, num_classes):
        super().__init__()
        self.conv1 = RGCNConv(in_feats, hidden_feats, num_relations=num_rels)
        self.conv2 = RGCNConv(hidden_feats, num_classes, num_relations=num_rels)
    def forward(self, x, edge_index, edge_type):
        x = F.relu(self.conv1(x, edge_index, edge_type))
        x = self.conv2(x, edge_index, edge_type)
        return x
```

### 3. Training (`src/train.py`)

**What?**

- Load preprocessed graph tensors (`x`, `edge_index`, `edge_type`)
- **Simulate seller labels** (e.g., randomly mark 10% of sellers as fraudulent)
- Create **train mask** on seller nodes only (balance fraudulent vs. non-fraud)
- Train the RGCN model for a fixed number of epochs with `CrossEntropyLoss`
- Save the trained weights to `rgcn_seller_fraud.pth`

**Why?**

- Demonstrates end-to-end fitting of the graph model.
- Simulated labels allow pipeline testing; replace with real labels when available.

```bash
python src/train.py
```

Look for training loss and accuracy logs in your console.

### 4. Inference Helpers (`src/inference.py`)

**What?**

- Load the saved model weights and feature tensors
- Provide a function `predict_seller(seller_name)`:
  - Map `seller_name` to its unified graph index
  - Run a forward pass on the **entire** graph (RGCN requires full-graph inference)
  - Extract the seller node’s logits and compute `softmax` fraud probability

**Why?**

- Separates API logic from model loading/inference details.

```python
from src.model import RGCN
import torch

def load_model_and_data():
    # load node_feature, edge_index, edge_type, seller mapping...
    # instantiate RGCN and load state_dict
    return model, x, edge_index, edge_type, seller_to_idx, seller_features

def predict_seller(seller_name: str):
    model, x, edge_index, edge_type, seller_to_idx, seller_features = load_model_and_data()
    idx = seller_to_idx[seller_name]
    with torch.no_grad():
        out = model(x, edge_index, edge_type)
        prob = torch.softmax(out[idx], dim=0)[1].item()
    return prob, seller_features[seller_name]
```

### 5. FastAPI Service (`src/api.py`)

**What?**

- Create a FastAPI application exposing an endpoint:
  - `GET /seller/{seller_name}`
- Imports and calls `predict_seller` from `inference.py`
- Returns JSON with:
  - `features`: return\_ratio, avg\_rating, burstiness
  - `fraud_probability`: model output

**Why?**

- Provides a lightweight, production-ready API for real-time detection.

```bash
uvicorn src.api:app --reload --host 0.0.0.0 --port 8000
```

Test with:

```bash
curl http://localhost:8000/seller/Sony
```

### 6. Frontend Integration (`frontend/checkSeller.js`)

**What?**

- Node.js snippet using `axios`:

```javascript
const axios = require('axios');

async function checkSeller(name) {
  const res = await axios.get(`http://localhost:8000/seller/${name}`);
  console.log(res.data);
}

checkSeller('Sony');
```

**Why?**

- Illustrates how your web app (React, Angular, etc.) can fetch real-time fraud scores.

## Next Steps and Customization

- **Real Labels**: Replace simulated labels with a labeled dataset of known fraudulent sellers to train a supervised model.
- **Textual Features**: Incorporate review text embeddings (e.g., via Amazon Bedrock embeddings) as extra node features.
- **Advanced GNNs**: Experiment with Graph Attention Networks (GAT) or GraphSAGE for potentially richer representations.
- **Production Deployment**: Containerize the FastAPI service with Docker, deploy on AWS ECS/Fargate, and connect to your Node.js frontend.

---

