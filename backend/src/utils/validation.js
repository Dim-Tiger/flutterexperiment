const Joi = require('joi');

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a Joi schema
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all validation errors
      stripUnknown: true, // Remove unknown fields
      convert: true // Convert types when possible
    });

    if (error) {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.details = error.details;
      return next(validationError);
    }

    // Replace the original data with validated/sanitized data
    req[property] = value;
    next();
  };
};

// Common validation schemas
const commonSchemas = {
  // UUID validation
  uuid: Joi.string().uuid().required(),
  
  // Email validation
  email: Joi.string().email().lowercase().required(),
  
  // Password validation
  password: Joi.string().min(8).max(128).pattern(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  ).required().messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  }),

  // Pagination
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('created_at', 'updated_at', 'name', 'title').default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  },

  // File upload
  file: {
    mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4', 'video/webm'),
    size: Joi.number().max(10 * 1024 * 1024) // 10MB max
  },

  // Skill levels
  skillLevel: Joi.string().valid('Beginner', 'Intermediate', 'Advanced').default('Beginner'),

  // Instruments
  instrument: Joi.string().valid(
    'Guitar', 'Piano', 'Drums', 'Violin', 'Bass', 'Saxophone', 'Trumpet', 
    'Flute', 'Clarinet', 'Cello', 'Vocals', 'Ukulele', 'Harmonica', 'Other'
  )
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: commonSchemas.email,
    password: commonSchemas.password,
    confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
      'any.only': 'Passwords do not match'
    }),
    instruments: Joi.array().items(commonSchemas.instrument).max(5).default([]),
    skillLevel: commonSchemas.skillLevel,
    bio: Joi.string().max(500).allow('').default('')
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100),
    bio: Joi.string().max(500).allow(''),
    instruments: Joi.array().items(commonSchemas.instrument).max(5),
    skillLevel: commonSchemas.skillLevel
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonSchemas.password,
    confirmPassword: Joi.string().required().valid(Joi.ref('newPassword')).messages({
      'any.only': 'Passwords do not match'
    })
  })
};

// Competition validation schemas
const competitionSchemas = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().max(2000).required(),
    genre: Joi.string().max(100),
    skillLevel: commonSchemas.skillLevel,
    instrument: commonSchemas.instrument,
    startDate: Joi.date().iso().greater('now').required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    prizeDescription: Joi.string().max(500),
    maxParticipants: Joi.number().integer().min(2).max(1000),
    entryFee: Joi.number().min(0).max(10000).default(0)
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(200),
    description: Joi.string().max(2000),
    genre: Joi.string().max(100),
    skillLevel: commonSchemas.skillLevel,
    instrument: commonSchemas.instrument,
    prizeDescription: Joi.string().max(500),
    maxParticipants: Joi.number().integer().min(2).max(1000)
  }),

  submitEntry: Joi.object({
    submissionUrl: Joi.string().uri().required(),
    submissionDescription: Joi.string().max(1000)
  })
};

// Practice session validation schemas
const practiceSchemas = {
  create: Joi.object({
    instrument: commonSchemas.instrument.required(),
    durationMinutes: Joi.number().integer().min(1).max(480).required(), // Max 8 hours
    goals: Joi.array().items(Joi.string().max(200)).max(10).default([]),
    notes: Joi.string().max(1000).allow('').default(''),
    sessionDate: Joi.date().iso().max('now').default(() => new Date())
  }),

  update: Joi.object({
    goals: Joi.array().items(Joi.string().max(200)).max(10),
    notes: Joi.string().max(1000).allow('')
  })
};

// Community post validation schemas
const communitySchemas = {
  createPost: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    content: Joi.string().min(10).max(10000).required(),
    category: Joi.string().valid('Tips', 'Questions', 'Technique', 'Inspiration', 'Gear').required(),
    mediaUrls: Joi.array().items(Joi.string().uri()).max(5).default([])
  }),

  updatePost: Joi.object({
    title: Joi.string().min(5).max(200),
    content: Joi.string().min(10).max(10000),
    category: Joi.string().valid('Tips', 'Questions', 'Technique', 'Inspiration', 'Gear'),
    mediaUrls: Joi.array().items(Joi.string().uri()).max(5)
  }),

  createComment: Joi.object({
    content: Joi.string().min(1).max(2000).required(),
    parentCommentId: Joi.string().uuid().allow(null)
  })
};

// Tutorial validation schemas
const tutorialSchemas = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().max(2000),
    videoUrl: Joi.string().uri().required(),
    thumbnailUrl: Joi.string().uri(),
    instrument: commonSchemas.instrument.required(),
    skillLevel: commonSchemas.skillLevel,
    durationMinutes: Joi.number().integer().min(1).max(300) // Max 5 hours
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(200),
    description: Joi.string().max(2000),
    videoUrl: Joi.string().uri(),
    thumbnailUrl: Joi.string().uri(),
    instrument: commonSchemas.instrument,
    skillLevel: commonSchemas.skillLevel,
    durationMinutes: Joi.number().integer().min(1).max(300),
    isFeatured: Joi.boolean()
  })
};

// Marketplace validation schemas
const marketplaceSchemas = {
  createItem: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(20).max(5000).required(),
    price: Joi.number().min(0.01).max(1000000).required(),
    currency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD', 'AUD').default('USD'),
    category: commonSchemas.instrument.required(),
    condition: Joi.string().valid('New', 'Like New', 'Good', 'Fair').required(),
    brand: Joi.string().max(100),
    model: Joi.string().max(100),
    yearManufactured: Joi.number().integer().min(1900).max(new Date().getFullYear()),
    serialNumber: Joi.string().max(100),
    imagesUrls: Joi.array().items(Joi.string().uri()).min(1).max(10).required(),
    location: Joi.string().max(255),
    shippingAvailable: Joi.boolean().default(true)
  }),

  updateItem: Joi.object({
    title: Joi.string().min(5).max(200),
    description: Joi.string().min(20).max(5000),
    price: Joi.number().min(0.01).max(1000000),
    condition: Joi.string().valid('New', 'Like New', 'Good', 'Fair'),
    brand: Joi.string().max(100),
    model: Joi.string().max(100),
    yearManufactured: Joi.number().integer().min(1900).max(new Date().getFullYear()),
    location: Joi.string().max(255),
    shippingAvailable: Joi.boolean(),
    status: Joi.string().valid('available', 'sold', 'reserved')
  })
};

// Practice room validation schemas
const practiceRoomSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500),
    maxParticipants: Joi.number().integer().min(2).max(50).default(10),
    roomType: Joi.string().valid('open', 'private', 'instructor-led').default('open'),
    scheduledStart: Joi.date().iso().greater('now'),
    scheduledEnd: Joi.date().iso().greater(Joi.ref('scheduledStart'))
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().max(500),
    maxParticipants: Joi.number().integer().min(2).max(50),
    roomType: Joi.string().valid('open', 'private', 'instructor-led'),
    isActive: Joi.boolean()
  })
};

module.exports = {
  validate,
  schemas: {
    common: commonSchemas,
    user: userSchemas,
    competition: competitionSchemas,
    practice: practiceSchemas,
    community: communitySchemas,
    tutorial: tutorialSchemas,
    marketplace: marketplaceSchemas,
    practiceRoom: practiceRoomSchemas
  }
};