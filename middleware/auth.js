// middleware/auth.js
const jwt = require('jsonwebtoken');

// Map client types to their cookie names
const clientCookieMap = {
    'consumer-frontend': 'consumer_token',
    'seller-frontend': 'seller_token',
    'beacon-frontend': 'beacon_token'
};

const authRequired = (req, res, next) => {
    try {
        // Get the client type from header
        const clientType = req.headers['x-client-type'];
        const cookieName = clientCookieMap[clientType];

        // If the client type is not recognized, block access
        if (!cookieName) {
            return res.status(400).json({ error: 'Unknown or missing client type' });
        }

        // Read the correct cookie for this client
        const token = req.cookies[cookieName];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = authRequired;
