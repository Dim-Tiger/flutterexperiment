// Mock database service for demonstration
// In production, this would connect to a real database

class MockDatabase {
  constructor() {
    this.users = [];
    this.competitions = [];
    this.communityPosts = [];
    this.tutorials = [];
    this.marketplaceItems = [];
    this.practiceSessions = [];
    this.instructors = [];
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  initializeSampleData() {
    // Sample users
    this.users = [
      {
        id: '1',
        name: 'Sarah Chen',
        email: 'sarah@example.com',
        password_hash: '$2a$12$example', // bcrypt hash
        instruments: ['Piano', 'Guitar'],
        skill_level: 'Intermediate',
        join_date: new Date('2023-06-01'),
        is_verified: true,
        avatar_url: null,
        bio: 'Piano enthusiast with 5 years of experience'
      },
      {
        id: '2',
        name: 'Alex Rodriguez',
        email: 'alex@example.com',
        password_hash: '$2a$12$example',
        instruments: ['Guitar', 'Bass'],
        skill_level: 'Advanced',
        join_date: new Date('2023-08-01'),
        is_verified: false,
        avatar_url: null,
        bio: 'Guitar player and music producer'
      }
    ];

    // Sample competitions
    this.competitions = [
      {
        id: '1',
        title: 'Piano Solo Challenge',
        description: 'Showcase your best piano performance in this classical music competition.',
        genre: 'Classical',
        skill_level: 'Intermediate',
        prize: 'Masterclass with Vienna Philharmonic',
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        eligible_instruments: ['Piano'],
        participant_count: 234,
        is_active: true,
        created_at: new Date('2023-11-01')
      }
    ];

    // Sample community posts
    this.communityPosts = [
      {
        id: '1',
        user_id: '1',
        title: 'Piano Practice Schedule That Actually Works',
        content: 'After years of struggling with consistency, I found a practice routine that keeps me motivated...',
        category: 'Tips',
        tags: ['piano', 'practice', 'routine'],
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        like_count: 24,
        comment_count: 8,
        image_urls: []
      }
    ];

    // Sample tutorials
    this.tutorials = [
      {
        id: '1',
        title: 'Piano Scales and Arpeggios Mastery',
        description: 'Learn the fundamental piano scales and arpeggios that every pianist should know.',
        instructor_id: 'i1',
        instrument: 'Piano',
        skill_level: 'Intermediate',
        duration_minutes: 45,
        rating: 4.8,
        student_count: 1200,
        is_premium: false,
        tags: ['scales', 'arpeggios', 'technique'],
        published_at: new Date('2023-11-15')
      }
    ];

    // Sample marketplace items
    this.marketplaceItems = [
      {
        id: '1',
        seller_id: '1',
        title: 'Yamaha P-45 Digital Piano',
        description: 'Excellent condition digital piano, barely used.',
        category: 'Piano',
        price: 549.00,
        condition: 'Like New',
        location: 'San Francisco, CA',
        image_urls: [],
        listed_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        is_verified: true,
        is_available: true,
        tags: ['yamaha', 'digital', 'weighted-keys']
      }
    ];

    // Sample practice sessions
    this.practiceSessions = [
      {
        id: '1',
        user_id: '1',
        title: 'Piano Practice Room',
        description: 'Working on Chopin Nocturnes',
        start_time: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        instrument: 'Piano',
        practice_goals: ['Improve left hand technique', 'Work on dynamics'],
        is_live: true,
        participants: ['2'],
        notes: null,
        end_time: null
      }
    ];
  }

  // Helper method to simulate async database operations
  async query(sql, params = []) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // This is a very simplified mock - in reality you'd parse SQL
    // For demo purposes, we'll just return appropriate mock data
    return { rows: [] };
  }

  // User operations
  async findUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  async findUserById(id) {
    return this.users.find(user => user.id === id);
  }

  async createUser(userData) {
    const newUser = {
      id: String(this.users.length + 1),
      ...userData,
      join_date: new Date(),
      is_verified: false
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id, updates) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], ...updates };
      return this.users[userIndex];
    }
    return null;
  }

  // Competition operations
  async getCompetitions(filters = {}) {
    let competitions = [...this.competitions];
    
    if (filters.active) {
      competitions = competitions.filter(c => c.is_active && new Date(c.deadline) > new Date());
    }
    
    return competitions;
  }

  // Community post operations
  async getCommunityPosts(filters = {}) {
    let posts = [...this.communityPosts];
    
    if (filters.category && filters.category !== 'All') {
      posts = posts.filter(p => p.category === filters.category);
    }
    
    // Add user information
    return posts.map(post => {
      const user = this.users.find(u => u.user_id === post.user_id);
      return {
        ...post,
        userName: user?.name || 'Unknown User',
        userAvatar: user?.name?.[0] || 'U'
      };
    });
  }

  async createCommunityPost(postData) {
    const newPost = {
      id: String(this.communityPosts.length + 1),
      ...postData,
      created_at: new Date(),
      like_count: 0,
      comment_count: 0,
      image_urls: postData.image_urls || []
    };
    this.communityPosts.unshift(newPost);
    return newPost;
  }

  // Tutorial operations
  async getTutorials(filters = {}) {
    let tutorials = [...this.tutorials];
    
    if (filters.instrument) {
      tutorials = tutorials.filter(t => t.instrument.toLowerCase() === filters.instrument.toLowerCase());
    }
    
    return tutorials;
  }

  // Marketplace operations
  async getMarketplaceItems(filters = {}) {
    let items = [...this.marketplaceItems];
    
    if (filters.category && filters.category !== 'All') {
      items = items.filter(i => i.category.toLowerCase() === filters.category.toLowerCase());
    }
    
    return items.filter(item => item.is_available);
  }

  // Practice session operations
  async getPracticeSessions(filters = {}) {
    let sessions = [...this.practiceSessions];
    
    if (filters.live) {
      sessions = sessions.filter(s => s.is_live);
    }
    
    return sessions;
  }

  async createPracticeSession(sessionData) {
    const newSession = {
      id: String(this.practiceSessions.length + 1),
      ...sessionData,
      start_time: new Date(),
      participants: [],
      end_time: null
    };
    this.practiceSessions.push(newSession);
    return newSession;
  }

  // Search operations
  async searchContent(query) {
    const lowerQuery = query.toLowerCase();
    
    const tutorials = this.tutorials.filter(t => 
      t.title.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
    
    const posts = this.communityPosts.filter(p => 
      p.title.toLowerCase().includes(lowerQuery) ||
      p.content.toLowerCase().includes(lowerQuery) ||
      p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
    
    const items = this.marketplaceItems.filter(i => 
      i.title.toLowerCase().includes(lowerQuery) ||
      i.description.toLowerCase().includes(lowerQuery) ||
      i.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
    
    return { tutorials, posts, items };
  }
}

// Export singleton instance
module.exports = new MockDatabase();