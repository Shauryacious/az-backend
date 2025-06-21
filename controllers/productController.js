// controllers/productController.js
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const { uploadBuffer } = require('../utils/cloudinary');
const productAnalysisQueue = require('../queues/productAnalysisQueue');

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

        // Add product analysis job to the queue (automated AI analysis)
        await productAnalysisQueue.add('analyze', {
            productId: product._id.toString(),
            description: product.description,
            imagePath: product.images && product.images.length > 0 ? product.images[0] : null,
        });

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

// Optionally keep this for admin/debug only (not exported, not routed)
const analyzeProductImage = async (req, res, next) => {
    try {
        const { description } = req.body;
        const imagePath = req.file.path; // multer handles file upload
        const productId = req.params.id;
        const { matchImageWithDescription } = require('../utils/blipApi');

        // Call Python BLIP microservice
        const result = await matchImageWithDescription(imagePath, description);

        // Update product in DB
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Update signalBreakdown and flags
        product.signalBreakdown = product.signalBreakdown || {};
        product.signalBreakdown.descMatch = result.score;

        product.flags = product.flags || [];
        if (result.label === 'Fake') {
            if (!product.flags.includes('desc_image_mismatch')) {
                product.flags.push('desc_image_mismatch');
            }
        } else {
            product.flags = product.flags.filter(f => f !== 'desc_image_mismatch');
        }

        // Update trustScore, riskLevel, status using model methods (if implemented)
        if (typeof product.computeRiskLevel === 'function') {
            product.trustScore = result.score;
            product.riskLevel = product.computeRiskLevel();
            product.status = product.computeStatus();
        }

        // Log status history
        product.statusHistory = product.statusHistory || [];
        product.statusHistory.push({
            status: product.status,
            changedAt: new Date(),
            reason: 'Image-description AI analysis',
            flags: product.flags,
        });

        await product.save();

        res.json({ success: true, label: result.label, score: result.score });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    getMyProducts,
    // analyzeProductImage, // <-- NOT EXPORTED (admin/debug only)
};
