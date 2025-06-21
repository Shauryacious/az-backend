// db.js
const mongoose = require('mongoose');

/**
 * Connects to MongoDB using Mongoose.
 * Uses environment variable MONGO_URI for the connection string.
 * Handles connection errors and logs status.
 */
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            // These options are defaults as of Mongoose 7.x+
            // useNewUrlParser and useUnifiedTopology are no longer required but kept for backward compatibility
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // Add more options here if needed (e.g., autoIndex: false in production)
        });
        console.log('✅ MongoDB connected');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1); // Exit process with failure
    }
}

// Optional: Handle graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
});

module.exports = connectDB;
