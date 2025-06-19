// src/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    images: [{
        type: String,
        trim: true
    }],
    brand: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0.01
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        trim: true
    },
    variants: [{
        size: { type: String, trim: true },
        color: { type: String, trim: true },
        stock: { type: Number, min: 0 },
        price: { type: Number, min: 0.01 }
    }]
}, {
    timestamps: true,
    versionKey: '__v' // Enables versioning for safe updates[6]
});

// Index for text search and fast queries
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);
