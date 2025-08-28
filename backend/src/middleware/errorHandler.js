/**
 * Global error handling middleware
 * Handles all errors and sends appropriate responses
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userId: req.user?.id || 'anonymous'
  });

  // Default error
  let error = {
    status: 500,
    message: 'Internal server error',
    error: 'SERVER_ERROR'
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Joi validation errors
    error = {
      status: 400,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: err.details?.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  } else if (err.code === '23505') {
    // PostgreSQL unique constraint violation
    error = {
      status: 409,
      message: 'Resource already exists',
      error: 'DUPLICATE_RESOURCE'
    };
  } else if (err.code === '23503') {
    // PostgreSQL foreign key constraint violation
    error = {
      status: 400,
      message: 'Referenced resource does not exist',
      error: 'INVALID_REFERENCE'
    };
  } else if (err.code === '23502') {
    // PostgreSQL not-null constraint violation
    error = {
      status: 400,
      message: 'Required field is missing',
      error: 'MISSING_REQUIRED_FIELD'
    };
  } else if (err.name === 'JsonWebTokenError') {
    // JWT errors
    error = {
      status: 401,
      message: 'Invalid authentication token',
      error: 'INVALID_TOKEN'
    };
  } else if (err.name === 'TokenExpiredError') {
    // JWT expiration
    error = {
      status: 401,
      message: 'Authentication token has expired',
      error: 'TOKEN_EXPIRED'
    };
  } else if (err.name === 'MulterError') {
    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = {
        status: 400,
        message: 'File size exceeds the maximum allowed limit',
        error: 'FILE_TOO_LARGE'
      };
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error = {
        status: 400,
        message: 'Too many files uploaded',
        error: 'TOO_MANY_FILES'
      };
    } else {
      error = {
        status: 400,
        message: 'File upload error',
        error: 'FILE_UPLOAD_ERROR'
      };
    }
  } else if (err.type === 'entity.parse.failed') {
    // JSON parsing errors
    error = {
      status: 400,
      message: 'Invalid JSON format',
      error: 'INVALID_JSON'
    };
  } else if (err.status && err.message) {
    // Custom application errors
    error = {
      status: err.status,
      message: err.message,
      error: err.error || 'APPLICATION_ERROR'
    };
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    error.message = 'Something went wrong on our end';
  }

  // Send error response
  res.status(error.status).json({
    success: false,
    error: error.error,
    message: error.message,
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      originalError: err.message 
    })
  });
};

/**
 * Handle 404 errors for unmatched routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
};

/**
 * Async wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom application error
 */
class AppError extends Error {
  constructor(message, status = 500, error = 'APPLICATION_ERROR') {
    super(message);
    this.status = status;
    this.error = error;
    this.name = 'AppError';
  }
}

/**
 * Handle uncaught exceptions and unhandled rejections
 */
const setupGlobalErrorHandlers = () => {
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Gracefully close the server
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Gracefully close the server
    process.exit(1);
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  setupGlobalErrorHandlers
};