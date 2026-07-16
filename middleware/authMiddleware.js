const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes: validates the user's JWT security token
const protect = async (req, res, next) => {
  // Extract token from HTTP Header format "Bearer <token>"
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorised, no token' });

  try {
    // Decodes the token using our secret key to verify validity
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch user details from MongoDB using the token's decoded ID (omits password)
    req.user = await User.findById(decoded.id).select('-passwordHash');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    // Check if the user is suspended before granting access
    if (req.user.isSuspended) return res.status(403).json({ message: 'Account suspended' });
    
    next(); // Pass control to the next function handler
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware restricting routes exclusively to administrator roles
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
  next(); // Pass control to admin endpoints
};

module.exports = { protect, adminOnly };
