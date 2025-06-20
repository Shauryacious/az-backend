const express = require('express');
const router = express.Router();
const { createProduct, getMyProducts } = require('../controllers/productController');
const authRequired = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const upload = require('../middleware/multer');
const validate = require('../middleware/validate');
const { createProductSchema } = require('../validators/productSchemas');

// Only sellers can create a new product listing
router.post(
    '/create',
    authRequired,
    rbac(['seller']),
    upload.array('images', 5),
    validate(createProductSchema), // Input validation here
    createProduct
);

// Only sellers can get all their products
router.get(
    '/mine',
    authRequired,
    rbac(['seller']),
    getMyProducts
);

module.exports = router;
