// queues/productAnalysisQueue.js

const { Queue } = require('bullmq');

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
};

const productAnalysisQueue = new Queue('product-analysis', { connection });

module.exports = productAnalysisQueue;
