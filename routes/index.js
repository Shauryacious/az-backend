// routes/index.js
const express = require('express');
const userRoutes = require('./userRoutes');
const sellerRoutes = require('./sellerRoutes');
const productRoutes = require('./productRoutes');
const reviewRoutes = require('./reviewRoutes');

const router = express.Router();

// All API routes are mounted under /api in app.js
router.use('/users', userRoutes);
router.use('/sellers', sellerRoutes);
router.use('/products', productRoutes);
router.use('/reviews', reviewRoutes);

module.exports = router;
