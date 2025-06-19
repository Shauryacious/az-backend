// middleware/errorHandlers.js
const multer = require('multer');

// Multer/file upload error handler
function multerErrorHandler(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'File upload error', error: err.message });
    }
    next(err);
}

// Global error handler
function globalErrorHandler(err, req, res, next) {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
}

module.exports = { multerErrorHandler, globalErrorHandler };
