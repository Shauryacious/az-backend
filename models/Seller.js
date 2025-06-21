// models/Seller.js
const mongoose = require('mongoose');

/**
 * Seller Schema
 * - user: reference to User document (required)
 * - businessName: seller's business name (required, trimmed)
 * - contactEmail: seller's business contact email (required, validated, trimmed)
 * - createdAt, updatedAt: timestamps
 */
const sellerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        businessName: {
            type: String,
            required: true,
            trim: true,
        },
        contactEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/.+@.+\..+/, 'Please fill a valid email address'],
        },
        // You can add more fields here (e.g., address, phone, business docs, etc.)
    },
    {
        timestamps: true,
    }
);

// Ensure a user can only have one seller profile
sellerSchema.index({ user: 1 }, { unique: true });

const Seller = mongoose.model('Seller', sellerSchema);

module.exports = Seller;
