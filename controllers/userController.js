// controllers/userController.js
const User = require('../models/User');
const Seller = require('../models/Seller');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Map x-client-type header to user roles and cookie names
const clientConfigMap = {
    'seller-frontend': { role: 'seller', cookie: 'seller_token' },
    'consumer-frontend': { role: 'consumer', cookie: 'consumer_token' },
    'beacon-frontend': { role: 'admin', cookie: 'beacon_token' },
};

function getClientConfig(req) {
    const clientType = req.headers['x-client-type'];
    return clientConfigMap[clientType];
}

/**
 * Register a new user (consumer, seller, or admin).
 * If seller, also create a Seller profile.
 */
exports.signup = async (req, res, next) => {
    try {
        const clientConfig = getClientConfig(req);
        if (!clientConfig) {
            return res.status(400).json({ error: 'Unknown or missing client type' });
        }

        const { email, password, businessName, contactEmail } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (await User.findOne({ email })) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            email,
            password: hashedPassword,
            role: clientConfig.role,
        });

        // If seller, create Seller profile
        if (clientConfig.role === 'seller') {
            if (!businessName || !contactEmail) {
                return res.status(400).json({ error: 'Business name and contact email required for sellers' });
            }
            await Seller.create({
                user: user._id,
                businessName,
                contactEmail,
            });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set JWT as HTTP-only cookie
        res.cookie(clientConfig.cookie, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
            message: 'User created and logged in successfully',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Login user and set JWT cookie.
 */
exports.login = async (req, res, next) => {
    try {
        const clientConfig = getClientConfig(req);
        if (!clientConfig) {
            return res.status(400).json({ error: 'Unknown or missing client type' });
        }

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || user.role !== clientConfig.role) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie(clientConfig.cookie, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Logout user by clearing their role-specific cookie.
 */
exports.logout = (req, res) => {
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

/**
 * Get the current user's profile.
 */
exports.getProfile = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (err) {
        next(err);
    }
};
