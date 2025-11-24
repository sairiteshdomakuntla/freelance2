const mongoose = require('mongoose');

/**
 * Middleware to verify user authentication from Better Auth session
 */
const verifyAuth = async (req, res, next) => {
  try {
    const sessionToken = req.cookies['better-auth.session_token'];
    
    if (!sessionToken) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No session token found' 
      });
    }
    
    // Check session in database
    const db = mongoose.connection.db;
    const sessionsCollection = db.collection('session');
    
    const session = await sessionsCollection.findOne({ 
      token: sessionToken,
      expiresAt: { $gt: new Date() }
    });
    
    if (!session) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired session' 
      });
    }
    
    // Get user from database
    const usersCollection = db.collection('user');
    const user = await usersCollection.findOne({ _id: session.userId });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User not found' 
      });
    }
    
    // Check if user is active
    if (user.isActive === false) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Account is disabled' 
      });
    }
    
    // Attach user to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'Customer',
      phoneNumber: user.phoneNumber,
      image: user.image,
      isActive: user.isActive !== false
    };
    
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Authentication verification failed' 
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
    }
    
    next();
  };
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = requireRole('Admin');

/**
 * Middleware to check if user is vendor or admin
 */
const requireVendorOrAdmin = requireRole('Vendor', 'Admin');

module.exports = {
  verifyAuth,
  requireRole,
  requireAdmin,
  requireVendorOrAdmin
};
