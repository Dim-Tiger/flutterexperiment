const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const db = require('../config/database');
const { validate, schemas } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: parseInt(process.env.MAX_FILES_PER_REQUEST) || 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, audio, and video files are allowed'), false);
    }
  }
});

/**
 * @route   GET /api/community/posts
 * @desc    Get community posts with filters
 * @access  Public
 */
router.get('/posts',
  validate(Joi.object({
    category: Joi.string().valid('Tips', 'Questions', 'Technique', 'Inspiration', 'Gear').optional(),
    authorId: schemas.common.uuid.optional(),
    search: Joi.string().max(100).optional(),
    ...schemas.common.pagination
  }), 'query'),
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { category, authorId, search, page, limit, sort, order } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT cp.id, cp.title, cp.content, cp.category, cp.media_urls, cp.likes_count, 
             cp.comments_count, cp.created_at, cp.updated_at,
             u.id as author_id, u.name as author_name, u.avatar_url as author_avatar,
             u.is_verified as author_verified, u.is_instructor as author_instructor,
             CASE WHEN $1::uuid IS NOT NULL THEN
               (SELECT COUNT(*) > 0 FROM post_likes WHERE post_id = cp.id AND user_id = $1)
             ELSE false END as is_liked
      FROM community_posts cp
      LEFT JOIN users u ON cp.author_id = u.id
      WHERE 1=1
    `;

    const queryParams = [req.user?.id];
    let paramIndex = 2;

    if (category) {
      query += ` AND cp.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    if (authorId) {
      query += ` AND cp.author_id = $${paramIndex}`;
      queryParams.push(authorId);
      paramIndex++;
    }

    if (search) {
      query += ` AND (cp.title ILIKE $${paramIndex} OR cp.content ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Add ordering
    const validSortFields = {
      'created_at': 'cp.created_at',
      'updated_at': 'cp.updated_at',
      'likes_count': 'cp.likes_count',
      'comments_count': 'cp.comments_count',
      'title': 'cp.title'
    };

    const sortField = validSortFields[sort] || 'cp.created_at';
    query += ` ORDER BY ${sortField} ${order.toUpperCase()} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM community_posts cp WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (category) {
      countQuery += ` AND cp.category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }

    if (authorId) {
      countQuery += ` AND cp.author_id = $${countParamIndex}`;
      countParams.push(authorId);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (cp.title ILIKE $${countParamIndex} OR cp.content ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        posts: result.rows.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          category: post.category,
          mediaUrls: post.media_urls,
          likesCount: post.likes_count,
          commentsCount: post.comments_count,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          isLiked: post.is_liked,
          author: {
            id: post.author_id,
            name: post.author_name,
            avatarUrl: post.author_avatar,
            isVerified: post.author_verified,
            isInstructor: post.author_instructor
          }
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
 * @route   POST /api/community/posts
 * @desc    Create a new community post
 * @access  Private
 */
router.post('/posts',
  authenticateToken,
  upload.array('media', 5),
  validate(schemas.community.createPost),
  asyncHandler(async (req, res) => {
    const { title, content, category } = req.body;
    let mediaUrls = [];

    // Upload media files to Cloudinary if provided
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const resourceType = file.mimetype.startsWith('video/') ? 'video' : 
                             file.mimetype.startsWith('audio/') ? 'video' : 'image';
          
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'music-practice/community',
              resource_type: resourceType,
              quality: 'auto'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          uploadStream.end(file.buffer);
        });
      });

      try {
        mediaUrls = await Promise.all(uploadPromises);
      } catch (error) {
        console.error('Media upload error:', error);
        throw new AppError('Failed to upload media files', 500, 'UPLOAD_FAILED');
      }
    }

    const result = await db.query(`
      INSERT INTO community_posts (title, content, category, author_id, media_urls)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [title, content, category, req.user.id, mediaUrls]);

    const post = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post: {
          id: post.id,
          title: post.title,
          content: post.content,
          category: post.category,
          mediaUrls: post.media_urls,
          likesCount: post.likes_count,
          commentsCount: post.comments_count,
          createdAt: post.created_at,
          author: {
            id: req.user.id,
            name: req.user.name,
            avatarUrl: req.user.avatar_url,
            isVerified: req.user.is_verified,
            isInstructor: req.user.is_instructor
          }
        }
      }
    });
  })
);

/**
 * @route   GET /api/community/posts/:postId
 * @desc    Get specific community post
 * @access  Public
 */
router.get('/posts/:postId',
  validate(Joi.object({ postId: schemas.common.uuid }), 'params'),
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const result = await db.query(`
      SELECT cp.*, 
             u.id as author_id, u.name as author_name, u.avatar_url as author_avatar,
             u.is_verified as author_verified, u.is_instructor as author_instructor,
             CASE WHEN $2::uuid IS NOT NULL THEN
               (SELECT COUNT(*) > 0 FROM post_likes WHERE post_id = cp.id AND user_id = $2)
             ELSE false END as is_liked
      FROM community_posts cp
      LEFT JOIN users u ON cp.author_id = u.id
      WHERE cp.id = $1
    `, [postId, req.user?.id]);

    if (result.rows.length === 0) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
    }

    const post = result.rows[0];

    res.json({
      success: true,
      data: {
        post: {
          id: post.id,
          title: post.title,
          content: post.content,
          category: post.category,
          mediaUrls: post.media_urls,
          likesCount: post.likes_count,
          commentsCount: post.comments_count,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          isLiked: post.is_liked,
          author: {
            id: post.author_id,
            name: post.author_name,
            avatarUrl: post.author_avatar,
            isVerified: post.author_verified,
            isInstructor: post.author_instructor
          }
        }
      }
    });
  })
);

/**
 * @route   PUT /api/community/posts/:postId
 * @desc    Update community post
 * @access  Private (Author only)
 */
router.put('/posts/:postId',
  authenticateToken,
  validate(Joi.object({ postId: schemas.common.uuid }), 'params'),
  validate(schemas.community.updatePost),
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { title, content, category, mediaUrls } = req.body;

    // Check if post exists and user is the author
    const existingPost = await db.query(
      'SELECT author_id FROM community_posts WHERE id = $1',
      [postId]
    );

    if (existingPost.rows.length === 0) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
    }

    if (existingPost.rows[0].author_id !== req.user.id) {
      throw new AppError('You can only edit your own posts', 403, 'ACCESS_DENIED');
    }

    const result = await db.query(`
      UPDATE community_posts 
      SET title = COALESCE($1, title),
          content = COALESCE($2, content),
          category = COALESCE($3, category),
          media_urls = COALESCE($4, media_urls),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [title, content, category, mediaUrls, postId]);

    const post = result.rows[0];

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: {
        post: {
          id: post.id,
          title: post.title,
          content: post.content,
          category: post.category,
          mediaUrls: post.media_urls,
          likesCount: post.likes_count,
          commentsCount: post.comments_count,
          createdAt: post.created_at,
          updatedAt: post.updated_at
        }
      }
    });
  })
);

/**
 * @route   DELETE /api/community/posts/:postId
 * @desc    Delete community post
 * @access  Private (Author only)
 */
router.delete('/posts/:postId',
  authenticateToken,
  validate(Joi.object({ postId: schemas.common.uuid }), 'params'),
  asyncHandler(async (req, res) => {
    const { postId } = req.params;

    // Check if post exists and user is the author
    const result = await db.query(
      'DELETE FROM community_posts WHERE id = $1 AND author_id = $2 RETURNING id',
      [postId, req.user.id]
    );

    if (result.rowCount === 0) {
      throw new AppError('Post not found or you do not have permission to delete it', 404, 'POST_NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  })
);

/**
 * @route   POST /api/community/posts/:postId/like
 * @desc    Like/unlike a post
 * @access  Private
 */
router.post('/posts/:postId/like',
  authenticateToken,
  validate(Joi.object({ postId: schemas.common.uuid }), 'params'),
  asyncHandler(async (req, res) => {
    const { postId } = req.params;

    // Check if post exists
    const postExists = await db.query('SELECT id FROM community_posts WHERE id = $1', [postId]);
    if (postExists.rows.length === 0) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
    }

    // Check if user already liked the post
    const existingLike = await db.query(
      'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, req.user.id]
    );

    if (existingLike.rows.length > 0) {
      // Unlike the post
      await db.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, req.user.id]);
      await db.query('UPDATE community_posts SET likes_count = likes_count - 1 WHERE id = $1', [postId]);
      
      res.json({
        success: true,
        message: 'Post unliked successfully',
        data: { liked: false }
      });
    } else {
      // Like the post
      await db.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [postId, req.user.id]);
      await db.query('UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = $1', [postId]);
      
      res.json({
        success: true,
        message: 'Post liked successfully',
        data: { liked: true }
      });
    }
  })
);

/**
 * @route   GET /api/community/posts/:postId/comments
 * @desc    Get comments for a post
 * @access  Public
 */
router.get('/posts/:postId/comments',
  validate(Joi.object({ postId: schemas.common.uuid }), 'params'),
  validate(Joi.object(schemas.common.pagination), 'query'),
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { page, limit } = req.query;
    const offset = (page - 1) * limit;

    // Check if post exists
    const postExists = await db.query('SELECT id FROM community_posts WHERE id = $1', [postId]);
    if (postExists.rows.length === 0) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
    }

    const result = await db.query(`
      SELECT pc.id, pc.content, pc.created_at, pc.parent_comment_id,
             u.id as author_id, u.name as author_name, u.avatar_url as author_avatar,
             u.is_verified as author_verified, u.is_instructor as author_instructor
      FROM post_comments pc
      LEFT JOIN users u ON pc.author_id = u.id
      WHERE pc.post_id = $1
      ORDER BY pc.created_at ASC
      LIMIT $2 OFFSET $3
    `, [postId, limit, offset]);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM post_comments WHERE post_id = $1',
      [postId]
    );

    res.json({
      success: true,
      data: {
        comments: result.rows.map(comment => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.created_at,
          parentCommentId: comment.parent_comment_id,
          author: {
            id: comment.author_id,
            name: comment.author_name,
            avatarUrl: comment.author_avatar,
            isVerified: comment.author_verified,
            isInstructor: comment.author_instructor
          }
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
 * @route   POST /api/community/posts/:postId/comments
 * @desc    Add comment to a post
 * @access  Private
 */
router.post('/posts/:postId/comments',
  authenticateToken,
  validate(Joi.object({ postId: schemas.common.uuid }), 'params'),
  validate(schemas.community.createComment),
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;

    // Check if post exists
    const postExists = await db.query('SELECT id FROM community_posts WHERE id = $1', [postId]);
    if (postExists.rows.length === 0) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
    }

    // If replying to a comment, check if parent comment exists
    if (parentCommentId) {
      const parentExists = await db.query(
        'SELECT id FROM post_comments WHERE id = $1 AND post_id = $2',
        [parentCommentId, postId]
      );
      if (parentExists.rows.length === 0) {
        throw new AppError('Parent comment not found', 404, 'PARENT_COMMENT_NOT_FOUND');
      }
    }

    const result = await db.query(`
      INSERT INTO post_comments (post_id, author_id, content, parent_comment_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [postId, req.user.id, content, parentCommentId]);

    // Update post comments count
    await db.query(
      'UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = $1',
      [postId]
    );

    const comment = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.created_at,
          parentCommentId: comment.parent_comment_id,
          author: {
            id: req.user.id,
            name: req.user.name,
            avatarUrl: req.user.avatar_url,
            isVerified: req.user.is_verified,
            isInstructor: req.user.is_instructor
          }
        }
      }
    });
  })
);

/**
 * @route   DELETE /api/community/comments/:commentId
 * @desc    Delete a comment
 * @access  Private (Author only)
 */
router.delete('/comments/:commentId',
  authenticateToken,
  validate(Joi.object({ commentId: schemas.common.uuid }), 'params'),
  asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const result = await db.query(
      'DELETE FROM post_comments WHERE id = $1 AND author_id = $2 RETURNING post_id',
      [commentId, req.user.id]
    );

    if (result.rowCount === 0) {
      throw new AppError('Comment not found or you do not have permission to delete it', 404, 'COMMENT_NOT_FOUND');
    }

    // Update post comments count
    const postId = result.rows[0].post_id;
    await db.query(
      'UPDATE community_posts SET comments_count = comments_count - 1 WHERE id = $1',
      [postId]
    );

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  })
);

module.exports = router;