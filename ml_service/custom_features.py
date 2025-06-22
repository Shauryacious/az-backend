import numpy as np

def compute_length(X):
    return np.array([len(str(doc).split()) for doc in X]).reshape(-1, 1)

def compute_avg_word_length(X):
    avg_lengths = []
    for doc in X:
        words = str(doc).split()
        if not words:
            avg_lengths.append(0.0)
        else:
            avg_lengths.append(sum(len(w) for w in words) / len(words))
    return np.array(avg_lengths).reshape(-1, 1)
