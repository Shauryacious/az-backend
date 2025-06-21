// controllers/sellerController.js
const Seller = require('../models/Seller');

/**
 * Create a Seller Profile for the logged-in user.
 * Only allows creation if a profile does not already exist.
 */
exports.createSeller = async (req, res, next) => {
    try {
        const { businessName, contactEmail } = req.body;
        const userId = req.user.userId;

        if (!businessName || !contactEmail) {
            return res.status(400).json({ error: 'Business name and contact email are required' });
        }

        // Check if seller profile already exists for this user
        const existingSeller = await Seller.findOne({ user: userId });
        if (existingSeller) {
            return res.status(409).json({ error: 'Seller profile already exists' });
        }

        const seller = await Seller.create({
            user: userId,
            businessName,
            contactEmail,
        });

        res.status(201).json({
            message: 'Seller profile created',
            seller,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get the Seller Profile for the logged-in user.
 */
exports.getSellerProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            return res.status(404).json({ error: 'Seller profile not found' });
        }
        res.json({ seller });
    } catch (err) {
        next(err);
    }
};

/**
 * (Optional) Get all sellers (admin only)
 */
exports.getAllSellers = async (req, res, next) => {
    try {
        const sellers = await Seller.find().populate('user', 'email role');
        res.json({ sellers });
    } catch (err) {
        next(err);
    }
};
