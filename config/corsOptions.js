// config/corsOptions.js

// Read allowed origins from environment variable or fallback to local dev
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

// Fallback for local dev if ALLOWED_ORIGINS is not set
if (allowedOrigins.length === 0) {
    allowedOrigins.push('http://localhost:5173', 'http://localhost:5174');
}

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like Postman, curl, mobile apps)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};

module.exports = corsOptions;



// 'http://localhost:5173', // Customer
// 'http://localhost:5174' // Seller