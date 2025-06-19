// routes/index.js
const express = require('express');
const userRoutes = require('./userRoutes');
const sellerRoutes = require('./sellerRoutes');
const productRoutes = require('./productRoutes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/sellers', sellerRoutes);
router.use('/products', productRoutes);

module.exports = router;
