// queues/reviewAnalysisQueue.js

const { Queue } = require('bullmq');

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    // password: process.env.REDIS_PASSWORD, 
};

const reviewAnalysisQueue = new Queue('review-analysis', { connection });

module.exports = reviewAnalysisQueue;
