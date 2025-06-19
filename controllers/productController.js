// src/controllers/productController.js
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const cloudinary = require('../utils/cloudinary');

// Helper to upload a buffer to Cloudinary
const uploadBufferToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
};

// Create a new product listing with image upload
const createProduct = async (req, res) => {
    try {
        const userId = req.user.userId;
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            return res.status(403).json({ error: 'Seller profile not found' });
        }

        const { title, description, brand, price, quantity } = req.body;
        let imageUrls = [];

        if (req.files && req.files.length > 0) {
            imageUrls = await Promise.all(
                req.files.map(file => uploadBufferToCloudinary(file.buffer, 'products'))
            );
        }

        const product = new Product({
            seller: seller._id,
            title,
            description,
            images: imageUrls,
            brand,
            price,
            quantity,
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
