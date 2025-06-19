// src/controllers/productController.js
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const cloudinary = require('../utils/cloudinary');

// Helper: Upload a buffer to Cloudinary and return the secure URL
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

// POST /api/products/create
const createProduct = async (req, res) => {
    try {
        const userId = req.user.userId;
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            return res.status(403).json({ error: 'Seller profile not found' });
        }

        const { name, sku, description, price, available } = req.body;

        // Validate required fields
        if (!name || !sku || !description || !price || available === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = await Promise.all(
                req.files.map(file => uploadBufferToCloudinary(file.buffer, 'products'))
            );
        }

        const product = new Product({
            seller: seller._id,
            name,
            sku,
            description,
            images: imageUrls,
            price: parseFloat(price),
            stock: parseInt(available, 10)
        });

        await product.save();
        res.status(201).json({ message: 'Product listed successfully', product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/products/mine
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
