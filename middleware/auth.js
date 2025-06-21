// middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Maps frontend client types to their respective cookie names.
 * Extend this map if you add more frontends.
 */
const CLIENT_COOKIE_MAP = {
    'consumer-frontend': 'consumer_token',
    'seller-frontend': 'seller_token',
    'beacon-frontend': 'beacon_token',
};

/**
 * Authentication middleware.
 * - Requires an 'x-client-type' header.
 * - Reads the appropriate cookie for the client.
 * - Verifies the JWT and attaches the decoded user to req.user.
 * - Returns 400 for unknown client types, 401 for missing/invalid tokens.
 */
function authRequired(req, res, next) {
    try {
        const clientType = req.headers['x-client-type'];
        const cookieName = CLIENT_COOKIE_MAP[clientType];

        if (!cookieName) {
            return res.status(400).json({ error: 'Unknown or missing client type' });
        }

        const token = req.cookies[cookieName];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: token not found' });
        }

        // Throws if invalid
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();
    } catch (err) {
        // JWT errors are handled here
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = authRequired;
