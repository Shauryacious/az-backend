// models/User.js
const mongoose = require('mongoose');

/**
 * User Schema
 * - email: unique identifier for the user
 * - password: hashed password (never store plain text)
 * - role: user role ('seller', 'consumer', 'admin')
 * - createdAt, updatedAt: timestamps
 */
const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/.+@.+\..+/, 'Please fill a valid email address'],
        },
        password: {
            type: String,
            required: true,
            minlength: 8, // Modern security minimum
            select: false, // Never return password by default
        },
        role: {
            type: String,
            enum: ['seller', 'consumer', 'admin'],
            required: true,
            default: 'consumer',
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Index for faster queries on email
userSchema.index({ email: 1 });

// Optionally, add methods for password hashing/validation here

const User = mongoose.model('User', userSchema);

module.exports = User;
