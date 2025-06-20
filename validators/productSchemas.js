const { z } = require('zod');

const createProductSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    sku: z.string().min(1, 'SKU is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.preprocess((val) => parseFloat(val), z.number().positive('Price must be positive')),
    available: z.preprocess((val) => parseInt(val, 10), z.number().int().min(0, 'Stock must be >= 0')),
    // Add more fields/validation as needed
});

module.exports = {
    createProductSchema,
};
