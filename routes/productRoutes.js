const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    createProduct,
    getMyProducts,
} = require('../controllers/productController');
const authRequired = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const upload = require('../middleware/multer');
const validate = require('../middleware/validate');
const { createProductSchema } = require('../validators/productSchemas');

// PUBLIC: Get all products
router.get('/', getAllProducts);

// SELLER: Get all products for the logged-in seller (protected)
router.get(
    '/mine',
    authRequired,
    rbac(['seller']),
    getMyProducts
);

// SELLER: Create a new product listing (protected)
router.post(
    '/create',
    authRequired,
    rbac(['seller']),
    upload.array('images', 5),
    validate(createProductSchema),
    createProduct
);

// PUBLIC: Get a single product by ID
router.get('/:id', getProductById);

module.exports = router;
