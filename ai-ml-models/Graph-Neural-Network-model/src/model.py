import torch

# Example: unify node indices into one space: user [0..U-1], product [U..U+P-1], seller [U+P..]
# Then create edge_index (2 x E) and edge_type (E) for RGCNConv.
edge_index_list = []
edge_type_list = []

# For each user->product review
for (u, p) in user_product_pairs:
    edge_index_list.append([u, p + U])       # user to product
    edge_type_list.append(0)  # relation 0
    edge_index_list.append([p + U, u])       # reverse
    edge_type_list.append(0)

# For each product->seller
for (p, s) in product_seller_pairs:
    edge_index_list.append([p + U, s + U + P])  # product to seller
    edge_type_list.append(1)
    edge_index_list.append([s + U + P, p + U])  # reverse
    edge_type_list.append(1)

# For each user->seller inferred purchase
for (u, s) in user_seller_pairs:
    edge_index_list.append([u, s + U + P])      # user to seller
    edge_type_list.append(2)
    edge_index_list.append([s + U + P, u])      # reverse
    edge_type_list.append(2)

edge_index = torch.tensor(edge_index_list).t().contiguous()  # shape [2, E_total]
edge_type = torch.tensor(edge_type_list, dtype=torch.long)  # shape [E_total]




import torch
import torch.nn.functional as F
from torch_geometric.nn import RGCNConv

class RGCN(torch.nn.Module):
    def __init__(self, in_feats, hidden_feats, num_rels, num_classes):
        super().__init__()
        # Two RGCNConv layers: in->hidden, hidden->out
        self.conv1 = RGCNConv(in_feats, hidden_feats, num_relations=num_rels)
        self.conv2 = RGCNConv(hidden_feats, num_classes, num_relations=num_rels)
    def forward(self, x, edge_index, edge_type):
        # x: [N, in_feats], edge_index: [2, E], edge_type: [E]
        x = F.relu(self.conv1(x, edge_index, edge_type))
        x = self.conv2(x, edge_index, edge_type)
        return x

# Example instantiation
num_nodes = N  # total nodes = users+products+sellers
num_relations = 3  # we defined 3 relation types
model = RGCN(in_feats=3, hidden_feats=16, num_rels=num_relations, num_classes=2)

