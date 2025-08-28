const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const redis = require('../config/redis');
const { validate, schemas } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  validate(schemas.user.register),
  asyncHandler(async (req, res) => {
    const { name, email, password, instruments, skillLevel, bio } = req.body;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await db.query(`
      INSERT INTO users (name, email, password_hash, instruments, skill_level, bio)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, avatar_url, bio, instruments, skill_level, join_date, is_verified, is_instructor
    `, [name, email, passwordHash, instruments, skillLevel, bio]);

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    // Store refresh token in Redis
    await redis.setex(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatar_url,
          bio: user.bio,
          instruments: user.instruments,
          skillLevel: user.skill_level,
          joinDate: user.join_date,
          isVerified: user.is_verified,
          isInstructor: user.is_instructor
        },
        token,
        refreshToken
      }
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  validate(schemas.user.login),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const result = await db.query(`
      SELECT id, name, email, password_hash, avatar_url, bio, instruments, 
             skill_level, join_date, is_verified, is_instructor
      FROM users WHERE email = $1
    `, [email]);

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    // Store refresh token in Redis
    await redis.setex(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, refreshToken);

    // Update last login (optional)
    await db.query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatar_url,
          bio: user.bio,
          instruments: user.instruments,
          skillLevel: user.skill_level,
          joinDate: user.join_date,
          isVerified: user.is_verified,
          isInstructor: user.is_instructor
        },
        token,
        refreshToken
      }
    });
  })
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400, 'MISSING_REFRESH_TOKEN');
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      if (decoded.type !== 'refresh') {
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }

      // Check if refresh token exists in Redis
      const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new AppError('Refresh token has been revoked', 401, 'REFRESH_TOKEN_REVOKED');
      }

      // Get user info
      const result = await db.query(`
        SELECT id, name, email, avatar_url, bio, instruments, skill_level, 
               join_date, is_verified, is_instructor
        FROM users WHERE id = $1
      `, [decoded.userId]);

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const user = result.rows[0];

      // Generate new access token
      const newToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatar_url,
            bio: user.bio,
            instruments: user.instruments,
            skillLevel: user.skill_level,
            joinDate: user.join_date,
            isVerified: user.is_verified,
            isInstructor: user.is_instructor
          }
        }
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }
      throw error;
    }
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate tokens)
 * @access  Private
 */
router.post('/logout',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const { refreshToken } = req.body;

    try {
      // Add access token to blacklist
      const decoded = jwt.decode(token);
      const expirationTime = decoded.exp - Math.floor(Date.now() / 1000);
      
      if (expirationTime > 0) {
        await redis.setex(`blacklist:${token}`, expirationTime, 'true');
      }

      // Remove refresh token from Redis
      await redis.del(`refresh_token:${req.user.id}`);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      // Even if blacklisting fails, we can still respond with success
      // as the client will discard the tokens
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    }
  })
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password',
  authenticateToken,
  validate(schemas.user.changePassword),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_CURRENT_PASSWORD');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    // Invalidate all existing refresh tokens for this user
    await redis.del(`refresh_token:${req.user.id}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Get updated user info from database
    const result = await db.query(`
      SELECT u.id, u.name, u.email, u.avatar_url, u.bio, u.instruments, u.skill_level, 
             u.join_date, u.is_verified, u.is_instructor, u.practice_streak, u.total_practice_time,
             (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as followers_count,
             (SELECT COUNT(*) FROM user_follows WHERE follower_id = u.id) as following_count
      FROM users u
      WHERE u.id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatar_url,
          bio: user.bio,
          instruments: user.instruments,
          skillLevel: user.skill_level,
          joinDate: user.join_date,
          isVerified: user.is_verified,
          isInstructor: user.is_instructor,
          practiceStreak: user.practice_streak,
          totalPracticeTime: user.total_practice_time,
          followersCount: parseInt(user.followers_count),
          followingCount: parseInt(user.following_count)
        }
      }
    });
  })
);

module.exports = router;