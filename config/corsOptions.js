// config/corsOptions.js
const allowedOrigins = [
    'http://localhost:5173', // Customer
    'http://localhost:5174' // Seller
];

module.exports = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

