const { createClient } = require('redis');

// Redis client configuration
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
  }
});

// Error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('end', () => {
  console.log('❌ Redis connection ended');
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Error connecting to Redis:', error);
  }
})();

// Redis utility functions
const redisUtils = {
  // Set a key with expiration
  setex: async (key, seconds, value) => {
    try {
      await redisClient.setEx(key, seconds, JSON.stringify(value));
    } catch (error) {
      console.error('Redis setex error:', error);
    }
  },

  // Get a key
  get: async (key) => {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },

  // Delete a key
  del: async (key) => {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  },

  // Increment a counter
  incr: async (key) => {
    try {
      return await redisClient.incr(key);
    } catch (error) {
      console.error('Redis incr error:', error);
      return 0;
    }
  },

  // Set expiration on existing key
  expire: async (key, seconds) => {
    try {
      await redisClient.expire(key, seconds);
    } catch (error) {
      console.error('Redis expire error:', error);
    }
  },

  // Add to set
  sadd: async (key, ...members) => {
    try {
      await redisClient.sAdd(key, members);
    } catch (error) {
      console.error('Redis sadd error:', error);
    }
  },

  // Remove from set
  srem: async (key, ...members) => {
    try {
      await redisClient.sRem(key, members);
    } catch (error) {
      console.error('Redis srem error:', error);
    }
  },

  // Get all set members
  smembers: async (key) => {
    try {
      return await redisClient.sMembers(key);
    } catch (error) {
      console.error('Redis smembers error:', error);
      return [];
    }
  },

  // Check if member exists in set
  sismember: async (key, member) => {
    try {
      return await redisClient.sIsMember(key, member);
    } catch (error) {
      console.error('Redis sismember error:', error);
      return false;
    }
  }
};

module.exports = {
  client: redisClient,
  ...redisUtils
};