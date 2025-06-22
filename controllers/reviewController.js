// controllers/reviewController.js
const Review = require('../models/Review');
const Product = require('../models/Product');
const reviewAnalysisQueue = require('../queues/reviewAnalysisQueue');

/**
 * Add a review for a product (consumer only).
 * POST /api/reviews/:productId
 */
exports.addReview = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.params;
        const { rating, comment } = req.body;

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
        }

        // Ensure product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Create or update review (unique index will prevent duplicates)
        const review = await Review.findOneAndUpdate(
            { product: productId, user: userId },
            { rating, comment },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Add review analysis job to the queue
        await reviewAnalysisQueue.add('analyze', {
            reviewId: review._id.toString(),
            comment: review.comment,
            rating: review.rating,
            productId: review.product.toString(),
        });

        res.status(201).json({ message: 'Review submitted.', review });
    } catch (err) {
        // Handle duplicate review error
        if (err.code === 11000) {
            return res.status(409).json({ error: 'You have already reviewed this product.' });
        }
        next(err);
    }
};

/**
 * Get all reviews for a product.
 * GET /api/reviews/product/:productId
 */
exports.getProductReviews = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ product: productId, takedownFlag: { $ne: true } }) // Hide taken down reviews
            .populate('user', 'email')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ reviews });
    } catch (err) {
        next(err);
    }
};

/**
 * Get the current user's review for a product (optional).
 * GET /api/reviews/product/:productId/mine
 */
exports.getMyReviewForProduct = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.params;
        const review = await Review.findOne({ product: productId, user: userId }).lean();
        if (!review) {
            return res.status(404).json({ error: 'Review not found.' });
        }
        res.json({ review });
    } catch (err) {
        next(err);
    }
};
