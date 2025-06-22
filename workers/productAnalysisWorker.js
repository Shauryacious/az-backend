// workers/productAnalysisWorker.js
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Product = require('../models/Product');
const { matchImageWithDescription } = require('../utils/blipApi');

// Connect to MongoDB if not already connected
if (mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('Worker connected to MongoDB'))
        .catch(err => {
            console.error('MongoDB connection error:', err);
            process.exit(1);
        });
}

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
};

const worker = new Worker('product-analysis', async job => {
    const { productId, description, imagePath } = job.data;
    if (!productId || !description || !imagePath) {
        console.error('Missing job data:', job.data);
        return;
    }

    try {
        // Call the Python BLIP microservice
        const result = await matchImageWithDescription(imagePath, description);

        // Update product in DB
        const product = await Product.findById(productId);
        if (!product) {
            console.error(`Product not found: ${productId}`);
            return;
        }

        // Only mark desc_image_mismatch flag
        product.flags = product.flags || [];
        if (result.label === 'Fake') {
            if (!product.flags.includes('desc_image_mismatch')) {
                product.flags.push('desc_image_mismatch');
            }
            // Clamp trustScore to [0, 1] using setTrustScore
            const newScore = product.trustScore !== null ? product.trustScore - 0.2 : 0.2;
            product.setTrustScore(newScore, "AI/ML: Description-image mismatch detected");
        } else {
            product.flags = product.flags.filter(f => f !== 'desc_image_mismatch');
            const newScore = product.trustScore !== null ? product.trustScore + 0.1 : 1;
            product.setTrustScore(newScore, "AI/ML: Description-image match confirmed");
        }

        await product.save();
        console.log(`Product ${productId} updated with AI analysis. Trust score: ${product.trustScore}`);
    } catch (err) {
        console.error(`Worker error for product ${productId}:`, err);
    }
}, { connection });

worker.on('completed', job => {
    console.log(`Job ${job.id} completed`);
});
worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err);
});
