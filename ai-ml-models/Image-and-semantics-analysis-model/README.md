# BLIP-Based Image-Text Matching

## Overview

This project uses the **BLIP (Bootstrapped Language Image Pretraining)** model from Salesforce to verify whether a product image matches its textual description. It helps in detecting mismatches such as fake listings or wrongly described products, especially useful for e-commerce platforms.

---

## Why BLIP?

BLIP is a powerful Vision-Language model trained on large-scale image-text pairs. It supports tasks like:

* Image captioning
* Visual question answering (VQA)
* Image-text retrieval

We use **BLIP for image-text retrieval** because it:

* Provides robust similarity scores between image and text.
* Supports both ITM (Image-Text Matching) and ITC (Image-Text Contrastive) heads.
* Works well even on zero-shot inputs.

### Why BLIP is Suitable:

* Pretrained on high-quality datasets like COCO, Conceptual Captions.
* Can evaluate image-text similarity using cosine scores.
* Versatile for tasks where fine-grained alignment is necessary.

### Alternatives:

| Model  | Pros                                 | Cons                                |
| ------ | ------------------------------------ | ----------------------------------- |
| CLIP   | Fast, simple                         | May lack fine-grained justification |
| BLIP-2 | Multimodal generation, more powerful | Heavier, slower inference           |
| OFA    | General-purpose, large coverage      | Overhead in tuning                  |

BLIP provides a good balance of performance and simplicity for retrieval tasks.

---

## Flow Diagram (Text Format)

```
[ Input: Image + Description ]
            |
            v
[ Preprocessing using BLIP Processor ]
            |
            v
[ Feature Extraction (Encoder) ]
            |
            v
[ Cosine Similarity Calculation (ITC head) ]
            |
            v
[ Thresholding (e.g., 0.3) ]
            |
            v
[ Output: "Genuine" or "Fake" + Score ]
```

---

## Setup Instructions

### Requirements:

* Python 3.8+
* PyTorch
* Transformers
* PIL

### Install Dependencies:

```bash
pip install torch torchvision transformers pillow
```

---

## Usage

### Load and Run

```python
from infer import predict_label_pt

label, score = predict_label_pt(
    "Test Images/shoe.png",
    "Lenovo IdeaPad Slim 3, Intel Core i3, 12th Gen...",
    threshold=0.3
)
print(f"Label: {label}, Score: {score:.4f}")
```

---

## File Structure

```
project/
├── infer.py               # Contains predict_label_pt function
├── main.py                # Entry point script
├── Test Images/           # Test images folder
├── README.md              # This file
```

---

## License

MIT License

---

## Credits

* [Salesforce BLIP on HuggingFace](https://huggingface.co/Salesforce/blip-itm-base-coco)
* Hugging Face Transformers
* PyTorch
