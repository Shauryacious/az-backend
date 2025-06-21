// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { signup, login, logout, getProfile } = require('../controllers/userController');
const authRequired = require('../middleware/auth');

// Public registration and login routes
router.post('/signup', signup);
router.post('/login', login);

// Logout (requires authentication)
router.post('/logout', authRequired, logout);

// Get current user profile (requires authentication)
router.get('/profile', authRequired, getProfile);

module.exports = router;
