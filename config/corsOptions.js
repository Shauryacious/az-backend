// config/corsOptions.js
module.exports = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
};
