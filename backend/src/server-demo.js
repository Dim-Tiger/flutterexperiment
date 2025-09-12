const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Mock database for demonstration
const mockDb = require('./config/mock-database');

const app = express();
const PORT = process.env.PORT || 5000;

// JWT secret (use a real secret in production)
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key';

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Optional auth middleware (doesn't require token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, instruments, skillLevel, bio } = req.body;

    // Check if user exists
    const existingUser = await mockDb.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await mockDb.createUser({
      name,
      email,
      password_hash: passwordHash,
      instruments: instruments || [],
      skill_level: skillLevel || 'Beginner',
      bio: bio || null
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password hash from response
    const { password_hash, ...userResponse } = user;

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        ...userResponse,
        joinDate: userResponse.join_date,
        skillLevel: userResponse.skill_level,
        isVerified: userResponse.is_verified,
        avatarUrl: userResponse.avatar_url
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await mockDb.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password hash from response
    const { password_hash, ...userResponse } = user;

    res.json({
      message: 'Login successful',
      user: {
        ...userResponse,
        joinDate: userResponse.join_date,
        skillLevel: userResponse.skill_level,
        isVerified: userResponse.is_verified,
        avatarUrl: userResponse.avatar_url
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

// User routes
app.get('/api/users/profile/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await mockDb.findUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password_hash, ...userResponse } = user;
    
    res.json({
      ...userResponse,
      joinDate: userResponse.join_date,
      skillLevel: userResponse.skill_level,
      isVerified: userResponse.is_verified,
      avatarUrl: userResponse.avatar_url
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get user profile' });
  }
});

// Competition routes
app.get('/api/competitions', optionalAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const competitions = await mockDb.getCompetitions({ active: status === 'active' });
    
    const competitionsResponse = competitions.map(comp => ({
      ...comp,
      skillLevel: comp.skill_level,
      eligibleInstruments: comp.eligible_instruments,
      participantCount: comp.participant_count,
      isActive: comp.is_active,
      createdAt: comp.created_at
    }));
    
    res.json({ data: competitionsResponse });
  } catch (error) {
    console.error('Get competitions error:', error);
    res.status(500).json({ message: 'Failed to get competitions' });
  }
});

// Community routes
app.get('/api/community/posts', optionalAuth, async (req, res) => {
  try {
    const { category } = req.query;
    const posts = await mockDb.getCommunityPosts({ category });
    
    const postsResponse = posts.map(post => ({
      ...post,
      userId: post.user_id,
      createdAt: post.created_at,
      likeCount: post.like_count,
      commentCount: post.comment_count,
      imageUrls: post.image_urls
    }));
    
    res.json({ data: postsResponse });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Failed to get community posts' });
  }
});

app.post('/api/community/posts', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, tags, imageUrls } = req.body;
    
    const post = await mockDb.createCommunityPost({
      user_id: req.user.userId,
      title,
      content,
      category,
      tags: tags || [],
      image_urls: imageUrls || []
    });

    // Get user info for response
    const user = await mockDb.findUserById(req.user.userId);
    
    const postResponse = {
      ...post,
      userId: post.user_id,
      userName: user.name,
      userAvatar: user.name[0],
      createdAt: post.created_at,
      likeCount: post.like_count,
      commentCount: post.comment_count,
      imageUrls: post.image_urls
    };
    
    res.status(201).json(postResponse);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

app.post('/api/community/posts/:postId/like', authenticateToken, async (req, res) => {
  try {
    // Mock like functionality - just return success
    res.json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Failed to like post' });
  }
});

// Tutorial routes
app.get('/api/tutorials', optionalAuth, async (req, res) => {
  try {
    const { instrument } = req.query;
    const tutorials = await mockDb.getTutorials({ instrument });
    
    const tutorialsResponse = tutorials.map(tutorial => ({
      ...tutorial,
      instructorId: tutorial.instructor_id,
      instructorName: 'Dr. Sarah Johnson', // Mock instructor name
      skillLevel: tutorial.skill_level,
      durationMinutes: tutorial.duration_minutes,
      studentCount: tutorial.student_count,
      isPremium: tutorial.is_premium,
      publishedAt: tutorial.published_at
    }));
    
    res.json({ data: tutorialsResponse });
  } catch (error) {
    console.error('Get tutorials error:', error);
    res.status(500).json({ message: 'Failed to get tutorials' });
  }
});

// Marketplace routes
app.get('/api/marketplace', optionalAuth, async (req, res) => {
  try {
    const { category } = req.query;
    const items = await mockDb.getMarketplaceItems({ category });
    
    const itemsResponse = items.map(item => ({
      ...item,
      sellerId: item.seller_id,
      sellerName: 'Music Store Pro', // Mock seller name
      imageUrls: item.image_urls,
      listedAt: item.listed_at,
      isVerified: item.is_verified,
      isAvailable: item.is_available
    }));
    
    res.json({ data: itemsResponse });
  } catch (error) {
    console.error('Get marketplace items error:', error);
    res.status(500).json({ message: 'Failed to get marketplace items' });
  }
});

// Practice routes
app.get('/api/practice', optionalAuth, async (req, res) => {
  try {
    const { live } = req.query;
    const sessions = await mockDb.getPracticeSessions({ live: live === 'true' });
    
    const sessionsResponse = sessions.map(session => ({
      ...session,
      userId: session.user_id,
      startTime: session.start_time,
      endTime: session.end_time,
      durationMinutes: session.duration_minutes || 0,
      practiceGoals: session.practice_goals,
      isLive: session.is_live,
      isActive: session.is_live && !session.end_time
    }));
    
    res.json({ data: sessionsResponse });
  } catch (error) {
    console.error('Get practice sessions error:', error);
    res.status(500).json({ message: 'Failed to get practice sessions' });
  }
});

app.post('/api/practice', authenticateToken, async (req, res) => {
  try {
    const { title, description, instrument, practiceGoals, isLive } = req.body;
    
    const session = await mockDb.createPracticeSession({
      user_id: req.user.userId,
      title,
      description,
      instrument,
      practice_goals: practiceGoals || [],
      is_live: isLive || false
    });
    
    const sessionResponse = {
      ...session,
      userId: session.user_id,
      startTime: session.start_time,
      endTime: session.end_time,
      practiceGoals: session.practice_goals,
      isLive: session.is_live,
      isActive: session.is_live && !session.end_time
    };
    
    res.status(201).json(sessionResponse);
  } catch (error) {
    console.error('Create practice session error:', error);
    res.status(500).json({ message: 'Failed to create practice session' });
  }
});

// Search route
app.get('/api/search', optionalAuth, async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const results = await mockDb.searchContent(query);
    
    // Transform results to match frontend expectations
    const transformedResults = {
      tutorials: results.tutorials.map(tutorial => ({
        ...tutorial,
        instructorId: tutorial.instructor_id,
        instructorName: 'Dr. Sarah Johnson',
        skillLevel: tutorial.skill_level,
        durationMinutes: tutorial.duration_minutes,
        studentCount: tutorial.student_count,
        isPremium: tutorial.is_premium,
        publishedAt: tutorial.published_at
      })),
      posts: results.posts.map(post => ({
        ...post,
        userId: post.user_id,
        userName: 'Sample User',
        userAvatar: 'S',
        createdAt: post.created_at,
        likeCount: post.like_count,
        commentCount: post.comment_count,
        imageUrls: post.image_urls
      })),
      items: results.items.map(item => ({
        ...item,
        sellerId: item.seller_id,
        sellerName: 'Music Store Pro',
        imageUrls: item.image_urls,
        listedAt: item.listed_at,
        isVerified: item.is_verified,
        isAvailable: item.is_available
      }))
    };
    
    res.json({ data: transformedResults });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Music Practice API server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;