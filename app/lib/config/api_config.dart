class ApiConfig {
  // Backend API configuration
  static const String baseUrl = 'http://localhost:5000/api';
  static const String wsUrl = 'http://localhost:5000';
  
  // API endpoints
  static const String authEndpoint = '/auth';
  static const String usersEndpoint = '/users';
  static const String competitionsEndpoint = '/competitions';
  static const String practiceEndpoint = '/practice';
  static const String communityEndpoint = '/community';
  static const String tutorialsEndpoint = '/tutorials';
  static const String marketplaceEndpoint = '/marketplace';
  
  // Request timeout configurations
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  
  // Storage keys
  static const String tokenKey = 'auth_token';
  static const String userIdKey = 'user_id';
  static const String refreshTokenKey = 'refresh_token';
}