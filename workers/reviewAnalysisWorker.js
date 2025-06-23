// workers/reviewAnalysisWorker.js

const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Review = require('../models/Review');
const Product = require('../models/Product');
const { analyzeReview } = require('../utils/reviewAnalyzerApi');

// Redis connection options
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    // password: process.env.REDIS_PASSWORD, // Uncomment if needed
};

// Ensure Mongoose connection
if (mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('Review worker connected to MongoDB'))
        .catch(err => {
            console.error('MongoDB connection error:', err);
            process.exit(1);
        });
}

// Thresholds and window settings
const AI_CONFIDENCE_THRESHOLD = 0.5; // Adjust as needed
const BURST_WINDOW_MINUTES = 60;     // Time window for burst detection (in minutes)
const BURST_MIN_COUNT = 2;           // Minimum flagged reviews in burst window

// Create the worker
const worker = new Worker('review-analysis', async job => {
    const { reviewId, comment, rating, productId } = job.data;
    console.log('--- JOB START ---');
    console.log('Received job data:', { reviewId, comment, rating, productId });

    if (!reviewId || !comment || rating == null || !productId) {
        console.error('Missing job data:', job.data);
        return;
    }

    try {
        // Analyze review via external API
        const result = await analyzeReview(comment, rating);
        const confidence = result?.confidence;
        if (confidence === undefined) {
            console.error('No confidence returned from analyzeReview:', result);
            return;
        }
        console.log('AI confidence:', confidence.toFixed(4));

        // Determine AI flag
        const aiFlag = confidence >= AI_CONFIDENCE_THRESHOLD;

        // Update the review document
        const review = await Review.findByIdAndUpdate(
            reviewId,
            { confidence, aiFlag },
            { new: true }
        );
        console.log('Updated review:', review);

        // Calculate burst window start time
        const burstWindowStart = new Date(Date.now() - BURST_WINDOW_MINUTES * 60 * 1000);
        console.log('Burst window start at:', burstWindowStart.toISOString());

        // Fetch recent AI-flagged reviews for this product
        const recentReviews = await Review.find({
            product: productId,
            createdAt: { $gte: burstWindowStart },
            aiFlag: true
        });
        console.log('Recent AI-flagged reviews count:', recentReviews.length);
        console.log('Review IDs in window:', recentReviews.map(r => r._id.toString()));

        // Burst detection
        if (recentReviews.length >= BURST_MIN_COUNT) {
            const avgConfidence = recentReviews.reduce((sum, r) => sum + (r.confidence || 0), 0) / recentReviews.length;
            console.log('Average confidence for burst group:', avgConfidence.toFixed(4));

            if (avgConfidence >= AI_CONFIDENCE_THRESHOLD) {
                // Flag all burst reviews for takedown
                await Review.updateMany(
                    { _id: { $in: recentReviews.map(r => r._id) } },
                    { takedownFlag: true }
                );

                // Update product flags
                await Product.findByIdAndUpdate(productId, {
                    $addToSet: { flags: 'ai_review_burst' }
                });

                // Log burst detection event
                console.log('--- AI Review Burst Detected ---');
                console.log(`Time: ${new Date().toISOString()}`);
                console.log(`Product: ${productId}`);
                console.log(`Burst review count: ${recentReviews.length}`);
                console.log(`Average AI confidence: ${avgConfidence.toFixed(4)}`);
                console.log(`Review IDs flagged: ${recentReviews.map(r => r._id.toString()).join(', ')}`);
                console.log('All burst reviews have been marked with takedownFlag and product flagged for audit.');
            }
        }

        console.log(`Review ${reviewId} analyzed: aiFlag=${aiFlag}, confidence=${confidence.toFixed(4)}`);

    } catch (err) {
        console.error(`Worker error for review ${reviewId}:`, err);
    }
}, { connection });

// Worker lifecycle events
worker.on('completed', job => {
    console.log(`Review job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    console.error(`Review job ${job.id} failed:`, err);
});
