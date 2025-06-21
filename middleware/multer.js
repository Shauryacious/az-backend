// middleware/multer.js
const multer = require('multer');

// Allowed image MIME types
const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
];

// Use memory storage for direct buffer upload to Cloudinary
const storage = multer.memoryStorage();

/**
 * File filter to allow only specific image types.
 */
const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, png, webp, gif) are allowed!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 5, // Max 5 files per request
    },
});

module.exports = upload;
