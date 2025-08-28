const jwt = require('jsonwebtoken');
const db = require('../config/database');
const redis = require('../config/redis');

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      });
    }

    // Check if token is blacklisted (for logout functionality)
    const isBlacklisted = await redis.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        error: 'Token invalid',
        message: 'Authentication token has been revoked'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist
    const result = await db.query(
      'SELECT id, name, email, avatar_url, bio, instruments, skill_level, is_verified, is_instructor FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found',
        message: 'The user associated with this token no longer exists'
      });
    }

    // Add user info to request
    req.user = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      email: result.rows[0].email,
      avatar_url: result.rows[0].avatar_url,
      bio: result.rows[0].bio,
      instruments: result.rows[0].instruments,
      skill_level: result.rows[0].skill_level,
      is_verified: result.rows[0].is_verified,
      is_instructor: result.rows[0].is_instructor
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Authentication token has expired. Please login again.'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication token is invalid'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    // Check if token is blacklisted
    const isBlacklisted = await redis.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      req.user = null;
      return next();
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const result = await db.query(
      'SELECT id, name, email, avatar_url, bio, instruments, skill_level, is_verified, is_instructor FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length > 0) {
      req.user = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        avatar_url: result.rows[0].avatar_url,
        bio: result.rows[0].bio,
        instruments: result.rows[0].instruments,
        skill_level: result.rows[0].skill_level,
        is_verified: result.rows[0].is_verified,
        is_instructor: result.rows[0].is_instructor
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // If optional auth fails, just continue without user
    req.user = null;
    next();
  }
};

/**
 * Instructor authorization middleware
 * Requires user to be authenticated and be an instructor
 */
const requireInstructor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }

  if (!req.user.is_instructor) {
    return res.status(403).json({
      error: 'Instructor access required',
      message: 'This resource is only available to verified instructors'
    });
  }

  next();
};

/**
 * Admin authorization middleware
 * Requires user to be authenticated and be an admin (can be extended)
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }

  // For now, we'll consider verified instructors as admins
  // This can be extended with a proper admin role system
  if (!req.user.is_instructor || !req.user.is_verified) {
    return res.status(403).json({
      error: 'Admin access required',
      message: 'This resource requires administrative privileges'
    });
  }

  next();
};

/**
 * Resource ownership middleware factory
 * Checks if the current user owns the resource
 */
const requireOwnership = (resourceField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    // The resource data should be attached to req by previous middleware
    if (req.resource && req.resource[resourceField] !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireInstructor,
  requireAdmin,
  requireOwnership
};