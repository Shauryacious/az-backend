device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)
x = torch.cat([user_feat, product_feat, seller_feat], dim=0).to(device)  # [N,3]
edge_index = edge_index.to(device)
edge_type = edge_type.to(device)


import numpy as np

# Suppose seller indices in the unified graph are in [U+P .. U+P+S-1].
seller_start = U + P
seller_end = U + P + S

# Create labels: 0 for normal, 1 for fraudulent
labels = torch.zeros(N, dtype=torch.long)
fraudulent_sellers = np.random.choice(range(seller_start, seller_end), size=int(0.1*S), replace=False)
labels[list(fraudulent_sellers)] = 1

# Create mask for training/testing on seller nodes only
train_mask = torch.zeros(N, dtype=torch.bool)
train_mask[list(fraudulent_sellers)] = True
normal_sellers = np.random.choice(
    [i for i in range(seller_start, seller_end) if i not in fraudulent_sellers],
    size=len(fraudulent_sellers), replace=False)
train_mask[normal_sellers] = True

# Train/test split
labels = labels.to(device)
train_mask = train_mask.to(device)

criterion = torch.nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.01, weight_decay=5e-4)

model.train()
for epoch in range(1, 101):
    optimizer.zero_grad()
    out = model(x, edge_index, edge_type)           # [N, 2] logits
    loss = criterion(out[train_mask], labels[train_mask])
    loss.backward()
    optimizer.step()
    if epoch % 20 == 0:
        pred = out.argmax(dim=1)
        train_acc = (pred[train_mask]==labels[train_mask]).float().mean()
        print(f"Epoch {epoch}, Loss: {loss.item():.4f}, Train Acc: {train_acc:.4f}")



# save the trained model for inference
torch.save(model.state_dict(), "rgcn_seller_fraud.pth")

