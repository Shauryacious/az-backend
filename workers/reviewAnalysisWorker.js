// workers/reviewAnalysisWorker.js

const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Review = require('../models/Review');
const Product = require('../models/Product');
const { analyzeReview } = require('../utils/reviewAnalyzerApi');

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    // password: process.env.REDIS_PASSWORD, // Uncomment if needed
};

// Connect to MongoDB if not already connected
if (mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('Review worker connected to MongoDB'))
        .catch(err => {
            console.error('MongoDB connection error:', err);
            process.exit(1);
        });
}

const AI_CONFIDENCE_THRESHOLD = 0.8; // Adjust as needed
const BURST_WINDOW_MINUTES = 60;     // Time window for burst detection
const BURST_MIN_COUNT = 5;           // Minimum reviews in burst

const worker = new Worker('review-analysis', async job => {
    const { reviewId, comment, rating, productId } = job.data;
    if (!reviewId || !comment || !rating || !productId) {
        console.error('Missing job data:', job.data);
        return;
    }

    try {
        // 1. Analyze review using Python microservice (returns { pred, confidence })
        const { pred, confidence } = await analyzeReview(comment, rating);

        // 2. Update the review with confidence and AI flag
        const aiFlag = pred === 1 && confidence >= AI_CONFIDENCE_THRESHOLD;
        const review = await Review.findByIdAndUpdate(
            reviewId,
            { confidence, aiFlag },
            { new: true }
        );

        // 3. Burst detection (check recent reviews for this product)
        const burstWindowStart = new Date(Date.now() - BURST_WINDOW_MINUTES * 60 * 1000);
        const recentReviews = await Review.find({
            product: productId,
            createdAt: { $gte: burstWindowStart },
            aiFlag: true
        });

        if (recentReviews.length >= BURST_MIN_COUNT) {
            // Compute average confidence of AI-flagged reviews
            const avgConfidence = recentReviews.reduce((sum, r) => sum + (r.confidence || 0), 0) / recentReviews.length;
            if (avgConfidence >= AI_CONFIDENCE_THRESHOLD) {
                // Mark all reviews in burst as taken down
                await Review.updateMany(
                    { _id: { $in: recentReviews.map(r => r._id) } },
                    { takedownFlag: true }
                );
                // Optionally, flag the product for audit
                await Product.findByIdAndUpdate(productId, {
                    $addToSet: { flags: 'ai_review_burst' }
                });
                console.log(`Burst detected: ${recentReviews.length} AI reviews for product ${productId}. All taken down.`);
            }
        }

        console.log(`Review ${reviewId} analyzed: aiFlag=${aiFlag}, confidence=${confidence.toFixed(2)}`);
    } catch (err) {
        console.error(`Worker error for review ${reviewId}:`, err);
    }
}, { connection });

worker.on('completed', job => {
    console.log(`Review job ${job.id} completed`);
});
worker.on('failed', (job, err) => {
    console.error(`Review job ${job.id} failed:`, err);
});
