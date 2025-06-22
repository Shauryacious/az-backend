import streamlit as st
from analyze import analyze_product
import os

st.title("Product Authenticity Checker")

uploaded = st.file_uploader("Upload product image", type=["png", "jpg", "jpeg"])
name     = st.text_input("Product name")
desc     = st.text_area("Description / Listing text")

if st.button("Analyze"):
    if not uploaded or not name or not desc:
        st.warning("Please provide image, name, and description.")
    else:
        temp_path = f"temp_{uploaded.name}"
        with open(temp_path, "wb") as f:
            f.write(uploaded.getvalue())

        # Now ensure the file is saved and accessible before passing
        verdict = analyze_product(
            image_path=temp_path,
            product_name=name,
            description=desc
        )

        if verdict["status"] == "Error":
            st.error(f"API error: {verdict['message']}")
        else:
            st.markdown(f"**Status:** {verdict['status']}")
            st.markdown(f"**Counterfeit Score:** {verdict['counterfeit_score']:.2f}")
            st.markdown("**Full analysis:**")
            st.json(verdict["analysis"])

        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
