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

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/music_practice_db
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# Cloudinary (for media storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional: Stripe (for marketplace payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

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

Set the following environment variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:port/dbname
REDIS_URL=redis://host:port
JWT_SECRET=your-production-secret
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

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