const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        confidence: {
            type: Number,  // Confidence score that review is AI-generated, 0.0 to 1.0
            min: 0,
            max: 1,
            default: null,
            index: true,
        },
        aiFlag: {
            type: Boolean,  // True if review is AI-generated with high confidence
            default: false,
            index: true,
        },
        takedownFlag: {
            type: Boolean,  // True if review is taken down due to burst AI reviews
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate reviews from the same user for the same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
