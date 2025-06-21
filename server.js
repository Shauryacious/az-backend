// server.js
require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./db');

const PORT = process.env.PORT || 3000;

(async () => {
    try {
        // Connect to MongoDB before starting the server
        await connectDB();

        const server = http.createServer(app);

        server.listen(PORT, () => {
            console.log(`🚀 HTTP server running on port ${PORT}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM signal received: closing HTTP server');
            server.close(() => {
                console.log('HTTP server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('SIGINT signal received: closing HTTP server');
            server.close(() => {
                console.log('HTTP server closed');
                process.exit(0);
            });
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
})();
