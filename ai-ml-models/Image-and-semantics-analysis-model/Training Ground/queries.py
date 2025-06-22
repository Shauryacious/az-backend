from infer import predict_label_pt

SIMILARITY_THRESHOLD = 0.3
print("query")
label, score = predict_label_pt("Test Images/shoe.png", """Lenovo IdeaPad Slim 3, Intel Core i3, 12th Gen, 8GB RAM, 512GB SSD, FHD, 15.6"/39.62cm, Windows 11, Office Home 2024, Arctic Grey, 1.63Kg, 82RK01ABIN, Intel UHD Graphics, 1Yr ADP Free Laptop """, SIMILARITY_THRESHOLD)
print("Here is the result:")
print(f"Label: {label}, Score: {score}")

