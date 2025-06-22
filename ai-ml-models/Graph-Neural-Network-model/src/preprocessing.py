from torch_geometric.data import HeteroData

data = HeteroData()

# Assign node features (torch tensors) for each type
data['user'].x = user_feature_tensor     # shape [num_users, 3]
data['product'].x = product_feature_tensor  # shape [num_products, 3]
data['seller'].x = seller_feature_tensor   # shape [num_sellers, 3]

# Define edges by (source_idx, target_idx) lists for each relation
data['user', 'reviews', 'product'].edge_index = user_to_product_edge_index
data['product', 'sold_by', 'seller'].edge_index = product_to_seller_edge_index
data['user', 'bought', 'seller'].edge_index = user_to_seller_edge_index



