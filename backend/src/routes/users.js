const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const db = require('../config/database');
const { validate, schemas } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @route   GET /api/users/profile/:userId
 * @desc    Get user profile by ID
 * @access  Public
 */
router.get('/profile/:userId',
  validate(Joi.object({ userId: schemas.common.uuid }), 'params'),
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const result = await db.query(`
      SELECT u.id, u.name, u.email, u.avatar_url, u.bio, u.instruments, u.skill_level, 
             u.join_date, u.is_verified, u.is_instructor, u.practice_streak, u.total_practice_time,
             (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as followers_count,
             (SELECT COUNT(*) FROM user_follows WHERE follower_id = u.id) as following_count,
             CASE WHEN $2::uuid IS NOT NULL THEN
               (SELECT COUNT(*) > 0 FROM user_follows WHERE follower_id = $2 AND following_id = u.id)
             ELSE false END as is_following
      FROM users u
      WHERE u.id = $1
    `, [userId, req.user?.id]);

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
          email: user.is_verified ? user.email : undefined, // Only show email for verified users
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
          followingCount: parseInt(user.following_count),
          isFollowing: user.is_following
        }
      }
    });
  })
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  authenticateToken,
  validate(schemas.user.updateProfile),
  asyncHandler(async (req, res) => {
    const { name, bio, instruments, skillLevel } = req.body;
    const userId = req.user.id;

    const result = await db.query(`
      UPDATE users 
      SET name = COALESCE($1, name),
          bio = COALESCE($2, bio),
          instruments = COALESCE($3, instruments),
          skill_level = COALESCE($4, skill_level),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, email, avatar_url, bio, instruments, skill_level, 
                join_date, is_verified, is_instructor
    `, [name, bio, instruments, skillLevel, userId]);

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const user = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
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
        }
      }
    });
  })
);

/**
 * @route   POST /api/users/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post('/avatar',
  authenticateToken,
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('No image file provided', 400, 'NO_FILE');
    }

    try {
      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'music-practice/avatars',
            public_id: `avatar_${req.user.id}`,
            transformation: [
              { width: 300, height: 300, crop: 'fill', gravity: 'face' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      // Update user avatar URL in database
      await db.query(
        'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [result.secure_url, req.user.id]
      );

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatarUrl: result.secure_url
        }
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw new AppError('Failed to upload avatar', 500, 'UPLOAD_FAILED');
    }
  })
);

/**
 * @route   POST /api/users/follow/:userId
 * @desc    Follow a user
 * @access  Private
 */
router.post('/follow/:userId',
  authenticateToken,
  validate(Joi.object({ userId: schemas.common.uuid }), 'params'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const followerId = req.user.id;

    if (followerId === userId) {
      throw new AppError('You cannot follow yourself', 400, 'CANNOT_FOLLOW_SELF');
    }

    // Check if user exists
    const userExists = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userExists.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    try {
      await db.query(
        'INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)',
        [followerId, userId]
      );

      res.json({
        success: true,
        message: 'User followed successfully'
      });
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new AppError('You are already following this user', 409, 'ALREADY_FOLLOWING');
      }
      throw error;
    }
  })
);

/**
 * @route   DELETE /api/users/follow/:userId
 * @desc    Unfollow a user
 * @access  Private
 */
router.delete('/follow/:userId',
  authenticateToken,
  validate(Joi.object({ userId: schemas.common.uuid }), 'params'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const followerId = req.user.id;

    const result = await db.query(
      'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, userId]
    );

    if (result.rowCount === 0) {
      throw new AppError('You are not following this user', 404, 'NOT_FOLLOWING');
    }

    res.json({
      success: true,
      message: 'User unfollowed successfully'
    });
  })
);

/**
 * @route   GET /api/users/:userId/followers
 * @desc    Get user followers
 * @access  Public
 */
router.get('/:userId/followers',
  validate(Joi.object({ userId: schemas.common.uuid }), 'params'),
  validate(Joi.object(schemas.common.pagination), 'query'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(`
      SELECT u.id, u.name, u.avatar_url, u.is_verified, u.is_instructor,
             u.instruments, u.skill_level
      FROM users u
      INNER JOIN user_follows uf ON u.id = uf.follower_id
      WHERE uf.following_id = $1
      ORDER BY uf.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM user_follows WHERE following_id = $1',
      [userId]
    );

    res.json({
      success: true,
      data: {
        followers: result.rows.map(user => ({
          id: user.id,
          name: user.name,
          avatarUrl: user.avatar_url,
          isVerified: user.is_verified,
          isInstructor: user.is_instructor,
          instruments: user.instruments,
          skillLevel: user.skill_level
        })),
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });
  })
);

/**
 * @route   GET /api/users/:userId/following
 * @desc    Get users that a user is following
 * @access  Public
 */
router.get('/:userId/following',
  validate(Joi.object({ userId: schemas.common.uuid }), 'params'),
  validate(Joi.object(schemas.common.pagination), 'query'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(`
      SELECT u.id, u.name, u.avatar_url, u.is_verified, u.is_instructor,
             u.instruments, u.skill_level
      FROM users u
      INNER JOIN user_follows uf ON u.id = uf.following_id
      WHERE uf.follower_id = $1
      ORDER BY uf.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM user_follows WHERE follower_id = $1',
      [userId]
    );

    res.json({
      success: true,
      data: {
        following: result.rows.map(user => ({
          id: user.id,
          name: user.name,
          avatarUrl: user.avatar_url,
          isVerified: user.is_verified,
          isInstructor: user.is_instructor,
          instruments: user.instruments,
          skillLevel: user.skill_level
        })),
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });
  })
);

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Public
 */
router.get('/search',
  validate(Joi.object({
    q: Joi.string().min(2).max(100).required(),
    instrument: schemas.common.instrument.optional(),
    skillLevel: schemas.common.skillLevel.optional(),
    isInstructor: Joi.boolean().optional(),
    ...schemas.common.pagination
  }), 'query'),
  asyncHandler(async (req, res) => {
    const { q, instrument, skillLevel, isInstructor, page, limit } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.name, u.avatar_url, u.is_verified, u.is_instructor,
             u.instruments, u.skill_level, u.bio,
             (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as followers_count
      FROM users u
      WHERE (u.name ILIKE $1 OR u.bio ILIKE $1)
    `;
    
    const queryParams = [`%${q}%`];
    let paramIndex = 2;

    if (instrument) {
      query += ` AND $${paramIndex} = ANY(u.instruments)`;
      queryParams.push(instrument);
      paramIndex++;
    }

    if (skillLevel) {
      query += ` AND u.skill_level = $${paramIndex}`;
      queryParams.push(skillLevel);
      paramIndex++;
    }

    if (isInstructor !== undefined) {
      query += ` AND u.is_instructor = $${paramIndex}`;
      queryParams.push(isInstructor);
      paramIndex++;
    }

    query += ` ORDER BY followers_count DESC, u.name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) FROM users u
      WHERE (u.name ILIKE $1 OR u.bio ILIKE $1)
    `;
    const countParams = [`%${q}%`];
    let countParamIndex = 2;

    if (instrument) {
      countQuery += ` AND $${countParamIndex} = ANY(u.instruments)`;
      countParams.push(instrument);
      countParamIndex++;
    }

    if (skillLevel) {
      countQuery += ` AND u.skill_level = $${countParamIndex}`;
      countParams.push(skillLevel);
      countParamIndex++;
    }

    if (isInstructor !== undefined) {
      countQuery += ` AND u.is_instructor = $${countParamIndex}`;
      countParams.push(isInstructor);
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        users: result.rows.map(user => ({
          id: user.id,
          name: user.name,
          avatarUrl: user.avatar_url,
          isVerified: user.is_verified,
          isInstructor: user.is_instructor,
          instruments: user.instruments,
          skillLevel: user.skill_level,
          bio: user.bio,
          followersCount: parseInt(user.followers_count)
        })),
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });
  })
);

module.exports = router;