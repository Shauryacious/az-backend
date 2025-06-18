const express = require('express');
const router = express.Router();
const { signup, login, logout, getProfile } = require('../controllers/userController');
const authRequired = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// Use the controller here
router.get('/profile', authRequired, getProfile);

module.exports = router;
