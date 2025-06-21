// controllers/productController.js
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const { uploadBuffer } = require('../utils/cloudinary');

/**
 * PUBLIC: Get all products with optional pagination.
 * GET /api/products
 */
const getAllProducts = async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 100, 100); // Max 100
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const skip = (page - 1) * limit;

        // Optionally, add filters here (category, price range, search, etc.)
        const products = await Product.find()
            .select('-__v')
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await Product.countDocuments();

        res.json({
            products,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PUBLIC: Get a single product by ID.
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId).select('-__v').lean();
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        next(err);
    }
};

/**
 * PROTECTED: Create a new product listing.
 * POST /api/products/create
 */
const createProduct = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            return res.status(403).json({ error: 'Seller profile not found' });
        }

        const { name, sku, description, price, stock } = req.body;

        if (!name || !sku || !description || !price || stock === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = await Promise.all(
                req.files.map((file) => uploadBuffer(file.buffer, 'products'))
            );
        }

        const product = new Product({
            seller: seller._id,
            name: name.trim(),
            sku: sku.trim(),
            description: description.trim(),
            images: imageUrls,
            price: parseFloat(price),
            stock: parseInt(stock, 10),
        });

        await product.save();

        res.status(201).json({ message: 'Product listed successfully', product });
    } catch (err) {
        next(err);
    }
};

/**
 * PROTECTED: Get all products for the logged-in seller.
 * GET /api/products/mine
 */
const getMyProducts = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            return res.status(403).json({ error: 'Seller profile not found' });
        }

        const products = await Product.find({ seller: seller._id }).lean();

        res.json({ products });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    getMyProducts,
};
