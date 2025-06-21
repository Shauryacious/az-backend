// validators/productSchemas.js
const { z } = require('zod');

/**
 * Product creation schema for validating incoming product data.
 * All fields are validated for type and business rules.
 * You can easily extend this schema with more fields as your model grows.
 */
const createProductSchema = z.object({
    name: z.string().min(1, 'Product name is required').max(100),
    sku: z.string().min(1, 'SKU is required').max(64),
    description: z.string().min(1, 'Description is required').max(2000),
    price: z.preprocess(
        val => parseFloat(val),
        z.number().positive('Price must be positive')
    ),
    stock: z.preprocess(
        val => parseInt(val, 10),
        z.number().int().min(0, 'Stock must be >= 0')
    ),
    category: z.string().optional(),
    brand: z.string().optional(),
    labelText: z.string().optional(),
    // Add more fields and validation as needed
});

module.exports = {
    createProductSchema,
};
