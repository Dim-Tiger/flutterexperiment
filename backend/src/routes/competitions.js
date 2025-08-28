const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { validate, schemas } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth, requireInstructor } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/competitions
 * @desc    Get all competitions with filters
 * @access  Public
 */
router.get('/',
  validate(Joi.object({
    status: Joi.string().valid('upcoming', 'active', 'completed').optional(),
    genre: Joi.string().max(100).optional(),
    skillLevel: schemas.common.skillLevel.optional(),
    instrument: schemas.common.instrument.optional(),
    ...schemas.common.pagination
  }), 'query'),
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { status, genre, skillLevel, instrument, page, limit, sort, order } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.id, c.title, c.description, c.genre, c.skill_level, c.instrument,
             c.start_date, c.end_date, c.prize_description, c.max_participants,
             c.entry_fee, c.status, c.created_at,
             u.name as creator_name, u.avatar_url as creator_avatar,
             (SELECT COUNT(*) FROM competition_entries WHERE competition_id = c.id) as participants_count,
             CASE WHEN $${1}::uuid IS NOT NULL THEN
               (SELECT COUNT(*) > 0 FROM competition_entries WHERE competition_id = c.id AND user_id = $${1})
             ELSE false END as is_participating
      FROM competitions c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE 1=1
    `;

    const queryParams = [req.user?.id];
    let paramIndex = 2;

    if (status) {
      query += ` AND c.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (genre) {
      query += ` AND c.genre ILIKE $${paramIndex}`;
      queryParams.push(`%${genre}%`);
      paramIndex++;
    }

    if (skillLevel) {
      query += ` AND c.skill_level = $${paramIndex}`;
      queryParams.push(skillLevel);
      paramIndex++;
    }

    if (instrument) {
      query += ` AND c.instrument = $${paramIndex}`;
      queryParams.push(instrument);
      paramIndex++;
    }

    // Add ordering
    const validSortFields = {
      'created_at': 'c.created_at',
      'start_date': 'c.start_date',
      'end_date': 'c.end_date',
      'title': 'c.title',
      'participants_count': 'participants_count'
    };

    const sortField = validSortFields[sort] || 'c.created_at';
    query += ` ORDER BY ${sortField} ${order.toUpperCase()} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM competitions c WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (status) {
      countQuery += ` AND c.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (genre) {
      countQuery += ` AND c.genre ILIKE $${countParamIndex}`;
      countParams.push(`%${genre}%`);
      countParamIndex++;
    }

    if (skillLevel) {
      countQuery += ` AND c.skill_level = $${countParamIndex}`;
      countParams.push(skillLevel);
      countParamIndex++;
    }

    if (instrument) {
      countQuery += ` AND c.instrument = $${countParamIndex}`;
      countParams.push(instrument);
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        competitions: result.rows.map(comp => ({
          id: comp.id,
          title: comp.title,
          description: comp.description,
          genre: comp.genre,
          skillLevel: comp.skill_level,
          instrument: comp.instrument,
          startDate: comp.start_date,
          endDate: comp.end_date,
          prizeDescription: comp.prize_description,
          maxParticipants: comp.max_participants,
          entryFee: parseFloat(comp.entry_fee),
          status: comp.status,
          createdAt: comp.created_at,
          creator: {
            name: comp.creator_name,
            avatarUrl: comp.creator_avatar
          },
          participantsCount: parseInt(comp.participants_count),
          isParticipating: comp.is_participating
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
 * @route   GET /api/competitions/:competitionId
 * @desc    Get competition by ID
 * @access  Public
 */
router.get('/:competitionId',
  validate(Joi.object({ competitionId: schemas.common.uuid }), 'params'),
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { competitionId } = req.params;

    const result = await db.query(`
      SELECT c.*, u.name as creator_name, u.avatar_url as creator_avatar,
             (SELECT COUNT(*) FROM competition_entries WHERE competition_id = c.id) as participants_count,
             CASE WHEN $2::uuid IS NOT NULL THEN
               (SELECT COUNT(*) > 0 FROM competition_entries WHERE competition_id = c.id AND user_id = $2)
             ELSE false END as is_participating
      FROM competitions c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1
    `, [competitionId, req.user?.id]);

    if (result.rows.length === 0) {
      throw new AppError('Competition not found', 404, 'COMPETITION_NOT_FOUND');
    }

    const competition = result.rows[0];

    res.json({
      success: true,
      data: {
        competition: {
          id: competition.id,
          title: competition.title,
          description: competition.description,
          genre: competition.genre,
          skillLevel: competition.skill_level,
          instrument: competition.instrument,
          startDate: competition.start_date,
          endDate: competition.end_date,
          prizeDescription: competition.prize_description,
          maxParticipants: competition.max_participants,
          entryFee: parseFloat(competition.entry_fee),
          status: competition.status,
          createdAt: competition.created_at,
          creator: {
            name: competition.creator_name,
            avatarUrl: competition.creator_avatar
          },
          participantsCount: parseInt(competition.participants_count),
          isParticipating: competition.is_participating
        }
      }
    });
  })
);

/**
 * @route   POST /api/competitions
 * @desc    Create new competition
 * @access  Private (Instructor only)
 */
router.post('/',
  authenticateToken,
  requireInstructor,
  validate(schemas.competition.create),
  asyncHandler(async (req, res) => {
    const {
      title,
      description,
      genre,
      skillLevel,
      instrument,
      startDate,
      endDate,
      prizeDescription,
      maxParticipants,
      entryFee
    } = req.body;

    const result = await db.query(`
      INSERT INTO competitions (
        title, description, genre, skill_level, instrument, start_date, end_date,
        prize_description, max_participants, entry_fee, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      title, description, genre, skillLevel, instrument, startDate, endDate,
      prizeDescription, maxParticipants, entryFee, req.user.id
    ]);

    const competition = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Competition created successfully',
      data: {
        competition: {
          id: competition.id,
          title: competition.title,
          description: competition.description,
          genre: competition.genre,
          skillLevel: competition.skill_level,
          instrument: competition.instrument,
          startDate: competition.start_date,
          endDate: competition.end_date,
          prizeDescription: competition.prize_description,
          maxParticipants: competition.max_participants,
          entryFee: parseFloat(competition.entry_fee),
          status: competition.status,
          createdAt: competition.created_at
        }
      }
    });
  })
);

/**
 * @route   PUT /api/competitions/:competitionId
 * @desc    Update competition
 * @access  Private (Creator only)
 */
router.put('/:competitionId',
  authenticateToken,
  validate(Joi.object({ competitionId: schemas.common.uuid }), 'params'),
  validate(schemas.competition.update),
  asyncHandler(async (req, res) => {
    const { competitionId } = req.params;

    // Check if competition exists and user is the creator
    const competitionResult = await db.query(
      'SELECT created_by, status FROM competitions WHERE id = $1',
      [competitionId]
    );

    if (competitionResult.rows.length === 0) {
      throw new AppError('Competition not found', 404, 'COMPETITION_NOT_FOUND');
    }

    const competition = competitionResult.rows[0];

    if (competition.created_by !== req.user.id) {
      throw new AppError('You can only update competitions you created', 403, 'ACCESS_DENIED');
    }

    if (competition.status === 'completed') {
      throw new AppError('Cannot update completed competitions', 400, 'COMPETITION_COMPLETED');
    }

    const {
      title,
      description,
      genre,
      skillLevel,
      instrument,
      prizeDescription,
      maxParticipants
    } = req.body;

    const result = await db.query(`
      UPDATE competitions 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          genre = COALESCE($3, genre),
          skill_level = COALESCE($4, skill_level),
          instrument = COALESCE($5, instrument),
          prize_description = COALESCE($6, prize_description),
          max_participants = COALESCE($7, max_participants),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [title, description, genre, skillLevel, instrument, prizeDescription, maxParticipants, competitionId]);

    const updatedCompetition = result.rows[0];

    res.json({
      success: true,
      message: 'Competition updated successfully',
      data: {
        competition: {
          id: updatedCompetition.id,
          title: updatedCompetition.title,
          description: updatedCompetition.description,
          genre: updatedCompetition.genre,
          skillLevel: updatedCompetition.skill_level,
          instrument: updatedCompetition.instrument,
          startDate: updatedCompetition.start_date,
          endDate: updatedCompetition.end_date,
          prizeDescription: updatedCompetition.prize_description,
          maxParticipants: updatedCompetition.max_participants,
          entryFee: parseFloat(updatedCompetition.entry_fee),
          status: updatedCompetition.status,
          createdAt: updatedCompetition.created_at,
          updatedAt: updatedCompetition.updated_at
        }
      }
    });
  })
);

/**
 * @route   POST /api/competitions/:competitionId/enter
 * @desc    Enter a competition
 * @access  Private
 */
router.post('/:competitionId/enter',
  authenticateToken,
  validate(Joi.object({ competitionId: schemas.common.uuid }), 'params'),
  validate(schemas.competition.submitEntry),
  asyncHandler(async (req, res) => {
    const { competitionId } = req.params;
    const { submissionUrl, submissionDescription } = req.body;

    // Check if competition exists and is active
    const competitionResult = await db.query(`
      SELECT status, max_participants, start_date, end_date,
             (SELECT COUNT(*) FROM competition_entries WHERE competition_id = $1) as current_participants
      FROM competitions WHERE id = $1
    `, [competitionId]);

    if (competitionResult.rows.length === 0) {
      throw new AppError('Competition not found', 404, 'COMPETITION_NOT_FOUND');
    }

    const competition = competitionResult.rows[0];
    const now = new Date();

    if (competition.status !== 'active' && now < new Date(competition.start_date)) {
      throw new AppError('Competition is not yet open for entries', 400, 'COMPETITION_NOT_OPEN');
    }

    if (competition.status === 'completed' || now > new Date(competition.end_date)) {
      throw new AppError('Competition has ended', 400, 'COMPETITION_ENDED');
    }

    if (competition.max_participants && competition.current_participants >= competition.max_participants) {
      throw new AppError('Competition is full', 400, 'COMPETITION_FULL');
    }

    try {
      const result = await db.query(`
        INSERT INTO competition_entries (competition_id, user_id, submission_url, submission_description)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [competitionId, req.user.id, submissionUrl, submissionDescription]);

      const entry = result.rows[0];

      res.status(201).json({
        success: true,
        message: 'Entry submitted successfully',
        data: {
          entry: {
            id: entry.id,
            competitionId: entry.competition_id,
            submissionUrl: entry.submission_url,
            submissionDescription: entry.submission_description,
            score: entry.score,
            submittedAt: entry.submitted_at
          }
        }
      });
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new AppError('You have already entered this competition', 409, 'ALREADY_ENTERED');
      }
      throw error;
    }
  })
);

/**
 * @route   GET /api/competitions/:competitionId/entries
 * @desc    Get competition entries (leaderboard)
 * @access  Public
 */
router.get('/:competitionId/entries',
  validate(Joi.object({ competitionId: schemas.common.uuid }), 'params'),
  validate(Joi.object(schemas.common.pagination), 'query'),
  asyncHandler(async (req, res) => {
    const { competitionId } = req.params;
    const { page, limit } = req.query;
    const offset = (page - 1) * limit;

    // Check if competition exists
    const competitionExists = await db.query('SELECT id FROM competitions WHERE id = $1', [competitionId]);
    if (competitionExists.rows.length === 0) {
      throw new AppError('Competition not found', 404, 'COMPETITION_NOT_FOUND');
    }

    const result = await db.query(`
      SELECT ce.id, ce.submission_url, ce.submission_description, ce.score, ce.submitted_at,
             u.id as user_id, u.name as user_name, u.avatar_url as user_avatar, u.is_verified
      FROM competition_entries ce
      LEFT JOIN users u ON ce.user_id = u.id
      WHERE ce.competition_id = $1
      ORDER BY ce.score DESC, ce.submitted_at ASC
      LIMIT $2 OFFSET $3
    `, [competitionId, limit, offset]);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM competition_entries WHERE competition_id = $1',
      [competitionId]
    );

    res.json({
      success: true,
      data: {
        entries: result.rows.map((entry, index) => ({
          id: entry.id,
          rank: offset + index + 1,
          submissionUrl: entry.submission_url,
          submissionDescription: entry.submission_description,
          score: entry.score,
          submittedAt: entry.submitted_at,
          user: {
            id: entry.user_id,
            name: entry.user_name,
            avatarUrl: entry.user_avatar,
            isVerified: entry.is_verified
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
 * @route   DELETE /api/competitions/:competitionId/enter
 * @desc    Withdraw from competition
 * @access  Private
 */
router.delete('/:competitionId/enter',
  authenticateToken,
  validate(Joi.object({ competitionId: schemas.common.uuid }), 'params'),
  asyncHandler(async (req, res) => {
    const { competitionId } = req.params;

    // Check if competition allows withdrawal (not yet started or still in early phase)
    const competitionResult = await db.query(
      'SELECT start_date, status FROM competitions WHERE id = $1',
      [competitionId]
    );

    if (competitionResult.rows.length === 0) {
      throw new AppError('Competition not found', 404, 'COMPETITION_NOT_FOUND');
    }

    const competition = competitionResult.rows[0];
    const now = new Date();
    const startDate = new Date(competition.start_date);
    
    // Allow withdrawal up to 24 hours after competition starts
    const withdrawalDeadline = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    if (now > withdrawalDeadline && competition.status === 'active') {
      throw new AppError('Withdrawal period has ended', 400, 'WITHDRAWAL_PERIOD_ENDED');
    }

    const result = await db.query(
      'DELETE FROM competition_entries WHERE competition_id = $1 AND user_id = $2',
      [competitionId, req.user.id]
    );

    if (result.rowCount === 0) {
      throw new AppError('You are not participating in this competition', 404, 'NOT_PARTICIPATING');
    }

    res.json({
      success: true,
      message: 'Successfully withdrawn from competition'
    });
  })
);

module.exports = router;