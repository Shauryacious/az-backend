// middleware/errorHandlers.js
const multer = require('multer');

/**
 * Multer/file upload error handler
 * Catches Multer errors and sends a 400 response.
 */
function multerErrorHandler(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            error: 'File upload error',
            details: err.message,
        });
    }
    next(err);
}

/**
 * Global error handler
 * Catches all unhandled errors and sends a 500 response.
 * Logs error stack for debugging.
 */
function globalErrorHandler(err, req, res, next) {
    // Log error with stack trace for debugging (in production, use a logger)
    // Optionally, you can integrate a logger here (e.g., winston, pino)
    console.error('Unhandled error:', err.stack || err);

    // Customize error response for different error types if needed
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        // Only include stack in non-production environments
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
}

module.exports = {
    multerErrorHandler,
    globalErrorHandler,
};
