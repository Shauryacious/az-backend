// validators/reviewSchemas.js
const { z } = require('zod');

const addReviewSchema = z.object({
    rating: z.preprocess(
        val => Number(val),
        z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5')
    ),
    comment: z.string().max(2000, 'Comment too long').optional(),
});

module.exports = {
    addReviewSchema,
};
