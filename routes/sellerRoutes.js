const express = require('express');
const router = express.Router();
const { createSeller, getSellerProfile } = require('../controllers/sellerController');
const authRequired = require('../middleware/auth'); // <-- must be the multi-cookie version

// Create Seller Profile (POST)
router.post('/create', authRequired, createSeller);

// Get Seller Profile (GET)
router.get('/me', authRequired, getSellerProfile);

module.exports = router;
