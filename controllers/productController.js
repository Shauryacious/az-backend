const Product = require('../models/Product');
const Seller = require('../models/Seller');

// Create a new product listing
const createProduct = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find the seller profile for the logged-in user
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            return res.status(403).json({ error: 'Seller profile not found' });
        }

        const { title, description, images, brand, price, quantity } = req.body;

        const product = new Product({
            seller: seller._id,
            title,
            description,
            images,
            brand,
            price,
            quantity
        });

        await product.save();
        res.status(201).json({ message: 'Product listed successfully', product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all products for the current seller
const getMyProducts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            return res.status(403).json({ error: 'Seller profile not found' });
        }

        const products = await Product.find({ seller: seller._id });
        res.json({ products });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createProduct, getMyProducts };
