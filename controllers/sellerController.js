const Seller = require('../models/Seller');

// Create Seller Profile
const createSeller = async (req, res) => {
    try {
        const { businessName, contactEmail } = req.body;
        const userId = req.user.userId;

        // Check if seller profile already exists for this user
        const existingSeller = await Seller.findOne({ user: userId });
        if (existingSeller) {
            return res.status(409).json({ error: 'Seller profile already exists' });
        }

        const seller = new Seller({
            user: userId,
            businessName,
            contactEmail
        });

        await seller.save();
        res.status(201).json({ message: 'Seller profile created', seller });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Seller Profile (for logged-in user)
const getSellerProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const seller = await Seller.findOne({ user: userId });
        if (!seller) {
            return res.status(404).json({ error: 'Seller profile not found' });
        }
        res.json({ seller });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createSeller, getSellerProfile };
