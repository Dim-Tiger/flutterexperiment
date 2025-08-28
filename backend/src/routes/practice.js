const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { validate, schemas } = require('../utils/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/practice/sessions
 * @desc    Get user's practice sessions
 * @access  Private
 */
router.get('/sessions',
  authenticateToken,
  validate(Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    instrument: schemas.common.instrument.optional(),
    ...schemas.common.pagination
  }), 'query'),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, instrument, page, limit, sort, order } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, instrument, duration_minutes, goals, notes, session_date, created_at
      FROM practice_sessions
      WHERE user_id = $1
    `;

    const queryParams = [req.user.id];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND session_date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND session_date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }

    if (instrument) {
      query += ` AND instrument = $${paramIndex}`;
      queryParams.push(instrument);
      paramIndex++;
    }

    // Add ordering
    const validSortFields = {
      'session_date': 'session_date',
      'created_at': 'created_at',
      'duration_minutes': 'duration_minutes',
      'instrument': 'instrument'
    };

    const sortField = validSortFields[sort] || 'session_date';
    query += ` ORDER BY ${sortField} ${order.toUpperCase()} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM practice_sessions WHERE user_id = $1`;
    const countParams = [req.user.id];
    let countParamIndex = 2;

    if (startDate) {
      countQuery += ` AND session_date >= $${countParamIndex}`;
      countParams.push(startDate);
      countParamIndex++;
    }

    if (endDate) {
      countQuery += ` AND session_date <= $${countParamIndex}`;
      countParams.push(endDate);
      countParamIndex++;
    }

    if (instrument) {
      countQuery += ` AND instrument = $${countParamIndex}`;
      countParams.push(instrument);
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        sessions: result.rows.map(session => ({
          id: session.id,
          instrument: session.instrument,
          durationMinutes: session.duration_minutes,
          goals: session.goals,
          notes: session.notes,
          sessionDate: session.session_date,
          createdAt: session.created_at
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
 * @route   POST /api/practice/sessions
 * @desc    Create new practice session
 * @access  Private
 */
router.post('/sessions',
  authenticateToken,
  validate(schemas.practice.create),
  asyncHandler(async (req, res) => {
    const { instrument, durationMinutes, goals, notes, sessionDate } = req.body;

    const result = await db.query(`
      INSERT INTO practice_sessions (user_id, instrument, duration_minutes, goals, notes, session_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [req.user.id, instrument, durationMinutes, goals, notes, sessionDate]);

    const session = result.rows[0];

    // Update user's total practice time and streak
    await updateUserPracticeStats(req.user.id, durationMinutes, sessionDate);

    res.status(201).json({
      success: true,
      message: 'Practice session created successfully',
      data: {
        session: {
          id: session.id,
          instrument: session.instrument,
          durationMinutes: session.duration_minutes,
          goals: session.goals,
          notes: session.notes,
          sessionDate: session.session_date,
          createdAt: session.created_at
        }
      }
    });
  })
);

/**
 * @route   GET /api/practice/sessions/:sessionId
 * @desc    Get specific practice session
 * @access  Private
 */
router.get('/sessions/:sessionId',
  authenticateToken,
  validate(Joi.object({ sessionId: schemas.common.uuid }), 'params'),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const result = await db.query(
      'SELECT * FROM practice_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Practice session not found', 404, 'SESSION_NOT_FOUND');
    }

    const session = result.rows[0];

    res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          instrument: session.instrument,
          durationMinutes: session.duration_minutes,
          goals: session.goals,
          notes: session.notes,
          sessionDate: session.session_date,
          createdAt: session.created_at
        }
      }
    });
  })
);

/**
 * @route   PUT /api/practice/sessions/:sessionId
 * @desc    Update practice session
 * @access  Private
 */
router.put('/sessions/:sessionId',
  authenticateToken,
  validate(Joi.object({ sessionId: schemas.common.uuid }), 'params'),
  validate(schemas.practice.update),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { goals, notes } = req.body;

    // Check if session exists and belongs to user
    const existingSession = await db.query(
      'SELECT * FROM practice_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );

    if (existingSession.rows.length === 0) {
      throw new AppError('Practice session not found', 404, 'SESSION_NOT_FOUND');
    }

    const result = await db.query(`
      UPDATE practice_sessions 
      SET goals = COALESCE($1, goals),
          notes = COALESCE($2, notes)
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `, [goals, notes, sessionId, req.user.id]);

    const session = result.rows[0];

    res.json({
      success: true,
      message: 'Practice session updated successfully',
      data: {
        session: {
          id: session.id,
          instrument: session.instrument,
          durationMinutes: session.duration_minutes,
          goals: session.goals,
          notes: session.notes,
          sessionDate: session.session_date,
          createdAt: session.created_at
        }
      }
    });
  })
);

/**
 * @route   DELETE /api/practice/sessions/:sessionId
 * @desc    Delete practice session
 * @access  Private
 */
router.delete('/sessions/:sessionId',
  authenticateToken,
  validate(Joi.object({ sessionId: schemas.common.uuid }), 'params'),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const result = await db.query(
      'DELETE FROM practice_sessions WHERE id = $1 AND user_id = $2 RETURNING duration_minutes, session_date',
      [sessionId, req.user.id]
    );

    if (result.rowCount === 0) {
      throw new AppError('Practice session not found', 404, 'SESSION_NOT_FOUND');
    }

    // Update user's total practice time (subtract deleted session)
    const deletedSession = result.rows[0];
    await db.query(
      'UPDATE users SET total_practice_time = total_practice_time - $1 WHERE id = $2',
      [deletedSession.duration_minutes, req.user.id]
    );

    res.json({
      success: true,
      message: 'Practice session deleted successfully'
    });
  })
);

/**
 * @route   GET /api/practice/stats
 * @desc    Get user's practice statistics
 * @access  Private
 */
router.get('/stats',
  authenticateToken,
  validate(Joi.object({
    period: Joi.string().valid('week', 'month', 'year', 'all').default('month'),
    instrument: schemas.common.instrument.optional()
  }), 'query'),
  asyncHandler(async (req, res) => {
    const { period, instrument } = req.query;
    const userId = req.user.id;

    // Calculate date range based on period
    let dateFilter = '';
    const now = new Date();
    
    switch (period) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `AND session_date >= '${weekAgo.toISOString().split('T')[0]}'`;
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        dateFilter = `AND session_date >= '${monthAgo.toISOString().split('T')[0]}'`;
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        dateFilter = `AND session_date >= '${yearAgo.toISOString().split('T')[0]}'`;
        break;
      default:
        dateFilter = '';
    }

    let instrumentFilter = '';
    if (instrument) {
      instrumentFilter = `AND instrument = '${instrument}'`;
    }

    // Get overall stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        SUM(duration_minutes) as total_minutes,
        AVG(duration_minutes) as avg_session_duration,
        MIN(session_date) as first_session_date,
        MAX(session_date) as last_session_date,
        COUNT(DISTINCT session_date) as days_practiced,
        COUNT(DISTINCT instrument) as instruments_practiced
      FROM practice_sessions 
      WHERE user_id = $1 ${dateFilter} ${instrumentFilter}
    `;

    const statsResult = await db.query(statsQuery, [userId]);
    const stats = statsResult.rows[0];

    // Get practice by instrument
    const instrumentStatsQuery = `
      SELECT 
        instrument,
        COUNT(*) as sessions_count,
        SUM(duration_minutes) as total_minutes
      FROM practice_sessions 
      WHERE user_id = $1 ${dateFilter}
      GROUP BY instrument
      ORDER BY total_minutes DESC
    `;

    const instrumentStatsResult = await db.query(instrumentStatsQuery, [userId]);

    // Get daily practice data for charts (last 30 days)
    const dailyStatsQuery = `
      SELECT 
        session_date,
        COUNT(*) as sessions_count,
        SUM(duration_minutes) as total_minutes
      FROM practice_sessions 
      WHERE user_id = $1 
        AND session_date >= CURRENT_DATE - INTERVAL '30 days'
        ${instrumentFilter}
      GROUP BY session_date
      ORDER BY session_date
    `;

    const dailyStatsResult = await db.query(dailyStatsQuery, [userId]);

    // Get current streak
    const streakQuery = `
      WITH practice_dates AS (
        SELECT DISTINCT session_date
        FROM practice_sessions
        WHERE user_id = $1
        ORDER BY session_date DESC
      ),
      streak_calc AS (
        SELECT 
          session_date,
          session_date - (ROW_NUMBER() OVER (ORDER BY session_date DESC))::int AS streak_group
        FROM practice_dates
        WHERE session_date >= CURRENT_DATE - INTERVAL '365 days'
      ),
      current_streak AS (
        SELECT COUNT(*) as streak_length
        FROM streak_calc
        WHERE streak_group = (
          SELECT streak_group 
          FROM streak_calc 
          WHERE session_date = CURRENT_DATE
          LIMIT 1
        )
      )
      SELECT COALESCE(streak_length, 0) as current_streak FROM current_streak
    `;

    const streakResult = await db.query(streakQuery, [userId]);

    res.json({
      success: true,
      data: {
        overview: {
          totalSessions: parseInt(stats.total_sessions),
          totalMinutes: parseInt(stats.total_minutes || 0),
          averageSessionDuration: parseFloat(stats.avg_session_duration || 0),
          daysPracticed: parseInt(stats.days_practiced),
          instrumentsPracticed: parseInt(stats.instruments_practiced),
          firstSessionDate: stats.first_session_date,
          lastSessionDate: stats.last_session_date,
          currentStreak: parseInt(streakResult.rows[0]?.current_streak || 0)
        },
        byInstrument: instrumentStatsResult.rows.map(row => ({
          instrument: row.instrument,
          sessionsCount: parseInt(row.sessions_count),
          totalMinutes: parseInt(row.total_minutes)
        })),
        dailyActivity: dailyStatsResult.rows.map(row => ({
          date: row.session_date,
          sessionsCount: parseInt(row.sessions_count),
          totalMinutes: parseInt(row.total_minutes)
        }))
      }
    });
  })
);

/**
 * @route   GET /api/practice/goals
 * @desc    Get practice goals and progress
 * @access  Private
 */
router.get('/goals',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // This could be extended to have a separate goals table
    // For now, we'll aggregate goals from practice sessions
    const result = await db.query(`
      SELECT 
        goal,
        COUNT(*) as times_set,
        COUNT(CASE WHEN session_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_progress
      FROM practice_sessions ps,
      UNNEST(ps.goals) AS goal
      WHERE ps.user_id = $1 
        AND goal IS NOT NULL 
        AND goal != ''
      GROUP BY goal
      ORDER BY times_set DESC
      LIMIT 20
    `, [req.user.id]);

    res.json({
      success: true,
      data: {
        commonGoals: result.rows.map(row => ({
          goal: row.goal,
          timesSet: parseInt(row.times_set),
          recentProgress: parseInt(row.recent_progress)
        }))
      }
    });
  })
);

/**
 * Helper function to update user practice statistics
 */
async function updateUserPracticeStats(userId, durationMinutes, sessionDate) {
  try {
    // Update total practice time
    await db.query(
      'UPDATE users SET total_practice_time = total_practice_time + $1 WHERE id = $2',
      [durationMinutes, userId]
    );

    // Calculate and update practice streak
    const streakQuery = `
      WITH practice_dates AS (
        SELECT DISTINCT session_date
        FROM practice_sessions
        WHERE user_id = $1
        ORDER BY session_date DESC
      ),
      consecutive_days AS (
        SELECT 
          session_date,
          session_date - (ROW_NUMBER() OVER (ORDER BY session_date DESC))::int AS streak_group
        FROM practice_dates
        WHERE session_date >= CURRENT_DATE - INTERVAL '365 days'
      ),
      current_streak AS (
        SELECT COUNT(*) as streak_length
        FROM consecutive_days
        WHERE streak_group = (
          SELECT streak_group 
          FROM consecutive_days 
          WHERE session_date <= CURRENT_DATE
          ORDER BY session_date DESC
          LIMIT 1
        )
      )
      SELECT COALESCE(streak_length, 0) as streak FROM current_streak
    `;

    const streakResult = await db.query(streakQuery, [userId]);
    const currentStreak = streakResult.rows[0]?.streak || 0;

    await db.query(
      'UPDATE users SET practice_streak = $1 WHERE id = $2',
      [currentStreak, userId]
    );
  } catch (error) {
    console.error('Error updating practice stats:', error);
    // Don't throw error as the main operation (creating session) was successful
  }
}

module.exports = router;