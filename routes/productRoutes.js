// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { getAllProducts, createProduct, getMyProducts } = require('../controllers/productController');
const authRequired = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const upload = require('../middleware/multer');
const validate = require('../middleware/validate');
const { createProductSchema } = require('../validators/productSchemas');

// Public: Get all products for consumers (no auth required)
router.get('/', getAllProducts);

// Seller: Create a new product listing (protected)
router.post(
    '/create',
    authRequired,
    rbac(['seller']),
    upload.array('images', 5),
    validate(createProductSchema),
    createProduct
);

// Seller: Get all products for the logged-in seller (protected)
router.get(
    '/mine',
    authRequired,
    rbac(['seller']),
    getMyProducts
);

module.exports = router;
