// models/Product.js
const mongoose = require('mongoose');

/**
 * Product Schema
 * - seller: reference to Seller document (required)
 * - name, sku, description: core product info
 * - images, logo, brand, barcode, QR, packaging, and label info
 * - price, stock, category, variants
 * - AI/ML authenticity analysis fields
 * - createdAt, updatedAt: timestamps
 */
const productSchema = new mongoose.Schema(
    {
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Seller',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
        },
        sku: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            index: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        images: [
            {
                type: String,
                trim: true,
            },
        ],
        brand: {
            type: String,
            trim: true,
        },
        logoImage: {
            type: String,
            trim: true,
        },
        logoFeatures: {
            type: mongoose.Schema.Types.Mixed,
        },
        barcode: {
            type: String,
            trim: true,
        },
        qrCode: {
            type: String,
            trim: true,
        },
        barcodeImage: {
            type: String,
            trim: true,
        },
        qrCodeImage: {
            type: String,
            trim: true,
        },
        packagingImages: [
            {
                type: String,
                trim: true,
            },
        ],
        labelText: {
            type: String,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0.01,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
        },
        category: {
            type: String,
            trim: true,
        },
        variants: [
            {
                size: { type: String, trim: true },
                color: { type: String, trim: true },
                stock: { type: Number, min: 0 },
                price: { type: Number, min: 0.01 },
            },
        ],
        authenticityScore: {
            type: Number,
            min: 0,
            max: 1,
            default: null,
        },
        authenticityFlag: {
            type: String,
            enum: ['genuine', 'suspicious', 'counterfeit', null],
            default: null,
        },
        aiAnalysisMeta: {
            type: mongoose.Schema.Types.Mixed,
        },
        provenance: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
        versionKey: '__v',
    }
);

// Compound text index for search
productSchema.index({
    name: 'text',
    description: 'text',
    brand: 'text',
    labelText: 'text',
    sku: 'text',
});

// Price index for sorting/filtering
productSchema.index({ price: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
