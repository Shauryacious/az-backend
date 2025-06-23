// models/Product.js

const mongoose = require('mongoose');

/**
 * Product Schema 
 * - Unified trust, risk, and flag system for LLM-driven marketplace trust
 * - Tracks detailed AI/ML signal breakdown, flags, and status history
 * - Extensible for new signals, fully auditable, and explainable
 */
const productSchema = new mongoose.Schema(
    {
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Seller',
            required: true,
            index: true,
        },
        name: { type: String, required: true, trim: true, minlength: 1 },
        sku: { type: String, required: true, trim: true, unique: true, index: true },
        description: { type: String, required: true, trim: true },
        images: [{ type: String, trim: true }],
        brand: { type: String, trim: true },
        logoImage: { type: String, trim: true },
        logoFeatures: { type: mongoose.Schema.Types.Mixed },
        barcode: { type: String, trim: true },
        qrCode: { type: String, trim: true },
        barcodeImage: { type: String, trim: true },
        qrCodeImage: { type: String, trim: true },
        packagingImages: [{ type: String, trim: true }],
        labelText: { type: String, trim: true },
        price: { type: Number, required: true, min: 0.01 },
        stock: { type: Number, required: true, min: 0 }, category: { type: String, trim: true },
        variants: [
            {
                size: { type: String, trim: true },
                color: { type: String, trim: true },
                stock: { type: Number, min: 0 },
                price: { type: Number, min: 0.01 },
            },
        ],

        // --- Trust, Risk, and Flags ---
        status: {
            type: String,
            enum: ['active', 'pending', 'takedown'],
            default: 'pending',
            index: true,
        },
        trustScore: {
            type: Number, // Aggregated trust/confidence score, 0 (low) to 1 (high)
            min: 0,
            max: 1,
            default: null,
            index: true,
        },
        riskLevel: {
            type: String, // Standardized risk color code
            enum: ['green', 'yellow', 'red'],
            default: 'yellow',
            index: true,
        },
        flags: [
            {
                type: String,
                enum: [
                    'logo_mismatch',
                    'desc_image_mismatch',
                    'review_burst',
                    'high_return',
                    'ai_review_detected',
                    'seller_risk',
                    'network_collusion',
                    'barcode_invalid',
                    'other',
                ],
            },
        ],
        signalBreakdown: {
            type: mongoose.Schema.Types.Mixed, // { logo: 0.92, descMatch: 0.87, reviews: 0.65, returns: 0.80, seller: 0.90 }
        },
        statusHistory: [
            {
                status: { type: String, enum: ['active', 'pending', 'takedown'] },
                changedAt: { type: Date, default: Date.now },
                reason: String,
                flags: [String],
            },
        ],

        // --- AI/ML Meta and Provenance ---
        aiAnalysisMeta: { type: mongoose.Schema.Types.Mixed },
        provenance: { type: mongoose.Schema.Types.Mixed },
    },
    {
        timestamps: true,
        versionKey: '__v',
    }
);

// --- Indexes for Search and Filtering ---
productSchema.index({
    name: 'text',
    description: 'text',
    brand: 'text',
    labelText: 'text',
    sku: 'text',
});
productSchema.index({ price: 1 });

/**
 * Compute risk level based on trustScore and critical flags
 */
productSchema.methods.computeRiskLevel = function () {
    const criticalFlags = [
        'logo_mismatch',
        'desc_image_mismatch',
        'seller_risk',
        'network_collusion',
        'barcode_invalid',
    ];
    if (this.flags && this.flags.some(flag => criticalFlags.includes(flag))) {
        return 'red';
    }
    if (typeof this.trustScore === 'number' && this.trustScore >= 0.8) return 'green';
    if (typeof this.trustScore === 'number' && this.trustScore >= 0.000001) return 'yellow';
    return 'red';
};

/**
 * Set trustScore (0-1), clamp and ensure proper risk/status update.
 * Optionally pass a reason for statusHistory.
 */
productSchema.methods.setTrustScore = function (score, reason = "AI/ML update") {
    this.trustScore = Math.max(0, Math.min(1, score));
    this.updateTrustAndStatus(reason);
};

/**
 * Compute product status from riskLevel
 */
productSchema.methods.computeStatus = function () {
    if (this.riskLevel === 'green') return 'active';
    if (this.riskLevel === 'yellow') return 'pending';
    return 'pending';
};

/**
 * Update status and riskLevel after AI/ML analysis
 * (Call this after updating trustScore, flags, or signalBreakdown)
 */
productSchema.methods.updateTrustAndStatus = function (reason = 'Automated trust/risk update') {
    this.riskLevel = this.computeRiskLevel();
    let newStatus = this.computeStatus();

    // Prevent AI/ML from setting takedown automatically
    if (newStatus === 'takedown') {
        newStatus = 'pending';
    }

    if (this.status !== newStatus) {
        this.status = newStatus;
        this.statusHistory.push({
            status: newStatus,
            changedAt: new Date(),
            reason,
            flags: this.flags,
        });
    }
};


const Product = mongoose.model('Product', productSchema);

module.exports = Product;
