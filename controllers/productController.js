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
        const limit = Math.min(parseInt(req.query.limit, 10) || 100, 100);
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const skip = (page - 1) * limit;

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
 * ADMIN: List all products pending human review (status: 'pending')
 * GET /api/products/pending
 */
const getPendingProducts = async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 100, 100);
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const skip = (page - 1) * limit;

        const query = { status: 'pending' };
        const products = await Product.find(query)
            .populate('seller', 'businessName')
            .select('-__v')
            .limit(limit)
            .skip(skip)
            .sort({ updatedAt: -1 })
            .lean();

        const total = await Product.countDocuments(query);

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
 * ADMIN: Approve a pending product (set status to 'active')
 * PATCH /api/products/:id/approve
 */
const approveProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        if (product.status !== "pending")
            return res.status(400).json({ error: "Only pending products can be approved" });

        product.status = "active";
        product.statusHistory.push({
            status: "active",
            changedAt: new Date(),
            reason: "Approved by admin",
            flags: product.flags,
        });
        await product.save();

        res.json({ message: "Product approved", product });
    } catch (err) {
        next(err);
    }
};

/**
 * ADMIN: Takedown a product (set status to 'takedown')
 * PATCH /api/products/:id/takedown
 */
const takedownProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        if (product.status === "takedown")
            return res.status(400).json({ error: "Product already taken down" });

        product.status = "takedown";
        product.statusHistory.push({
            status: "takedown",
            changedAt: new Date(),
            reason: req.body.reason || "Takedown by admin",
            flags: product.flags,
        });
        await product.save();

        res.json({ message: "Product taken down", product });
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

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    getMyProducts,
    getPendingProducts,
    approveProduct,
    takedownProduct,
};
