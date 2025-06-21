// routes/sellerRoutes.js
const express = require('express');
const router = express.Router();
const { createSeller, getSellerProfile } = require('../controllers/sellerController');
const authRequired = require('../middleware/auth');

// Create Seller Profile (protected)
router.post('/create', authRequired, createSeller);

// Get Seller Profile for the logged-in user (protected)
router.get('/me', authRequired, getSellerProfile);

module.exports = router;
