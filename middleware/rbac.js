// middleware/rbac.js

// /**
//  * Role-Based Access Control (RBAC) middleware.
//  * Usage: rbac(['seller', 'admin'])
//  * Allows access only if req.user.role is in the allowed roles array.
//  *
//  * @param {string[]} allowedRoles - Array of allowed user roles
//  * @returns {Function} Express middleware
//  */

function rbac(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
        }
        next();
    };
}

module.exports = rbac;
