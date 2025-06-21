// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Map x-client-type header to user roles and cookie names
const clientConfigMap = {
    'seller-frontend': { role: 'seller', cookie: 'seller_token' },
    'consumer-frontend': { role: 'consumer', cookie: 'consumer_token' },
    'beacon-frontend': { role: 'admin', cookie: 'beacon_token' }
};

const getClientConfig = (req) => {
    const clientType = req.headers['x-client-type'];
    return clientConfigMap[clientType];
};

const signup = async (req, res) => {
    try {
        const clientConfig = getClientConfig(req);
        if (!clientConfig) {
            return res.status(400).json({ error: 'Unknown or missing client type' });
        }

        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, role: clientConfig.role });
        await user.save();

        // Generate JWT after successful signup
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        // Set JWT as HTTP-only cookie, unique per frontend
        res.cookie(clientConfig.cookie, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(201).json({ message: 'User created and logged in successfully', role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const clientConfig = getClientConfig(req);
        if (!clientConfig) {
            return res.status(400).json({ error: 'Unknown or missing client type' });
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.role !== clientConfig.role) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate JWT with role
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        // Set JWT as HTTP-only cookie, unique per frontend
        res.cookie(clientConfig.cookie, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
        res.json({ message: 'Login successful', role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const logout = (req, res) => {
    const clientConfig = getClientConfig(req);
    if (!clientConfig) {
        return res.status(400).json({ error: 'Unknown or missing client type' });
    }
    res.clearCookie(clientConfig.cookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });
    res.status(200).json({ message: 'Logged out' });
};

const getProfile = (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({ user: req.user });
};

module.exports = { signup, login, logout, getProfile };
