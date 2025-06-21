// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const {
    addReview,
    getProductReviews,
    getMyReviewForProduct,
} = require('../controllers/reviewController');
const authRequired = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { addReviewSchema } = require('../validators/reviewSchemas');

// Consumer: Add a review for a product (protected)
router.post(
    '/:productId',
    authRequired,
    rbac(['consumer']),
    validate(addReviewSchema),
    addReview
);

// Public: Get all reviews for a product
router.get('/product/:productId', getProductReviews);

// Consumer: Get the current user's review for a product (protected)
router.get(
    '/product/:productId/mine',
    authRequired,
    rbac(['consumer']),
    getMyReviewForProduct
);

module.exports = router;
