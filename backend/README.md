# Music Practice Platform - Backend API

A production-ready Node.js backend API for the Music Practice Community Platform, built with Express.js, PostgreSQL, Redis, and Socket.IO.

## 🚀 Features

### Core APIs
- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **User Management**: Profiles, following/followers, search
- **Practice Tracking**: Session logging, statistics, streak tracking
- **Competitions**: Create, join, and manage music competitions
- **Community Forums**: Posts, comments, likes with media support
- **Educational Content**: Tutorial management for instructors
- **Marketplace**: Secure instrument trading with verification
- **Real-time Features**: Live practice rooms with WebSocket support

### Production Features
- **Security**: Helmet, CORS, rate limiting, input validation
- **Performance**: Redis caching, compression, database optimization
- **Monitoring**: Comprehensive logging, error handling
- **Media Storage**: Cloudinary integration for images/videos
- **File Uploads**: Secure multipart form handling
- **Database**: PostgreSQL with proper indexing and relationships

## 🛠️ Tech Stack

- **Framework**: Express.js (Node.js)
- **Database**: PostgreSQL with Redis for caching
- **Authentication**: JWT with bcrypt password hashing
- **Real-time**: Socket.IO for live features
- **Validation**: Joi for request validation
- **Media Storage**: Cloudinary for file uploads
- **Payments**: Stripe integration ready
- **Security**: Helmet, CORS, express-rate-limit

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL 12 or higher
- Redis 6 or higher
- Cloudinary account (for media storage)

## 🔧 Environment Variables

The backend requires several environment variables to function properly. These are configured through a `.env` file that you create from the provided `.env.example` template.

### Core Application Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Application environment (`development`, `production`, `test`) |
| `PORT` | No | `3000` | Port number for the Express server |

### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | - | PostgreSQL connection string (format: `postgresql://username:password@host:port/database`) |
| `REDIS_URL` | **Yes** | - | Redis connection string (format: `redis://host:port` or `redis://username:password@host:port`) |

**Database Setup Notes:**
- PostgreSQL is used for primary data storage (users, sessions, posts, etc.)
- Redis is used for caching, session storage, and real-time features
- Both databases are automatically initialized with required schemas on startup
- For production, ensure SSL connections: add `?sslmode=require` to `DATABASE_URL`

### Authentication & Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **Yes** | - | Secret key for signing JWT access tokens (minimum 32 characters) |
| `JWT_EXPIRES_IN` | No | `7d` | Access token expiration time (e.g., `15m`, `1h`, `7d`) |
| `JWT_REFRESH_SECRET` | **Yes** | - | Secret key for refresh tokens (must be different from `JWT_SECRET`) |
| `JWT_REFRESH_EXPIRES_IN` | No | `30d` | Refresh token expiration time |

**Security Best Practices:**
- Use cryptographically strong secrets: `openssl rand -base64 32`
- Keep secrets different between environments
- Never commit secrets to version control
- Consider shorter token lifetimes for high-security applications

### Media Storage (Cloudinary)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CLOUDINARY_CLOUD_NAME` | **Yes*** | - | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | **Yes*** | - | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | **Yes*** | - | Your Cloudinary API secret |

**\*** Required for file upload features (user avatars, media uploads)

**Cloudinary Setup:**
1. Create account at [cloudinary.com](https://cloudinary.com/)
2. Find credentials in your dashboard under "Account Details"
3. Used for storing user avatars, practice recordings, and community media
4. Provides automatic image optimization and transformations

### Security & Performance

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ALLOWED_ORIGINS` | **Yes** | `http://localhost:3000` | Comma-separated list of allowed CORS origins |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limiting time window in milliseconds (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Maximum requests per IP per time window |
| `MAX_FILE_SIZE` | No | `10485760` | Maximum file upload size in bytes (10MB) |
| `MAX_FILES_PER_REQUEST` | No | `5` | Maximum number of files per upload request |

**Configuration Examples:**
- Development CORS: `http://localhost:3000,http://localhost:8080`
- Production CORS: `https://yourdomain.com,https://www.yourdomain.com`
- File sizes: `10485760` = 10MB, `52428800` = 50MB

### Payment Processing (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | No | - | Stripe secret key for marketplace payments |
| `STRIPE_WEBHOOK_SECRET` | No | - | Stripe webhook endpoint secret |

**Stripe Configuration:**
- Only required if enabling marketplace features
- Use test keys (`sk_test_`) for development
- Use live keys (`sk_live_`) for production
- Webhook secret format: `whsec_` followed by secret string

### Email Configuration (Future Feature)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_HOST` | No | - | SMTP server hostname (e.g., `smtp.gmail.com`) |
| `EMAIL_PORT` | No | `587` | SMTP server port (587 for TLS, 465 for SSL) |
| `EMAIL_USER` | No | - | SMTP authentication username |
| `EMAIL_PASS` | No | - | SMTP authentication password |

**Email Setup Notes:**
- Currently prepared for future features (password reset, notifications)
- For Gmail: use App Passwords instead of account password
- Recommended: Use port 587 with TLS encryption

### Environment-Specific Examples

**Development (.env):**
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://musicuser:password@localhost:5432/music_practice_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=development-secret-key-minimum-32-chars
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

**Production (.env):**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://musicuser:strongpassword@db.example.com:5432/music_practice_prod?sslmode=require
REDIS_URL=redis://username:password@redis.example.com:6379
JWT_SECRET=production-super-secure-secret-key-64-characters-long
ALLOWED_ORIGINS=https://musicapp.com,https://www.musicapp.com
RATE_LIMIT_MAX_REQUESTS=1000
```

### Troubleshooting

**Common Issues:**

1. **Database Connection Errors:**
   - Verify PostgreSQL is running and accessible
   - Check DATABASE_URL format and credentials
   - Ensure database exists before starting the app

2. **Redis Connection Errors:**
   - Verify Redis server is running
   - Check REDIS_URL format
   - For cloud Redis, ensure firewall allows connections

3. **JWT Token Issues:**
   - Ensure JWT_SECRET is at least 32 characters
   - JWT_REFRESH_SECRET must be different from JWT_SECRET
   - Check token expiration times match your needs

4. **File Upload Failures:**
   - Verify Cloudinary credentials are correct
   - Check MAX_FILE_SIZE allows your file sizes
   - Ensure Cloudinary account has sufficient quota

5. **CORS Errors:**
   - Add your frontend domain to ALLOWED_ORIGINS
   - Include both `http://` and `https://` if needed
   - For development, include all local server ports

## ⚡ Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Configure your `.env` file with the required settings. See the **[Environment Variables](#🔧-environment-variables)** section above for detailed explanations of each variable.

**Minimum required configuration for development:**

```env
# Core settings
NODE_ENV=development
PORT=3000

# Database connections (REQUIRED)
DATABASE_URL=postgresql://username:password@localhost:5432/music_practice_db
REDIS_URL=redis://localhost:6379

# Authentication secrets (REQUIRED - use strong random strings)
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
JWT_REFRESH_SECRET=your-different-refresh-token-secret-here

# Media storage (REQUIRED for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS configuration (REQUIRED for web frontend)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

**Important:** 
- Replace all placeholder values with your actual configuration
- Generate strong secrets using: `openssl rand -base64 32`
- Never commit your `.env` file to version control

### 3. Database Setup

The application will automatically create all necessary tables on startup. Make sure PostgreSQL is running and the database exists.

### 4. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/change-password` - Change password
- `GET /auth/me` - Get current user info

#### Users
- `GET /users/profile/:userId` - Get user profile
- `PUT /users/profile` - Update own profile
- `POST /users/avatar` - Upload avatar image
- `POST /users/follow/:userId` - Follow user
- `DELETE /users/follow/:userId` - Unfollow user
- `GET /users/search` - Search users

#### Practice Sessions
- `GET /practice/sessions` - Get user's practice sessions
- `POST /practice/sessions` - Log new practice session
- `GET /practice/sessions/:sessionId` - Get specific session
- `PUT /practice/sessions/:sessionId` - Update session
- `DELETE /practice/sessions/:sessionId` - Delete session
- `GET /practice/stats` - Get practice statistics

#### Competitions
- `GET /competitions` - List competitions with filters
- `GET /competitions/:competitionId` - Get competition details
- `POST /competitions` - Create competition (instructors only)
- `PUT /competitions/:competitionId` - Update competition
- `POST /competitions/:competitionId/enter` - Enter competition
- `GET /competitions/:competitionId/entries` - Get leaderboard
- `DELETE /competitions/:competitionId/enter` - Withdraw from competition

#### Community
- `GET /community/posts` - Get community posts
- `POST /community/posts` - Create new post
- `GET /community/posts/:postId` - Get specific post
- `PUT /community/posts/:postId` - Update post
- `DELETE /community/posts/:postId` - Delete post
- `POST /community/posts/:postId/like` - Like/unlike post
- `GET /community/posts/:postId/comments` - Get comments
- `POST /community/posts/:postId/comments` - Add comment

#### Tutorials
- `GET /tutorials` - List tutorials with filters
- `GET /tutorials/:tutorialId` - Get tutorial details
- `POST /tutorials` - Create tutorial (instructors only)
- `PUT /tutorials/:tutorialId` - Update tutorial
- `DELETE /tutorials/:tutorialId` - Delete tutorial
- `GET /tutorials/featured` - Get featured tutorials

#### Marketplace
- `GET /marketplace/items` - List marketplace items
- `GET /marketplace/items/:itemId` - Get item details
- `POST /marketplace/items` - List new item
- `PUT /marketplace/items/:itemId` - Update item
- `DELETE /marketplace/items/:itemId` - Delete item
- `GET /marketplace/my-items` - Get user's listed items
- `GET /marketplace/categories` - Get categories with counts

### Real-time Events (Socket.IO)

Connect to Socket.IO with authentication:
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

#### Practice Room Events
- `join_practice_room` - Join a practice room
- `leave_practice_room` - Leave a practice room
- `practice_room_message` - Send message in room
- `practice_feedback` - Give feedback to another user

#### Practice Session Events
- `start_practice_session` - Start tracking practice session
- `end_practice_session` - End practice session

## 🗃️ Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - User profiles and authentication
- **competitions** - Music competition data
- **competition_entries** - User competition submissions
- **practice_sessions** - Individual practice session logs
- **community_posts** - Forum posts with categories
- **post_comments** - Nested comments on posts
- **post_likes** - Like tracking for posts
- **tutorials** - Educational video content
- **marketplace_items** - Instrument listings for sale
- **user_follows** - User following relationships
- **practice_rooms** - Live practice room sessions
- **room_participants** - Room membership tracking

## 🔒 Security Features

- **JWT Authentication** with refresh token rotation
- **Password Hashing** using bcrypt with salt rounds
- **Input Validation** using Joi schemas
- **Rate Limiting** to prevent abuse
- **CORS Protection** with configurable origins
- **Helmet** security headers
- **SQL Injection Protection** via parameterized queries
- **File Upload Security** with type and size validation

## 📊 Performance Optimizations

- **Redis Caching** for sessions and frequently accessed data
- **Database Indexing** on commonly queried fields
- **Connection Pooling** for database connections
- **Compression** middleware for response optimization
- **Lazy Loading** with pagination on all list endpoints
- **Image Optimization** via Cloudinary transformations

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 🚀 Deployment

### Environment Variables for Production

For production deployment, configure all required environment variables with production-appropriate values. See the **[Environment Variables](#🔧-environment-variables)** section for complete details.

**Critical production considerations:**

```env
# Use production environment
NODE_ENV=production

# Secure database connections with SSL
DATABASE_URL=postgresql://user:pass@host:port/dbname?sslmode=require
REDIS_URL=redis://username:password@redis-host:port

# Strong, unique secrets (minimum 32 characters)
JWT_SECRET=your-production-secret-64-characters-minimum
JWT_REFRESH_SECRET=your-different-production-refresh-secret

# Production Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your-production-cloud
CLOUDINARY_API_KEY=your-production-key
CLOUDINARY_API_SECRET=your-production-secret

# Restrict CORS to your actual domains
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Production-appropriate rate limits
RATE_LIMIT_MAX_REQUESTS=1000
```

**Security Checklist:**
- [ ] Use environment-specific secrets (different from development)
- [ ] Enable SSL/TLS for all database connections
- [ ] Restrict CORS origins to your actual domains
- [ ] Use strong passwords and restricted database users
- [ ] Rotate secrets regularly
- [ ] Monitor logs for security issues

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Health Check

The API provides a health check endpoint:
```
GET /health
```

Returns server status, timestamp, and environment information.

## 🤝 Integration with Flutter App

The backend is designed to work seamlessly with the Flutter frontend:

1. **Matching Models**: Database schema matches Flutter model classes
2. **JSON Serialization**: All responses use camelCase to match Flutter conventions
3. **Error Handling**: Consistent error response format
4. **File Uploads**: Support for multipart forms from Flutter
5. **Real-time**: Socket.IO integration for live features

### Flutter Integration Example

```dart
// Update the MusicDataService in your Flutter app
class MusicDataService {
  static const String baseUrl = 'http://your-server.com/api';
  
  // Replace sample data methods with actual API calls
  static Future<List<Competition>> getCompetitions() async {
    final response = await http.get(Uri.parse('$baseUrl/competitions'));
    // Handle response and convert to Competition objects
  }
}
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation above
- Review the error response format
- Ensure all environment variables are set correctly
- Verify database and Redis connections

## 🔄 API Response Format

All API responses follow this consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": [
    // Additional error details if applicable
  ]
}
```

This backend provides a solid, production-ready foundation for the Music Practice Community Platform with comprehensive features, security, and scalability built-in.