const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verifies JWT sent via httpOnly cookie or Authorization header
exports.protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, message: 'User no longer exists or is inactive.' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// Optional auth - attaches req.user if a valid token is present, but never
// blocks the request. Used on public GET routes that show extra data to admins.
exports.optionalAuth = async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.token) token = req.cookies.token;
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
  } catch (error) {
    // invalid/expired token - proceed as guest
  }
  next();
};

// Role-based access control middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user ? req.user.role : 'guest'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};
