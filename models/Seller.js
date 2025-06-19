// models/Seller.js
const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, required: true },
    contactEmail: { type: String, required: true }
    // You can add more fields later as needed
}, { timestamps: true });

const Seller = mongoose.model('Seller', sellerSchema);

module.exports = Seller;
