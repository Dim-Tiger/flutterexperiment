const jwt = require('jsonwebtoken');
const db = require('../config/database');
const redis = require('../config/redis');

// Store active connections
const activeUsers = new Map();
const practiceRooms = new Map();

/**
 * Socket.IO authentication middleware
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Check if token is blacklisted
    const isBlacklisted = await redis.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return next(new Error('Token has been revoked'));
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const result = await db.query(
      'SELECT id, name, email, avatar_url, is_verified, is_instructor FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return next(new Error('User not found'));
    }

    socket.user = result.rows[0];
    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
};

/**
 * Main Socket.IO handler
 */
const handleSocketConnection = (io) => {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected: ${socket.id}`);
    
    // Store active user
    activeUsers.set(socket.user.id, {
      socketId: socket.id,
      user: socket.user,
      joinedAt: new Date()
    });

    // Join user to their personal room for notifications
    socket.join(`user:${socket.user.id}`);

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Music Practice Platform',
      user: socket.user
    });

    // Handle practice room events
    handlePracticeRoomEvents(socket, io);

    // Handle general events
    handleGeneralEvents(socket, io);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnected: ${socket.id}`);
      
      // Remove from active users
      activeUsers.delete(socket.user.id);
      
      // Leave all practice rooms
      leavePracticeRooms(socket);
      
      // Notify other users if they were in practice rooms
      broadcastUserOffline(socket, io);
    });
  });
};

/**
 * Handle practice room related events
 */
const handlePracticeRoomEvents = (socket, io) => {
  // Join practice room
  socket.on('join_practice_room', async (data) => {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      // Check if room exists and is active
      const roomResult = await db.query(
        'SELECT * FROM practice_rooms WHERE id = $1 AND is_active = true',
        [roomId]
      );

      if (roomResult.rows.length === 0) {
        socket.emit('error', { message: 'Practice room not found or inactive' });
        return;
      }

      const room = roomResult.rows[0];

      // Check if room is full
      const participantsResult = await db.query(
        'SELECT COUNT(*) FROM room_participants WHERE room_id = $1 AND left_at IS NULL',
        [roomId]
      );

      const currentParticipants = parseInt(participantsResult.rows[0].count);

      if (currentParticipants >= room.max_participants) {
        socket.emit('error', { message: 'Practice room is full' });
        return;
      }

      // Add user to room in database
      await db.query(`
        INSERT INTO room_participants (room_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (room_id, user_id) DO UPDATE SET left_at = NULL
      `, [roomId, socket.user.id]);

      // Update current participants count
      await db.query(
        'UPDATE practice_rooms SET current_participants = $1 WHERE id = $2',
        [currentParticipants + 1, roomId]
      );

      // Join socket room
      socket.join(`practice_room:${roomId}`);
      
      // Store room info
      if (!practiceRooms.has(roomId)) {
        practiceRooms.set(roomId, new Set());
      }
      practiceRooms.get(roomId).add(socket.user.id);

      // Get updated participant list
      const participantsList = await getPracticeRoomParticipants(roomId);

      // Notify all users in the room
      io.to(`practice_room:${roomId}`).emit('user_joined_room', {
        user: {
          id: socket.user.id,
          name: socket.user.name,
          avatarUrl: socket.user.avatar_url,
          isVerified: socket.user.is_verified,
          isInstructor: socket.user.is_instructor
        },
        participants: participantsList,
        message: `${socket.user.name} joined the practice room`
      });

      socket.emit('joined_practice_room', {
        roomId,
        room: {
          ...room,
          currentParticipants: currentParticipants + 1
        },
        participants: participantsList
      });

    } catch (error) {
      console.error('Error joining practice room:', error);
      socket.emit('error', { message: 'Failed to join practice room' });
    }
  });

  // Leave practice room
  socket.on('leave_practice_room', async (data) => {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      await leavePracticeRoom(socket, roomId, io);
      
      socket.emit('left_practice_room', { roomId });

    } catch (error) {
      console.error('Error leaving practice room:', error);
      socket.emit('error', { message: 'Failed to leave practice room' });
    }
  });

  // Send practice room message
  socket.on('practice_room_message', async (data) => {
    try {
      const { roomId, message, type = 'text' } = data;
      
      if (!roomId || !message) {
        socket.emit('error', { message: 'Room ID and message are required' });
        return;
      }

      // Verify user is in the room
      const isInRoom = await db.query(
        'SELECT id FROM room_participants WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL',
        [roomId, socket.user.id]
      );

      if (isInRoom.rows.length === 0) {
        socket.emit('error', { message: 'You are not in this practice room' });
        return;
      }

      const messageData = {
        id: Date.now().toString(), // Simple ID for real-time messages
        roomId,
        message,
        type,
        timestamp: new Date().toISOString(),
        user: {
          id: socket.user.id,
          name: socket.user.name,
          avatarUrl: socket.user.avatar_url,
          isVerified: socket.user.is_verified,
          isInstructor: socket.user.is_instructor
        }
      };

      // Broadcast to all users in the room
      io.to(`practice_room:${roomId}`).emit('practice_room_message', messageData);

      // TODO: Store message in database for message history
      // await storeRoomMessage(messageData);

    } catch (error) {
      console.error('Error sending practice room message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Practice session feedback
  socket.on('practice_feedback', async (data) => {
    try {
      const { roomId, targetUserId, feedback, type = 'encouragement' } = data;
      
      if (!roomId || !targetUserId || !feedback) {
        socket.emit('error', { message: 'Room ID, target user ID, and feedback are required' });
        return;
      }

      // Verify both users are in the room
      const usersInRoom = await db.query(
        'SELECT user_id FROM room_participants WHERE room_id = $1 AND user_id IN ($2, $3) AND left_at IS NULL',
        [roomId, socket.user.id, targetUserId]
      );

      if (usersInRoom.rows.length !== 2) {
        socket.emit('error', { message: 'Users must be in the same practice room' });
        return;
      }

      const feedbackData = {
        id: Date.now().toString(),
        roomId,
        feedback,
        type, // encouragement, tip, correction, etc.
        timestamp: new Date().toISOString(),
        from: {
          id: socket.user.id,
          name: socket.user.name,
          avatarUrl: socket.user.avatar_url,
          isInstructor: socket.user.is_instructor
        },
        to: targetUserId
      };

      // Send feedback to target user
      io.to(`user:${targetUserId}`).emit('practice_feedback_received', feedbackData);
      
      // Confirm to sender
      socket.emit('practice_feedback_sent', feedbackData);

    } catch (error) {
      console.error('Error sending practice feedback:', error);
      socket.emit('error', { message: 'Failed to send feedback' });
    }
  });
};

/**
 * Handle general events
 */
const handleGeneralEvents = (socket, io) => {
  // User status update
  socket.on('update_status', (data) => {
    const { status } = data; // practicing, available, busy, etc.
    
    // Update user status in active users
    if (activeUsers.has(socket.user.id)) {
      activeUsers.get(socket.user.id).status = status;
    }

    // Notify followers (if needed)
    // This could be extended to notify followers about status changes
  });

  // Live practice session start
  socket.on('start_practice_session', async (data) => {
    try {
      const { instrument, goals = [] } = data;
      
      if (!instrument) {
        socket.emit('error', { message: 'Instrument is required' });
        return;
      }

      // Create practice session in database
      const sessionResult = await db.query(`
        INSERT INTO practice_sessions (user_id, instrument, duration_minutes, goals, session_date)
        VALUES ($1, $2, $3, $4, CURRENT_DATE)
        RETURNING id
      `, [socket.user.id, instrument, 0, goals]); // Duration will be updated when session ends

      const sessionId = sessionResult.rows[0].id;

      // Store session in memory for real-time tracking
      socket.practiceSession = {
        id: sessionId,
        instrument,
        goals,
        startTime: new Date(),
        isActive: true
      };

      socket.emit('practice_session_started', {
        sessionId,
        instrument,
        goals,
        startTime: socket.practiceSession.startTime
      });

      // Notify followers that user started practicing (optional)
      // socket.broadcast.to(`followers:${socket.user.id}`).emit('user_started_practicing', {
      //   user: socket.user,
      //   instrument,
      //   goals
      // });

    } catch (error) {
      console.error('Error starting practice session:', error);
      socket.emit('error', { message: 'Failed to start practice session' });
    }
  });

  // End practice session
  socket.on('end_practice_session', async (data) => {
    try {
      if (!socket.practiceSession || !socket.practiceSession.isActive) {
        socket.emit('error', { message: 'No active practice session found' });
        return;
      }

      const { notes = '' } = data;
      const endTime = new Date();
      const durationMinutes = Math.round((endTime - socket.practiceSession.startTime) / (1000 * 60));

      // Update session in database
      await db.query(`
        UPDATE practice_sessions 
        SET duration_minutes = $1, notes = $2
        WHERE id = $3
      `, [durationMinutes, notes, socket.practiceSession.id]);

      // Update user practice statistics
      await updateUserPracticeStats(socket.user.id, durationMinutes);

      socket.practiceSession.isActive = false;
      socket.practiceSession.endTime = endTime;
      socket.practiceSession.durationMinutes = durationMinutes;

      socket.emit('practice_session_ended', {
        sessionId: socket.practiceSession.id,
        durationMinutes,
        notes,
        endTime
      });

    } catch (error) {
      console.error('Error ending practice session:', error);
      socket.emit('error', { message: 'Failed to end practice session' });
    }
  });
};

/**
 * Helper function to leave a practice room
 */
const leavePracticeRoom = async (socket, roomId, io) => {
  try {
    // Update database
    await db.query(
      'UPDATE room_participants SET left_at = CURRENT_TIMESTAMP WHERE room_id = $1 AND user_id = $2',
      [roomId, socket.user.id]
    );

    // Update current participants count
    const participantsResult = await db.query(
      'SELECT COUNT(*) FROM room_participants WHERE room_id = $1 AND left_at IS NULL',
      [roomId]
    );

    const currentParticipants = parseInt(participantsResult.rows[0].count);

    await db.query(
      'UPDATE practice_rooms SET current_participants = $1 WHERE id = $2',
      [currentParticipants, roomId]
    );

    // Leave socket room
    socket.leave(`practice_room:${roomId}`);
    
    // Remove from practice rooms tracking
    if (practiceRooms.has(roomId)) {
      practiceRooms.get(roomId).delete(socket.user.id);
      if (practiceRooms.get(roomId).size === 0) {
        practiceRooms.delete(roomId);
      }
    }

    // Get updated participant list
    const participantsList = await getPracticeRoomParticipants(roomId);

    // Notify other users in the room
    io.to(`practice_room:${roomId}`).emit('user_left_room', {
      userId: socket.user.id,
      userName: socket.user.name,
      participants: participantsList,
      message: `${socket.user.name} left the practice room`
    });

  } catch (error) {
    console.error('Error leaving practice room:', error);
    throw error;
  }
};

/**
 * Helper function to leave all practice rooms on disconnect
 */
const leavePracticeRooms = async (socket) => {
  try {
    // Get all rooms user is currently in
    const roomsResult = await db.query(
      'SELECT room_id FROM room_participants WHERE user_id = $1 AND left_at IS NULL',
      [socket.user.id]
    );

    // Leave each room
    for (const row of roomsResult.rows) {
      await leavePracticeRoom(socket, row.room_id, socket.broadcast);
    }
  } catch (error) {
    console.error('Error leaving practice rooms on disconnect:', error);
  }
};

/**
 * Broadcast user offline status
 */
const broadcastUserOffline = (socket, io) => {
  // This could be extended to notify followers or practice room participants
  // that the user went offline
};

/**
 * Get practice room participants
 */
const getPracticeRoomParticipants = async (roomId) => {
  const result = await db.query(`
    SELECT u.id, u.name, u.avatar_url, u.is_verified, u.is_instructor, rp.joined_at
    FROM room_participants rp
    LEFT JOIN users u ON rp.user_id = u.id
    WHERE rp.room_id = $1 AND rp.left_at IS NULL
    ORDER BY rp.joined_at ASC
  `, [roomId]);

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url,
    isVerified: row.is_verified,
    isInstructor: row.is_instructor,
    joinedAt: row.joined_at
  }));
};

/**
 * Update user practice statistics
 */
const updateUserPracticeStats = async (userId, durationMinutes) => {
  try {
    await db.query(
      'UPDATE users SET total_practice_time = total_practice_time + $1 WHERE id = $2',
      [durationMinutes, userId]
    );
  } catch (error) {
    console.error('Error updating practice stats:', error);
  }
};

/**
 * Get online users count
 */
const getOnlineUsersCount = () => {
  return activeUsers.size;
};

/**
 * Get active practice rooms
 */
const getActivePracticeRooms = () => {
  return Array.from(practiceRooms.entries()).map(([roomId, participants]) => ({
    roomId,
    participantCount: participants.size
  }));
};

module.exports = (io) => {
  handleSocketConnection(io);
  
  // Optional: Add periodic status broadcasts
  setInterval(() => {
    io.emit('server_stats', {
      onlineUsers: getOnlineUsersCount(),
      activePracticeRooms: getActivePracticeRooms().length
    });
  }, 30000); // Every 30 seconds
};