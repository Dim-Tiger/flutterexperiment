const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Database initialization and schema creation
const initializeDatabase = async () => {
  const client = await pool.connect();
  
  try {
    // Create tables if they don't exist
    await client.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        bio TEXT,
        instruments TEXT[], -- Array of instrument names
        skill_level VARCHAR(50) DEFAULT 'Beginner',
        join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_verified BOOLEAN DEFAULT FALSE,
        is_instructor BOOLEAN DEFAULT FALSE,
        practice_streak INTEGER DEFAULT 0,
        total_practice_time INTEGER DEFAULT 0, -- in minutes
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Competitions table
      CREATE TABLE IF NOT EXISTS competitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        genre VARCHAR(100),
        skill_level VARCHAR(50),
        instrument VARCHAR(100),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        prize_description TEXT,
        max_participants INTEGER,
        entry_fee DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'upcoming', -- upcoming, active, completed
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Competition entries
      CREATE TABLE IF NOT EXISTS competition_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        submission_url TEXT,
        submission_description TEXT,
        score INTEGER DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(competition_id, user_id)
      );

      -- Practice sessions table
      CREATE TABLE IF NOT EXISTS practice_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        instrument VARCHAR(100),
        duration_minutes INTEGER NOT NULL,
        goals TEXT[],
        notes TEXT,
        session_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Community posts table
      CREATE TABLE IF NOT EXISTS community_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100) NOT NULL, -- Tips, Questions, Technique, Inspiration, Gear
        author_id UUID REFERENCES users(id) ON DELETE CASCADE,
        media_urls TEXT[],
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Community post comments
      CREATE TABLE IF NOT EXISTS post_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
        author_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_comment_id UUID REFERENCES post_comments(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Post likes
      CREATE TABLE IF NOT EXISTS post_likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      );

      -- Tutorials table
      CREATE TABLE IF NOT EXISTS tutorials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        instructor_id UUID REFERENCES users(id),
        instrument VARCHAR(100),
        skill_level VARCHAR(50),
        duration_minutes INTEGER,
        is_featured BOOLEAN DEFAULT FALSE,
        views_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Marketplace items table
      CREATE TABLE IF NOT EXISTS marketplace_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        category VARCHAR(100), -- Guitar, Piano, Drums, etc.
        condition VARCHAR(50), -- New, Like New, Good, Fair
        brand VARCHAR(100),
        model VARCHAR(100),
        year_manufactured INTEGER,
        serial_number VARCHAR(100),
        seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
        images_urls TEXT[],
        status VARCHAR(50) DEFAULT 'available', -- available, sold, reserved
        location VARCHAR(255),
        shipping_available BOOLEAN DEFAULT TRUE,
        verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- User followers/following
      CREATE TABLE IF NOT EXISTS user_follows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      );

      -- Practice room sessions
      CREATE TABLE IF NOT EXISTS practice_rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        host_id UUID REFERENCES users(id) ON DELETE CASCADE,
        max_participants INTEGER DEFAULT 10,
        current_participants INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        room_type VARCHAR(50) DEFAULT 'open', -- open, private, instructor-led
        scheduled_start TIMESTAMP,
        scheduled_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Practice room participants
      CREATE TABLE IF NOT EXISTS room_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID REFERENCES practice_rooms(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        left_at TIMESTAMP,
        UNIQUE(room_id, user_id)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
      CREATE INDEX IF NOT EXISTS idx_competitions_dates ON competitions(start_date, end_date);
      CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_date ON practice_sessions(user_id, session_date);
      CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
      CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at);
      CREATE INDEX IF NOT EXISTS idx_tutorials_instrument_level ON tutorials(instrument, skill_level);
      CREATE INDEX IF NOT EXISTS idx_marketplace_category_status ON marketplace_items(category, status);
      CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
      CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Initialize database on startup
initializeDatabase().catch(console.error);

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  end: () => pool.end(),
  pool
};