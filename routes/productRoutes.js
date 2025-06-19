const express = require('express');
const router = express.Router();
const { createProduct, getMyProducts } = require('../controllers/productController');
const authRequired = require('../middleware/auth');
const upload = require('../middleware/multer');


// Create a new product listing | For multiple images: upload.array('images', 5)
router.post('/create', authRequired, upload.array('images', 5), createProduct);

// Get all products for the current seller
router.get('/mine', authRequired, getMyProducts);

module.exports = router;