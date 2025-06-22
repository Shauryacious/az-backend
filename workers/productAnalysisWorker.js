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
    // password: process.env.REDIS_PASSWORD, 
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

        product.signalBreakdown = product.signalBreakdown || {};
        product.signalBreakdown.descMatch = result.score;

        product.flags = product.flags || [];
        if (result.label === 'Fake') {
            if (!product.flags.includes('desc_image_mismatch')) {
                product.flags.push('desc_image_mismatch');
            }
        } else {
            product.flags = product.flags.filter(f => f !== 'desc_image_mismatch');
        }

        // Update trustScore, riskLevel, status using model methods (if implemented)
        if (typeof product.computeRiskLevel === 'function') {
            product.trustScore = result.score;
            product.riskLevel = product.computeRiskLevel();
            product.status = product.computeStatus();
        }

        product.statusHistory = product.statusHistory || [];
        product.statusHistory.push({
            status: product.status,
            changedAt: new Date(),
            reason: 'Image-description AI analysis (auto)',
            flags: product.flags,
        });

        await product.save();
        console.log(`Product ${productId} updated with AI analysis.`);
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
