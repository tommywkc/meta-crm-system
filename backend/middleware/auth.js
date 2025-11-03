// Authentication and Authorization Middleware
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-local';

/**
 * Authentication Middleware
 * Verifies JWT token from cookies or Authorization header
 * Sets req.user with decoded token payload
 */
function authMiddleware(req, res, next) {
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  
  if (!token) {
    return res.status(401).json({ message: '未認證 (Not authenticated)' });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;  // payload contains: { sub, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: '無效的 token (Invalid token)' });
  }
}

/**
 * Role-based Authorization Middleware Factory
 * Usage: app.get('/admin/path', roleMiddleware('admin'), handler)
 * or:    app.get('/path', roleMiddleware(['admin', 'sales']), handler)
 * 
 * @param {string|string[]} allowedRoles - Single role or array of roles
 * @returns {function} Express middleware
 */
function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '未認證 (Not authenticated)' });
    }
    
    // Convert single role to array for consistent processing
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    // Case-insensitive role comparison
    const userRole = (req.user.role || '').toLowerCase();
    const hasPermission = rolesArray.some(role => role.toLowerCase() === userRole);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        message: '禁止存取 (Forbidden)',
        requiredRoles: rolesArray,
        userRole: req.user.role
      });
    }
    
    next();
  };
}

module.exports = {
  authMiddleware,
  roleMiddleware
};
