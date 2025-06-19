// src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { createProduct, getMyProducts } = require('../controllers/productController');
const authRequired = require('../middleware/auth');
const upload = require('../middleware/multer');

// Create a new product listing (with up to 5 images)
router.post(
    '/create',
    authRequired,
    upload.array('images', 5), // field name 'images', max 5 files
    createProduct
);

// Get all products for the current seller
router.get('/mine', authRequired, getMyProducts);

module.exports = router;
