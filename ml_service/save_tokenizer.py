from transformers import DistilBertTokenizer

# Load the tokenizer as you did during training
tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')

# Save it the HuggingFace way
tokenizer.save_pretrained('joblib/tokenizer')
print("Tokenizer saved to joblib/tokenizer/")
