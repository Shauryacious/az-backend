// middleware/validate.js

// /**
//  * Validation middleware using Zod or similar schema library.
//  * Validates req.body against the provided schema.
//  * On success, attaches the parsed body to req.body.
//  * On failure, returns a 400 error with detailed validation messages.
//  *
//  * @param {object} schema - Zod (or compatible) schema for validation
//  * @returns {Function} Express middleware
//  */
function validate(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (err) {
            // Zod error: err.errors is an array of error objects
            const errors = err.errors?.map(e => e.message) || [err.message || 'Invalid input'];
            return res.status(400).json({
                error: 'Validation failed2',
                details: errors,
            });
        }
    };
}

module.exports = validate;
