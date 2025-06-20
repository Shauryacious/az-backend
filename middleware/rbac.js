
// middleware/rbac.js

// Role Based Access Control(RBAC)
/**
 * Usage: rbac(['seller', 'admin'])
 * Only allows access if req.user.role is in the allowed roles array.
*/
const rbac = (roles = []) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
};

module.exports = rbac;
