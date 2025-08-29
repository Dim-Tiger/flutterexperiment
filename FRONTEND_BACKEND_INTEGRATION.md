# Frontend-Backend Integration Guide

## 🔍 Current Integration Status

### ✅ **Backend API**: Production Ready
The Node.js backend is **fully implemented and production-ready** with:

- **Complete API Routes**: Authentication, users, competitions, practice, community, tutorials, marketplace
- **Security Features**: JWT authentication, rate limiting, CORS, input validation
- **Database Integration**: PostgreSQL with proper schema and indexing
- **Real-time Support**: Socket.IO for live features
- **File Upload**: Cloudinary integration for media storage
- **Error Handling**: Consistent error response format
- **Production Features**: Logging, monitoring, graceful shutdown

### ⚠️ **Frontend Integration**: Currently Using Sample Data
The Flutter app is **architecturally ready** but currently uses mock data:

- **Models Defined**: All data models match backend schema
- **UI Complete**: All screens and components implemented  
- **Sample Data Service**: `MusicDataService` provides mock data
- **No API Integration**: HTTP requests not implemented yet

## 🔗 How Frontend and Backend Should Communicate

### 1. API Communication Architecture

```
Flutter App (Frontend)
    ↕ HTTP/HTTPS Requests
Backend API Server (Node.js + Express)
    ↕ Database Queries  
PostgreSQL Database + Redis Cache
```

### 2. Base Configuration

The Flutter app should connect to the backend using:

```dart
// lib/services/api_config.dart
class ApiConfig {
  static const String baseUrl = 'https://your-api-domain.com/api';  // Production
  static const String devUrl = 'http://localhost:3000/api';         // Development
  static const String socketUrl = 'https://your-api-domain.com';    // WebSocket
  
  static String get apiUrl => 
    const bool.fromEnvironment('dart.vm.product') ? baseUrl : devUrl;
}
```

### 3. API Response Format

All backend responses follow this consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data here
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

## 📡 API Endpoints and Flutter Integration

### Authentication Flow

#### Backend Endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile

#### Flutter Implementation:
```dart
// lib/services/auth_service.dart
class AuthService {
  static Future<User?> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.apiUrl}/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'email': email, 'password': password}),
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success']) {
        // Store JWT token
        await _storeToken(data['data']['token']);
        return User.fromJson(data['data']['user']);
      }
    }
    throw AuthException('Login failed');
  }
}
```

### Core Data Operations

#### 1. Competitions

**Backend Endpoints:**
- `GET /api/competitions` - List competitions with filters
- `GET /api/competitions/:id` - Get competition details
- `POST /api/competitions` - Create competition (instructors only)
- `POST /api/competitions/:id/enter` - Enter competition
- `GET /api/competitions/:id/entries` - Get leaderboard

**Flutter Implementation:**
```dart
// Update lib/services/music_data_service.dart
class MusicDataService {
  static Future<List<Competition>> getCompetitions({
    String? status,
    String? genre,
    String? skillLevel,
    String? instrument,
  }) async {
    final queryParams = <String, String>{};
    if (status != null) queryParams['status'] = status;
    if (genre != null) queryParams['genre'] = genre;
    // ... add other params
    
    final uri = Uri.parse('${ApiConfig.apiUrl}/competitions')
        .replace(queryParameters: queryParams);
    
    final response = await http.get(uri, headers: _getAuthHeaders());
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success']) {
        return (data['data']['competitions'] as List)
            .map((json) => Competition.fromJson(json))
            .toList();
      }
    }
    throw ApiException('Failed to load competitions');
  }
}
```

#### 2. Practice Sessions

**Backend Endpoints:**
- `GET /api/practice/sessions` - Get user's practice sessions
- `POST /api/practice/sessions` - Log new practice session
- `GET /api/practice/stats` - Get practice statistics
- `GET /api/practice/goals` - Get practice goals

**Flutter Implementation:**
```dart
class PracticeService {
  static Future<List<PracticeSession>> getSessions({
    DateTime? startDate,
    DateTime? endDate,
    String? instrument,
  }) async {
    // Similar implementation to competitions
  }
  
  static Future<PracticeSession> logSession(PracticeSession session) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.apiUrl}/practice/sessions'),
      headers: _getAuthHeaders(),
      body: json.encode(session.toJson()),
    );
    // Handle response
  }
}
```

#### 3. Community Posts

**Backend Endpoints:**
- `GET /api/community/posts` - List posts with filters
- `POST /api/community/posts` - Create new post
- `POST /api/community/posts/:id/like` - Like/unlike post
- `GET /api/community/posts/:id/comments` - Get post comments

#### 4. Tutorials

**Backend Endpoints:**
- `GET /api/tutorials` - List tutorials with filters
- `GET /api/tutorials/:id` - Get tutorial details
- `POST /api/tutorials/:id/enroll` - Enroll in tutorial

#### 5. Marketplace

**Backend Endpoints:**
- `GET /api/marketplace/items` - List marketplace items
- `POST /api/marketplace/items` - Create new listing
- `GET /api/marketplace/items/:id` - Get item details

## 🔐 Authentication & Security

### JWT Token Management

```dart
// lib/services/token_service.dart
class TokenService {
  static const String _tokenKey = 'jwt_token';
  static const String _refreshTokenKey = 'refresh_token';
  
  static Future<void> saveTokens(String token, String refreshToken) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_refreshTokenKey, refreshToken);
  }
  
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }
  
  static Map<String, String> getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${getToken()}',
    };
  }
}
```

### Security Headers

All API requests should include:
```dart
final headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer $token',
  'User-Agent': 'MusicPracticeApp/1.0',
};
```

## ⚡ Real-time Communication (Socket.IO)

### Backend WebSocket Events:
- `practice_session_joined` - User joins practice session
- `practice_session_left` - User leaves practice session  
- `new_comment` - New comment on community post
- `competition_update` - Competition status changes

### Flutter Socket Implementation:

```dart
// lib/services/socket_service.dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  static IO.Socket? _socket;
  
  static void connect() {
    _socket = IO.io(ApiConfig.socketUrl, <String, dynamic>{
      'transports': ['websocket'],
      'extraHeaders': {'Authorization': 'Bearer ${TokenService.getToken()}'}
    });
    
    _socket?.on('connect', (_) => print('Connected to server'));
    _socket?.on('practice_session_update', (data) {
      // Handle practice session updates
    });
  }
  
  static void joinPracticeSession(String sessionId) {
    _socket?.emit('join_practice_session', {'sessionId': sessionId});
  }
}
```

## 📁 File Upload Implementation

### Backend File Upload:
The backend supports file uploads via Cloudinary for:
- User profile pictures
- Community post images/videos
- Marketplace item photos
- Tutorial thumbnails

### Flutter File Upload:

```dart
// lib/services/file_upload_service.dart
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

class FileUploadService {
  static Future<String> uploadImage(File imageFile, String uploadType) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${ApiConfig.apiUrl}/upload'),
    );
    
    request.headers.addAll(TokenService.getAuthHeaders());
    request.fields['upload_type'] = uploadType;
    
    request.files.add(await http.MultipartFile.fromPath(
      'file',
      imageFile.path,
      contentType: MediaType('image', 'jpeg'),
    ));
    
    final response = await request.send();
    final responseData = await response.stream.bytesToString();
    final data = json.decode(responseData);
    
    if (data['success']) {
      return data['data']['url'];
    }
    throw FileUploadException('Upload failed');
  }
}
```

## 🚀 Steps to Make This Production Ready

### Phase 1: Connect Flutter to Backend API

#### 1.1 Replace Sample Data Service
```bash
# Current: lib/services/music_data_service.dart (sample data)
# Replace with: Real API calls to backend endpoints
```

**Tasks:**
- [ ] Create `ApiService` base class for HTTP communication
- [ ] Implement authentication service with JWT handling
- [ ] Replace all `getSample*()` methods with real API calls
- [ ] Add proper error handling and exception classes
- [ ] Implement request/response interceptors for logging
- [ ] Add retry logic for failed requests

#### 1.2 Add HTTP Client Dependencies
```yaml
# pubspec.yaml
dependencies:
  http: ^0.13.5
  shared_preferences: ^2.0.15
  socket_io_client: ^2.0.2
```

#### 1.3 Environment Configuration
```dart
// lib/config/environment.dart
class Environment {
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:3000/api',
  );
}
```

### Phase 2: Implement Authentication Flow

#### 2.1 Login/Registration Screens
- [ ] Connect login form to `POST /api/auth/login`
- [ ] Connect registration form to `POST /api/auth/register`
- [ ] Implement JWT token storage and management
- [ ] Add automatic token refresh logic
- [ ] Implement logout functionality

#### 2.2 Protected Routes
- [ ] Add authentication middleware for protected screens
- [ ] Implement auto-redirect to login when token expires
- [ ] Add loading states during authentication

### Phase 3: Real-time Features

#### 3.1 Socket.IO Integration
- [ ] Connect to backend WebSocket server
- [ ] Implement practice session real-time updates
- [ ] Add real-time community post notifications
- [ ] Implement live chat for practice sessions

#### 3.2 Background Sync
- [ ] Implement offline data caching
- [ ] Add background sync when connection restored
- [ ] Handle network connectivity changes

### Phase 4: File Upload Implementation

#### 4.1 Media Upload
- [ ] Connect image picker to Cloudinary upload endpoint
- [ ] Implement progress indicators for uploads
- [ ] Add image compression before upload
- [ ] Implement video upload for tutorials

### Phase 5: Error Handling & UX

#### 5.1 Error Management
- [ ] Create centralized error handling service
- [ ] Add user-friendly error messages
- [ ] Implement retry mechanisms
- [ ] Add offline mode indicators

#### 5.2 Loading States
- [ ] Add skeleton loading screens
- [ ] Implement pull-to-refresh functionality
- [ ] Add infinite scroll for lists

### Phase 6: Performance Optimization

#### 6.1 Caching Strategy
- [ ] Implement local data caching with Hive/SQLite
- [ ] Add cache invalidation logic
- [ ] Implement background refresh

#### 6.2 API Optimization  
- [ ] Add request debouncing for search
- [ ] Implement pagination for all list endpoints
- [ ] Add data compression for large responses

### Phase 7: Security Enhancements

#### 7.1 Security Implementation
- [ ] Add certificate pinning for HTTPS
- [ ] Implement biometric authentication
- [ ] Add request signing for sensitive operations
- [ ] Implement proper secret management

#### 7.2 Data Protection
- [ ] Encrypt sensitive data in local storage
- [ ] Implement secure token storage
- [ ] Add data encryption for file uploads

### Phase 8: Production Deployment

#### 8.1 Backend Deployment
```bash
# Production environment variables needed:
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/dbname
REDIS_URL=redis://host:port
JWT_SECRET=your-super-secure-production-secret
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

**Deployment Options:**
- [ ] **Heroku**: Easy deployment with PostgreSQL and Redis add-ons
- [ ] **Railway**: Modern deployment with GitHub integration  
- [ ] **DigitalOcean**: VPS with full control
- [ ] **AWS**: Scalable with EC2, RDS, and ElastiCache
- [ ] **Docker**: Container deployment anywhere

#### 8.2 Frontend Deployment
- [ ] **Flutter Web**: Deploy to Netlify, Vercel, or Firebase Hosting
- [ ] **Flutter Mobile**: Build and publish to App Store/Play Store
- [ ] **Progressive Web App**: Add PWA manifest and service worker

#### 8.3 Infrastructure Setup
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Configure CDN for static assets
- [ ] Set up monitoring and logging (Sentry, LogRocket)
- [ ] Implement automated backups
- [ ] Set up CI/CD pipeline

### Phase 9: Monitoring & Analytics

#### 9.1 Application Monitoring
- [ ] Add crash reporting (Crashlytics, Sentry)
- [ ] Implement performance monitoring
- [ ] Add user analytics
- [ ] Set up API monitoring and alerts

#### 9.2 Business Intelligence
- [ ] Add user engagement tracking
- [ ] Implement conversion analytics
- [ ] Set up A/B testing framework

## 🔧 Development Setup for Integration

### 1. Start Backend Server
```bash
cd backend
npm install
cp .env.example .env
# Configure .env with your database settings
npm run dev
```

### 2. Update Flutter App Configuration
```dart
// lib/config/api_config.dart
class ApiConfig {
  static const String baseUrl = 'http://10.0.2.2:3000/api'; // Android emulator
  // static const String baseUrl = 'http://localhost:3000/api'; // iOS simulator
}
```

### 3. Test Integration
```bash
# Test backend health
curl http://localhost:3000/health

# Test API endpoint
curl http://localhost:3000/api/competitions

# Run Flutter app
cd app
flutter run
```

## 📋 Production Readiness Checklist

### Backend Infrastructure ✅
- [x] Production-ready API with all endpoints
- [x] PostgreSQL database with proper schema
- [x] Redis caching implementation
- [x] JWT authentication with refresh tokens
- [x] Input validation and sanitization
- [x] Rate limiting and security headers
- [x] Error handling and logging
- [x] File upload with Cloudinary
- [x] WebSocket support for real-time features
- [x] Health check endpoints
- [x] Graceful shutdown handling

### Frontend Integration ⚠️
- [ ] Replace sample data with real API calls
- [ ] Implement authentication flow
- [ ] Add HTTP client with proper error handling
- [ ] Implement real-time socket connection
- [ ] Add file upload functionality
- [ ] Implement offline caching
- [ ] Add loading states and error handling
- [ ] Implement token management and refresh
- [ ] Add environment configuration
- [ ] Implement security measures

### Production Infrastructure
- [ ] Deploy backend to production server
- [ ] Set up production database and Redis
- [ ] Configure SSL certificates
- [ ] Set up monitoring and logging
- [ ] Implement backup strategy
- [ ] Configure CDN for assets
- [ ] Set up CI/CD pipeline
- [ ] Deploy Flutter app (web/mobile)

### Security & Performance
- [ ] Implement rate limiting on client side
- [ ] Add request/response encryption
- [ ] Implement proper error boundaries
- [ ] Add performance monitoring
- [ ] Implement analytics tracking
- [ ] Add crash reporting
- [ ] Optimize bundle size and loading times

## 🎯 Next Steps

1. **Start with Authentication**: Implement login/registration flow first
2. **Replace Sample Data**: One endpoint at a time, starting with competitions
3. **Add Real-time Features**: Implement WebSocket connections
4. **Test Thoroughly**: Use the backend health check and API testing
5. **Deploy Incrementally**: Start with development environment, then staging, then production

This integration guide provides a complete roadmap from the current state (sample data) to a fully production-ready application with real backend integration.