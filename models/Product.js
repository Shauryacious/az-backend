const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true,
        index: true
    },
    name: { type: String, required: true, trim: true, minlength: 1 },
    sku: { type: String, required: true, trim: true, unique: true }, // <-- Added SKU
    description: { type: String, required: true, trim: true },
    images: [{
        type: String, // URLs to product images
        trim: true
    }],

    // Logo and Brand Analysis
    brand: { type: String, trim: true },
    logoImage: { type: String, trim: true },
    logoFeatures: { type: mongoose.Schema.Types.Mixed },

    // Barcode/QR Code Info
    barcode: { type: String, trim: true },
    qrCode: { type: String, trim: true },
    barcodeImage: { type: String, trim: true },
    qrCodeImage: { type: String, trim: true },

    // Packaging/Label Info
    packagingImages: [{ type: String, trim: true }],
    labelText: { type: String, trim: true },

    // Existing fields
    price: { type: Number, required: true, min: 0.01 },
    stock: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true },
    variants: [{
        size: { type: String, trim: true },
        color: { type: String, trim: true },
        stock: { type: Number, min: 0 },
        price: { type: Number, min: 0.01 }
    }],

    // AI/ML Analysis Results
    authenticityScore: { type: Number, min: 0, max: 1, default: null },
    authenticityFlag: { type: String, enum: ['genuine', 'suspicious', 'counterfeit', null], default: null },
    aiAnalysisMeta: { type: mongoose.Schema.Types.Mixed },
    provenance: { type: mongoose.Schema.Types.Mixed },
}, {
    timestamps: true,
    versionKey: '__v'
});

// Index for text search and fast queries
productSchema.index({ name: 'text', description: 'text', brand: 'text', labelText: 'text', sku: 'text' });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);
