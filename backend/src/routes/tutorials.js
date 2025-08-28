const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { validate, schemas } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth, requireInstructor } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/tutorials
 * @desc    Get all tutorials with filters
 * @access  Public
 */
router.get('/',
  validate(Joi.object({
    instrument: schemas.common.instrument.optional(),
    skillLevel: schemas.common.skillLevel.optional(),
    instructorId: schemas.common.uuid.optional(),
    featured: Joi.boolean().optional(),
    search: Joi.string().max(100).optional(),
    ...schemas.common.pagination
  }), 'query'),
  asyncHandler(async (req, res) => {
    const { instrument, skillLevel, instructorId, featured, search, page, limit, sort, order } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.id, t.title, t.description, t.video_url, t.thumbnail_url, t.instrument,
             t.skill_level, t.duration_minutes, t.is_featured, t.views_count, t.created_at,
             u.id as instructor_id, u.name as instructor_name, u.avatar_url as instructor_avatar,
             u.is_verified as instructor_verified
      FROM tutorials t
      LEFT JOIN users u ON t.instructor_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (instrument) {
      query += ` AND t.instrument = $${paramIndex}`;
      queryParams.push(instrument);
      paramIndex++;
    }

    if (skillLevel) {
      query += ` AND t.skill_level = $${paramIndex}`;
      queryParams.push(skillLevel);
      paramIndex++;
    }

    if (instructorId) {
      query += ` AND t.instructor_id = $${paramIndex}`;
      queryParams.push(instructorId);
      paramIndex++;
    }

    if (featured !== undefined) {
      query += ` AND t.is_featured = $${paramIndex}`;
      queryParams.push(featured);
      paramIndex++;
    }

    if (search) {
      query += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Add ordering
    const validSortFields = {
      'created_at': 't.created_at',
      'views_count': 't.views_count',
      'title': 't.title',
      'duration_minutes': 't.duration_minutes'
    };

    const sortField = validSortFields[sort] || 't.created_at';
    query += ` ORDER BY t.is_featured DESC, ${sortField} ${order.toUpperCase()} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM tutorials t WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (instrument) {
      countQuery += ` AND t.instrument = $${countParamIndex}`;
      countParams.push(instrument);
      countParamIndex++;
    }

    if (skillLevel) {
      countQuery += ` AND t.skill_level = $${countParamIndex}`;
      countParams.push(skillLevel);
      countParamIndex++;
    }

    if (instructorId) {
      countQuery += ` AND t.instructor_id = $${countParamIndex}`;
      countParams.push(instructorId);
      countParamIndex++;
    }

    if (featured !== undefined) {
      countQuery += ` AND t.is_featured = $${countParamIndex}`;
      countParams.push(featured);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (t.title ILIKE $${countParamIndex} OR t.description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        tutorials: result.rows.map(tutorial => ({
          id: tutorial.id,
          title: tutorial.title,
          description: tutorial.description,
          videoUrl: tutorial.video_url,
          thumbnailUrl: tutorial.thumbnail_url,
          instrument: tutorial.instrument,
          skillLevel: tutorial.skill_level,
          durationMinutes: tutorial.duration_minutes,
          isFeatured: tutorial.is_featured,
          viewsCount: tutorial.views_count,
          createdAt: tutorial.created_at,
          instructor: {
            id: tutorial.instructor_id,
            name: tutorial.instructor_name,
            avatarUrl: tutorial.instructor_avatar,
            isVerified: tutorial.instructor_verified
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
 * @route   GET /api/tutorials/:tutorialId
 * @desc    Get tutorial by ID
 * @access  Public
 */
router.get('/:tutorialId',
  validate(Joi.object({ tutorialId: schemas.common.uuid }), 'params'),
  asyncHandler(async (req, res) => {
    const { tutorialId } = req.params;

    const result = await db.query(`
      SELECT t.*, 
             u.id as instructor_id, u.name as instructor_name, u.avatar_url as instructor_avatar,
             u.is_verified as instructor_verified, u.bio as instructor_bio
      FROM tutorials t
      LEFT JOIN users u ON t.instructor_id = u.id
      WHERE t.id = $1
    `, [tutorialId]);

    if (result.rows.length === 0) {
      throw new AppError('Tutorial not found', 404, 'TUTORIAL_NOT_FOUND');
    }

    const tutorial = result.rows[0];

    // Increment view count
    await db.query('UPDATE tutorials SET views_count = views_count + 1 WHERE id = $1', [tutorialId]);

    res.json({
      success: true,
      data: {
        tutorial: {
          id: tutorial.id,
          title: tutorial.title,
          description: tutorial.description,
          videoUrl: tutorial.video_url,
          thumbnailUrl: tutorial.thumbnail_url,
          instrument: tutorial.instrument,
          skillLevel: tutorial.skill_level,
          durationMinutes: tutorial.duration_minutes,
          isFeatured: tutorial.is_featured,
          viewsCount: tutorial.views_count + 1, // Return updated count
          createdAt: tutorial.created_at,
          updatedAt: tutorial.updated_at,
          instructor: {
            id: tutorial.instructor_id,
            name: tutorial.instructor_name,
            avatarUrl: tutorial.instructor_avatar,
            isVerified: tutorial.instructor_verified,
            bio: tutorial.instructor_bio
          }
        }
      }
    });
  })
);

/**
 * @route   POST /api/tutorials
 * @desc    Create new tutorial
 * @access  Private (Instructor only)
 */
router.post('/',
  authenticateToken,
  requireInstructor,
  validate(schemas.tutorial.create),
  asyncHandler(async (req, res) => {
    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      instrument,
      skillLevel,
      durationMinutes
    } = req.body;

    const result = await db.query(`
      INSERT INTO tutorials (
        title, description, video_url, thumbnail_url, instructor_id, 
        instrument, skill_level, duration_minutes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [title, description, videoUrl, thumbnailUrl, req.user.id, instrument, skillLevel, durationMinutes]);

    const tutorial = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Tutorial created successfully',
      data: {
        tutorial: {
          id: tutorial.id,
          title: tutorial.title,
          description: tutorial.description,
          videoUrl: tutorial.video_url,
          thumbnailUrl: tutorial.thumbnail_url,
          instrument: tutorial.instrument,
          skillLevel: tutorial.skill_level,
          durationMinutes: tutorial.duration_minutes,
          isFeatured: tutorial.is_featured,
          viewsCount: tutorial.views_count,
          createdAt: tutorial.created_at
        }
      }
    });
  })
);

/**
 * @route   PUT /api/tutorials/:tutorialId
 * @desc    Update tutorial
 * @access  Private (Instructor/Creator only)
 */
router.put('/:tutorialId',
  authenticateToken,
  requireInstructor,
  validate(Joi.object({ tutorialId: schemas.common.uuid }), 'params'),
  validate(schemas.tutorial.update),
  asyncHandler(async (req, res) => {
    const { tutorialId } = req.params;

    // Check if tutorial exists and user is the creator
    const tutorialResult = await db.query(
      'SELECT instructor_id FROM tutorials WHERE id = $1',
      [tutorialId]
    );

    if (tutorialResult.rows.length === 0) {
      throw new AppError('Tutorial not found', 404, 'TUTORIAL_NOT_FOUND');
    }

    const tutorial = tutorialResult.rows[0];

    if (tutorial.instructor_id !== req.user.id) {
      throw new AppError('You can only update tutorials you created', 403, 'ACCESS_DENIED');
    }

    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      instrument,
      skillLevel,
      durationMinutes,
      isFeatured
    } = req.body;

    const result = await db.query(`
      UPDATE tutorials 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          video_url = COALESCE($3, video_url),
          thumbnail_url = COALESCE($4, thumbnail_url),
          instrument = COALESCE($5, instrument),
          skill_level = COALESCE($6, skill_level),
          duration_minutes = COALESCE($7, duration_minutes),
          is_featured = COALESCE($8, is_featured),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [title, description, videoUrl, thumbnailUrl, instrument, skillLevel, durationMinutes, isFeatured, tutorialId]);

    const updatedTutorial = result.rows[0];

    res.json({
      success: true,
      message: 'Tutorial updated successfully',
      data: {
        tutorial: {
          id: updatedTutorial.id,
          title: updatedTutorial.title,
          description: updatedTutorial.description,
          videoUrl: updatedTutorial.video_url,
          thumbnailUrl: updatedTutorial.thumbnail_url,
          instrument: updatedTutorial.instrument,
          skillLevel: updatedTutorial.skill_level,
          durationMinutes: updatedTutorial.duration_minutes,
          isFeatured: updatedTutorial.is_featured,
          viewsCount: updatedTutorial.views_count,
          createdAt: updatedTutorial.created_at,
          updatedAt: updatedTutorial.updated_at
        }
      }
    });
  })
);

/**
 * @route   DELETE /api/tutorials/:tutorialId
 * @desc    Delete tutorial
 * @access  Private (Instructor/Creator only)
 */
router.delete('/:tutorialId',
  authenticateToken,
  requireInstructor,
  validate(Joi.object({ tutorialId: schemas.common.uuid }), 'params'),
  asyncHandler(async (req, res) => {
    const { tutorialId } = req.params;

    const result = await db.query(
      'DELETE FROM tutorials WHERE id = $1 AND instructor_id = $2 RETURNING id',
      [tutorialId, req.user.id]
    );

    if (result.rowCount === 0) {
      throw new AppError('Tutorial not found or you do not have permission to delete it', 404, 'TUTORIAL_NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Tutorial deleted successfully'
    });
  })
);

/**
 * @route   GET /api/tutorials/featured
 * @desc    Get featured tutorials
 * @access  Public
 */
router.get('/featured',
  validate(Joi.object({
    limit: Joi.number().integer().min(1).max(20).default(10)
  }), 'query'),
  asyncHandler(async (req, res) => {
    const { limit } = req.query;

    const result = await db.query(`
      SELECT t.id, t.title, t.description, t.video_url, t.thumbnail_url, t.instrument,
             t.skill_level, t.duration_minutes, t.views_count, t.created_at,
             u.id as instructor_id, u.name as instructor_name, u.avatar_url as instructor_avatar,
             u.is_verified as instructor_verified
      FROM tutorials t
      LEFT JOIN users u ON t.instructor_id = u.id
      WHERE t.is_featured = true
      ORDER BY t.views_count DESC, t.created_at DESC
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      data: {
        tutorials: result.rows.map(tutorial => ({
          id: tutorial.id,
          title: tutorial.title,
          description: tutorial.description,
          videoUrl: tutorial.video_url,
          thumbnailUrl: tutorial.thumbnail_url,
          instrument: tutorial.instrument,
          skillLevel: tutorial.skill_level,
          durationMinutes: tutorial.duration_minutes,
          viewsCount: tutorial.views_count,
          createdAt: tutorial.created_at,
          instructor: {
            id: tutorial.instructor_id,
            name: tutorial.instructor_name,
            avatarUrl: tutorial.instructor_avatar,
            isVerified: tutorial.instructor_verified
          }
        }))
      }
    });
  })
);

/**
 * @route   GET /api/tutorials/instructor/:instructorId
 * @desc    Get tutorials by instructor
 * @access  Public
 */
router.get('/instructor/:instructorId',
  validate(Joi.object({ instructorId: schemas.common.uuid }), 'params'),
  validate(Joi.object(schemas.common.pagination), 'query'),
  asyncHandler(async (req, res) => {
    const { instructorId } = req.params;
    const { page, limit } = req.query;
    const offset = (page - 1) * limit;

    // Check if instructor exists
    const instructorExists = await db.query(
      'SELECT id, name, avatar_url, is_verified FROM users WHERE id = $1 AND is_instructor = true',
      [instructorId]
    );

    if (instructorExists.rows.length === 0) {
      throw new AppError('Instructor not found', 404, 'INSTRUCTOR_NOT_FOUND');
    }

    const instructor = instructorExists.rows[0];

    const result = await db.query(`
      SELECT t.id, t.title, t.description, t.video_url, t.thumbnail_url, t.instrument,
             t.skill_level, t.duration_minutes, t.is_featured, t.views_count, t.created_at
      FROM tutorials t
      WHERE t.instructor_id = $1
      ORDER BY t.is_featured DESC, t.created_at DESC
      LIMIT $2 OFFSET $3
    `, [instructorId, limit, offset]);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM tutorials WHERE instructor_id = $1',
      [instructorId]
    );

    res.json({
      success: true,
      data: {
        instructor: {
          id: instructor.id,
          name: instructor.name,
          avatarUrl: instructor.avatar_url,
          isVerified: instructor.is_verified
        },
        tutorials: result.rows.map(tutorial => ({
          id: tutorial.id,
          title: tutorial.title,
          description: tutorial.description,
          videoUrl: tutorial.video_url,
          thumbnailUrl: tutorial.thumbnail_url,
          instrument: tutorial.instrument,
          skillLevel: tutorial.skill_level,
          durationMinutes: tutorial.duration_minutes,
          isFeatured: tutorial.is_featured,
          viewsCount: tutorial.views_count,
          createdAt: tutorial.created_at
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