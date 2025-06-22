// utils/reviewAnalyzerApi.js

const axios = require('axios');

// /**
//  * Call the Python review analyzer microservice.
//  * @param {string} comment - The review text.
//  * @param {number} rating - The review rating.
//  * @returns {Promise<{pred: number, confidence: number}>}
//  */

async function analyzeReview(comment, rating) {
    try {
        const response = await axios.post('http://localhost:8002/analyze', {
            comment,
            rating,
        }, {
            timeout: 10000,
        });
        // Expecting { pred: 0|1, confidence: float }
        return response.data;
    } catch (err) {
        throw new Error('Review Analyzer API error: ' + (err.response?.data?.error || err.message));
    }
}

module.exports = { analyzeReview };
