import 'package:flutter/foundation.dart';
import '../models/music_models.dart';
import '../services/auth_service.dart';
import '../services/music_data_service.dart';
import '../services/websocket_service.dart';
import '../services/http_service.dart';

class AppState with ChangeNotifier {
  static final AppState _instance = AppState._internal();
  factory AppState() => _instance;
  AppState._internal();

  // Services
  final AuthService _authService = AuthService();
  final MusicDataService _dataService = MusicDataService();
  final WebSocketService _wsService = WebSocketService();

  // Authentication state
  User? _currentUser;
  bool _isAuthenticated = false;
  bool _isLoading = false;

  // Data state
  List<Competition> _competitions = [];
  List<CommunityPost> _communityPosts = [];
  List<Tutorial> _tutorials = [];
  List<MarketplaceItem> _marketplaceItems = [];
  List<PracticeSession> _practiceSessions = [];
  List<Instructor> _instructors = [];

  // UI state
  String? _errorMessage;
  bool _isOnline = true;

  // Getters
  User? get currentUser => _currentUser;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isOnline => _isOnline;

  List<Competition> get competitions => _competitions;
  List<CommunityPost> get communityPosts => _communityPosts;
  List<Tutorial> get tutorials => _tutorials;
  List<MarketplaceItem> get marketplaceItems => _marketplaceItems;
  List<PracticeSession> get practiceSessions => _practiceSessions;
  List<Instructor> get instructors => _instructors;

  /// Initialize the app state
  Future<void> initialize() async {
    _setLoading(true);
    try {
      // Initialize authentication
      await _authService.initializeAuth();
      _currentUser = _authService.currentUser;
      _isAuthenticated = _authService.isAuthenticated;

      // Connect WebSocket if authenticated
      if (_isAuthenticated) {
        await _wsService.connect();
        _setupWebSocketCallbacks();
      }

      // Load initial data
      await _loadInitialData();
    } catch (e) {
      _setError('Failed to initialize app: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Set up WebSocket event callbacks
  void _setupWebSocketCallbacks() {
    _wsService.setEventCallbacks(
      onPracticeSessionUpdate: (session) {
        _updatePracticeSession(session);
      },
      onNewCommunityPost: (postData) {
        _addNewCommunityPost(postData);
      },
      onPostLikeUpdate: (postId, likeCount) {
        _updatePostLikeCount(postId, likeCount);
      },
    );
  }

  /// Load initial data for the app
  Future<void> _loadInitialData() async {
    await Future.wait([
      loadCompetitions(),
      loadCommunityPosts(),
      loadTutorials(),
      loadMarketplaceItems(),
      loadPracticeSessions(),
      loadInstructors(),
    ]);
  }

  /// Authentication methods
  Future<bool> login(String email, String password) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await _authService.login(email: email, password: password);
      
      if (response.success && response.data != null) {
        _currentUser = response.data;
        _isAuthenticated = true;
        
        // Connect WebSocket
        await _wsService.connect();
        _setupWebSocketCallbacks();
        
        // Load user-specific data
        await _loadInitialData();
        
        notifyListeners();
        return true;
      } else {
        _setError(response.error ?? 'Login failed');
        return false;
      }
    } catch (e) {
      _setError('Login failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    required List<String> instruments,
    required String skillLevel,
    String? bio,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final response = await _authService.register(
        name: name,
        email: email,
        password: password,
        instruments: instruments,
        skillLevel: skillLevel,
        bio: bio,
      );
      
      if (response.success && response.data != null) {
        _currentUser = response.data;
        _isAuthenticated = true;
        
        // Connect WebSocket
        await _wsService.connect();
        _setupWebSocketCallbacks();
        
        notifyListeners();
        return true;
      } else {
        _setError(response.error ?? 'Registration failed');
        return false;
      }
    } catch (e) {
      _setError('Registration failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    _setLoading(true);
    
    try {
      await _authService.logout();
      _wsService.disconnect();
      
      _currentUser = null;
      _isAuthenticated = false;
      _clearData();
      
      notifyListeners();
    } catch (e) {
      _setError('Logout failed: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Data loading methods
  Future<void> loadCompetitions({bool refresh = false}) async {
    if (!refresh && _competitions.isNotEmpty) return;
    
    try {
      final response = await _dataService.getActiveCompetitions();
      if (response.success && response.data != null) {
        _competitions = response.data!;
        notifyListeners();
      } else {
        _setError(response.error ?? 'Failed to load competitions');
      }
    } catch (e) {
      _setError('Failed to load competitions: $e');
    }
  }

  Future<void> loadCommunityPosts({bool refresh = false}) async {
    if (!refresh && _communityPosts.isNotEmpty) return;
    
    try {
      final response = await _dataService.getCommunityPosts();
      if (response.success && response.data != null) {
        _communityPosts = response.data!;
        notifyListeners();
      } else {
        _setError(response.error ?? 'Failed to load community posts');
      }
    } catch (e) {
      _setError('Failed to load community posts: $e');
    }
  }

  Future<void> loadTutorials({bool refresh = false}) async {
    if (!refresh && _tutorials.isNotEmpty) return;
    
    try {
      final response = await _dataService.getTutorials();
      if (response.success && response.data != null) {
        _tutorials = response.data!;
        notifyListeners();
      } else {
        _setError(response.error ?? 'Failed to load tutorials');
      }
    } catch (e) {
      _setError('Failed to load tutorials: $e');
    }
  }

  Future<void> loadMarketplaceItems({bool refresh = false}) async {
    if (!refresh && _marketplaceItems.isNotEmpty) return;
    
    try {
      final response = await _dataService.getAvailableMarketplaceItems();
      if (response.success && response.data != null) {
        _marketplaceItems = response.data!;
        notifyListeners();
      } else {
        _setError(response.error ?? 'Failed to load marketplace items');
      }
    } catch (e) {
      _setError('Failed to load marketplace items: $e');
    }
  }

  Future<void> loadPracticeSessions({bool refresh = false}) async {
    if (!refresh && _practiceSessions.isNotEmpty) return;
    
    try {
      final response = await _dataService.getLivePracticeSessions();
      if (response.success && response.data != null) {
        _practiceSessions = response.data!;
        notifyListeners();
      } else {
        _setError(response.error ?? 'Failed to load practice sessions');
      }
    } catch (e) {
      _setError('Failed to load practice sessions: $e');
    }
  }

  Future<void> loadInstructors({bool refresh = false}) async {
    if (!refresh && _instructors.isNotEmpty) return;
    
    try {
      final response = await _dataService.getInstructors();
      if (response.success && response.data != null) {
        _instructors = response.data!;
        notifyListeners();
      } else {
        _setError(response.error ?? 'Failed to load instructors');
      }
    } catch (e) {
      _setError('Failed to load instructors: $e');
    }
  }

  /// Search methods
  Future<Map<String, List<dynamic>>> searchContent(String query) async {
    try {
      final response = await _dataService.searchContent(query);
      if (response.success && response.data != null) {
        return response.data!;
      } else {
        _setError(response.error ?? 'Search failed');
        return {};
      }
    } catch (e) {
      _setError('Search failed: $e');
      return {};
    }
  }

  /// Community interaction methods
  Future<bool> createCommunityPost({
    required String title,
    required String content,
    required String category,
    List<String>? tags,
    List<String>? imageUrls,
  }) async {
    try {
      final response = await _dataService.createCommunityPost(
        title: title,
        content: content,
        category: category,
        tags: tags,
        imageUrls: imageUrls,
      );
      
      if (response.success && response.data != null) {
        _communityPosts.insert(0, response.data!);
        notifyListeners();
        return true;
      } else {
        _setError(response.error ?? 'Failed to create post');
        return false;
      }
    } catch (e) {
      _setError('Failed to create post: $e');
      return false;
    }
  }

  Future<void> toggleLikePost(String postId) async {
    try {
      final response = await _dataService.toggleLikePost(postId);
      if (!response.success) {
        _setError(response.error ?? 'Failed to update like');
      }
      // Like count will be updated via WebSocket
    } catch (e) {
      _setError('Failed to update like: $e');
    }
  }

  /// Practice session methods
  Future<bool> createPracticeSession({
    required String title,
    String? description,
    required String instrument,
    List<String>? practiceGoals,
    bool isLive = false,
  }) async {
    try {
      final response = await _dataService.createPracticeSession(
        title: title,
        description: description,
        instrument: instrument,
        practiceGoals: practiceGoals,
        isLive: isLive,
      );
      
      if (response.success && response.data != null) {
        _practiceSessions.insert(0, response.data!);
        
        if (isLive) {
          _wsService.joinPracticeSession(response.data!.id);
        }
        
        notifyListeners();
        return true;
      } else {
        _setError(response.error ?? 'Failed to create practice session');
        return false;
      }
    } catch (e) {
      _setError('Failed to create practice session: $e');
      return false;
    }
  }

  Future<void> joinPracticeSession(String sessionId) async {
    try {
      final response = await _dataService.joinPracticeSession(sessionId);
      if (response.success) {
        _wsService.joinPracticeSession(sessionId);
      } else {
        _setError(response.error ?? 'Failed to join practice session');
      }
    } catch (e) {
      _setError('Failed to join practice session: $e');
    }
  }

  Future<void> leavePracticeSession(String sessionId) async {
    try {
      final response = await _dataService.leavePracticeSession(sessionId);
      if (response.success) {
        _wsService.leavePracticeSession(sessionId);
      } else {
        _setError(response.error ?? 'Failed to leave practice session');
      }
    } catch (e) {
      _setError('Failed to leave practice session: $e');
    }
  }

  /// Profile methods
  Future<bool> updateProfile({
    String? name,
    String? bio,
    List<String>? instruments,
    String? skillLevel,
  }) async {
    try {
      final response = await _authService.updateProfile(
        name: name,
        bio: bio,
        instruments: instruments,
        skillLevel: skillLevel,
      );
      
      if (response.success && response.data != null) {
        _currentUser = response.data;
        notifyListeners();
        return true;
      } else {
        _setError(response.error ?? 'Failed to update profile');
        return false;
      }
    } catch (e) {
      _setError('Failed to update profile: $e');
      return false;
    }
  }

  /// File upload methods
  Future<String?> uploadFile(String filePath, String endpoint) async {
    try {
      final response = await _dataService.uploadFile(
        filePath: filePath,
        endpoint: endpoint,
      );
      
      if (response.success && response.data != null) {
        return response.data;
      } else {
        _setError(response.error ?? 'Failed to upload file');
        return null;
      }
    } catch (e) {
      _setError('Failed to upload file: $e');
      return null;
    }
  }

  /// WebSocket event handlers
  void _updatePracticeSession(PracticeSession session) {
    final index = _practiceSessions.indexWhere((s) => s.id == session.id);
    if (index != -1) {
      _practiceSessions[index] = session;
      notifyListeners();
    }
  }

  void _addNewCommunityPost(Map<String, dynamic> postData) {
    try {
      final post = CommunityPost.fromJson(postData);
      _communityPosts.insert(0, post);
      notifyListeners();
    } catch (e) {
      print('Error adding new community post: $e');
    }
  }

  void _updatePostLikeCount(String postId, int likeCount) {
    final index = _communityPosts.indexWhere((p) => p.id == postId);
    if (index != -1) {
      // Create updated post with new like count
      final updatedPost = CommunityPost(
        id: _communityPosts[index].id,
        userId: _communityPosts[index].userId,
        userName: _communityPosts[index].userName,
        userAvatar: _communityPosts[index].userAvatar,
        category: _communityPosts[index].category,
        title: _communityPosts[index].title,
        content: _communityPosts[index].content,
        createdAt: _communityPosts[index].createdAt,
        likeCount: likeCount,
        commentCount: _communityPosts[index].commentCount,
        imageUrls: _communityPosts[index].imageUrls,
        tags: _communityPosts[index].tags,
      );
      _communityPosts[index] = updatedPost;
      notifyListeners();
    }
  }

  /// Utility methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _errorMessage = error;
    notifyListeners();
  }

  void _clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void _clearData() {
    _competitions.clear();
    _communityPosts.clear();
    _tutorials.clear();
    _marketplaceItems.clear();
    _practiceSessions.clear();
    _instructors.clear();
  }

  /// Refresh all data
  Future<void> refreshAll() async {
    await _loadInitialData();
  }

  /// Set online/offline status
  void setOnlineStatus(bool online) {
    _isOnline = online;
    notifyListeners();
  }
}