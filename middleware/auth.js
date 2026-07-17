const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access Denied: No Bearer token provided in Authorization header.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    req.user = decoded; // { id, email, role, name, ward }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired JWT token.' });
  }
};

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Permission Denied: Your role '${req.user ? req.user.role : 'Unknown'}' is not authorized. Required roles: [${allowedRoles.join(', ')}]`
      });
    }
    next();
  };
};

verifyToken.verifyToken = verifyToken;
verifyToken.checkRole = checkRole;

module.exports = verifyToken;
