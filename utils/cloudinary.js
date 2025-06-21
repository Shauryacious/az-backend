// utils/cloudinary.js
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary using environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Always use HTTPS
});

// /**
//  * Uploads a buffer to Cloudinary and returns the secure URL.
//  * @param {Buffer} buffer - Image buffer
//  * @param {string} folder - Cloudinary folder name
//  * @param {object} [options] - Additional Cloudinary options
//  * @returns {Promise<string>} - Secure URL of uploaded image
//  */
const uploadBuffer = (buffer, folder, options = {}) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, ...options },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
};

module.exports = {
    cloudinary,
    uploadBuffer,
};
