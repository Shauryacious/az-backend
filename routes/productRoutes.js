const express = require('express');
const router = express.Router();
const { createProduct, getMyProducts } = require('../controllers/productController');
const authRequired = require('../middleware/auth');

// Create a new product listing
router.post('/create', authRequired, createProduct);

// Get all products for the current seller
router.get('/mine', authRequired, getMyProducts);

module.exports = router;
