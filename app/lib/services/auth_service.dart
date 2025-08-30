import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/music_models.dart';
import 'http_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final HttpService _httpService = HttpService();
  User? _currentUser;
  String? _currentToken;

  /// Get current user
  User? get currentUser => _currentUser;

  /// Check if user is authenticated
  bool get isAuthenticated => _currentUser != null && _currentToken != null;

  /// Get stored token
  Future<String?> getToken() async {
    if (_currentToken != null) return _currentToken;
    
    final prefs = await SharedPreferences.getInstance();
    _currentToken = prefs.getString(ApiConfig.tokenKey);
    return _currentToken;
  }

  /// Get stored user ID
  Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(ApiConfig.userIdKey);
  }

  /// Store authentication data
  Future<void> _storeAuthData(String token, String userId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(ApiConfig.tokenKey, token);
    await prefs.setString(ApiConfig.userIdKey, userId);
    _currentToken = token;
  }

  /// Clear authentication data
  Future<void> _clearAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(ApiConfig.tokenKey);
    await prefs.remove(ApiConfig.userIdKey);
    await prefs.remove(ApiConfig.refreshTokenKey);
    _currentToken = null;
    _currentUser = null;
  }

  /// Register a new user
  Future<ApiResponse<User>> register({
    required String name,
    required String email,
    required String password,
    required List<String> instruments,
    required String skillLevel,
    String? bio,
  }) async {
    final response = await _httpService.post<Map<String, dynamic>>(
      '${ApiConfig.authEndpoint}/register',
      {
        'name': name,
        'email': email,
        'password': password,
        'instruments': instruments,
        'skillLevel': skillLevel,
        'bio': bio,
      },
      (data) => data,
      includeAuth: false,
    );

    if (response.success && response.data != null) {
      final userData = response.data!['user'] as Map<String, dynamic>;
      final token = response.data!['token'] as String;
      
      _currentUser = User.fromJson(userData);
      await _storeAuthData(token, _currentUser!.id);
      
      return ApiResponse.success(_currentUser!);
    }

    return ApiResponse.error(response.error ?? 'Registration failed');
  }

  /// Login user
  Future<ApiResponse<User>> login({
    required String email,
    required String password,
  }) async {
    final response = await _httpService.post<Map<String, dynamic>>(
      '${ApiConfig.authEndpoint}/login',
      {
        'email': email,
        'password': password,
      },
      (data) => data,
      includeAuth: false,
    );

    if (response.success && response.data != null) {
      final userData = response.data!['user'] as Map<String, dynamic>;
      final token = response.data!['token'] as String;
      
      _currentUser = User.fromJson(userData);
      await _storeAuthData(token, _currentUser!.id);
      
      return ApiResponse.success(_currentUser!);
    }

    return ApiResponse.error(response.error ?? 'Login failed');
  }

  /// Logout user
  Future<ApiResponse<Map<String, dynamic>>> logout() async {
    final response = await _httpService.post<Map<String, dynamic>>(
      '${ApiConfig.authEndpoint}/logout',
      {},
      (data) => data,
    );

    // Clear local data regardless of API response
    await _clearAuthData();

    if (response.success) {
      return ApiResponse.success({});
    }

    return ApiResponse.error(response.error ?? 'Logout failed');
  }

  /// Get current user profile
  Future<ApiResponse<User>> getCurrentUser() async {
    if (_currentUser != null) {
      return ApiResponse.success(_currentUser!);
    }

    final userId = await getUserId();
    if (userId == null) {
      return ApiResponse.error('User not authenticated');
    }

    final response = await _httpService.get<Map<String, dynamic>>(
      '${ApiConfig.usersEndpoint}/profile/$userId',
      (data) => data,
    );

    if (response.success && response.data != null) {
      _currentUser = User.fromJson(response.data!);
      return ApiResponse.success(_currentUser!);
    }

    return ApiResponse.error(response.error ?? 'Failed to get user profile');
  }

  /// Update user profile
  Future<ApiResponse<User>> updateProfile({
    String? name,
    String? bio,
    List<String>? instruments,
    String? skillLevel,
  }) async {
    final userId = await getUserId();
    if (userId == null) {
      return ApiResponse.error('User not authenticated');
    }

    final updateData = <String, dynamic>{};
    if (name != null) updateData['name'] = name;
    if (bio != null) updateData['bio'] = bio;
    if (instruments != null) updateData['instruments'] = instruments;
    if (skillLevel != null) updateData['skillLevel'] = skillLevel;

    final response = await _httpService.put<Map<String, dynamic>>(
      '${ApiConfig.usersEndpoint}/profile',
      updateData,
      (data) => data,
    );

    if (response.success && response.data != null) {
      _currentUser = User.fromJson(response.data!);
      return ApiResponse.success(_currentUser!);
    }

    return ApiResponse.error(response.error ?? 'Failed to update profile');
  }

  /// Change password
  Future<ApiResponse<Map<String, dynamic>>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final response = await _httpService.put<Map<String, dynamic>>(
      '${ApiConfig.authEndpoint}/change-password',
      {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      },
      (data) => data,
    );

    return response;
  }

  /// Request password reset
  Future<ApiResponse<Map<String, dynamic>>> requestPasswordReset({
    required String email,
  }) async {
    final response = await _httpService.post<Map<String, dynamic>>(
      '${ApiConfig.authEndpoint}/forgot-password',
      {'email': email},
      (data) => data,
      includeAuth: false,
    );

    return response;
  }

  /// Reset password with token
  Future<ApiResponse<Map<String, dynamic>>> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    final response = await _httpService.post<Map<String, dynamic>>(
      '${ApiConfig.authEndpoint}/reset-password',
      {
        'token': token,
        'password': newPassword,
      },
      (data) => data,
      includeAuth: false,
    );

    return response;
  }

  /// Verify email with token
  Future<ApiResponse<Map<String, dynamic>>> verifyEmail({
    required String token,
  }) async {
    final response = await _httpService.post<Map<String, dynamic>>(
      '${ApiConfig.authEndpoint}/verify-email',
      {'token': token},
      (data) => data,
      includeAuth: false,
    );

    if (response.success) {
      // Update current user verification status
      if (_currentUser != null) {
        _currentUser = _currentUser!.copyWith(isVerified: true);
      }
    }

    return response;
  }

  /// Initialize authentication state from stored data
  Future<void> initializeAuth() async {
    final token = await getToken();
    final userId = await getUserId();

    if (token != null && userId != null) {
      _currentToken = token;
      // Try to get current user profile
      await getCurrentUser();
    }
  }

  /// Upload avatar image
  Future<ApiResponse<String>> uploadAvatar(String imagePath) async {
    final response = await _httpService.uploadFile<Map<String, dynamic>>(
      '${ApiConfig.usersEndpoint}/avatar',
      imagePath,
      'avatar',
      (data) => data,
    );

    if (response.success && response.data != null) {
      final avatarUrl = response.data!['avatarUrl'] as String;
      
      // Update current user avatar
      if (_currentUser != null) {
        _currentUser = _currentUser!.copyWith(avatarUrl: avatarUrl);
      }
      
      return ApiResponse.success(avatarUrl);
    }

    return ApiResponse.error(response.error ?? 'Failed to upload avatar');
  }
}