// routes/users.js
const express = require('express');
const router = express.Router();
const { signup, login, logout, getProfile } = require('../controllers/userController');
const authRequired = require('../middleware/auth');

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// Protected route: profile
router.get('/profile', authRequired, getProfile);

module.exports = router;
