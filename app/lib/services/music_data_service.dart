import '../models/music_models.dart';
import '../config/api_config.dart';
import 'http_service.dart';

/// API-based data service that connects to the backend
/// This replaces the sample data with real API calls
class MusicDataService {
  static final MusicDataService _instance = MusicDataService._internal();
  factory MusicDataService() => _instance;
  MusicDataService._internal();

  final HttpService _httpService = HttpService();

  /// Get user profile by ID
  Future<ApiResponse<User>> getUserProfile(String userId) async {
    return await _httpService.get<User>(
      '${ApiConfig.usersEndpoint}/profile/$userId',
      (data) => User.fromJson(data),
    );
  }

  /// Search users
  Future<ApiResponse<List<User>>> searchUsers({
    String? query,
    String? instrument,
    String? skillLevel,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (query != null) queryParams['search'] = query;
    if (instrument != null) queryParams['instrument'] = instrument;
    if (skillLevel != null) queryParams['skillLevel'] = skillLevel;

    return await _httpService.getList<User>(
      ApiConfig.usersEndpoint,
      (data) => User.fromJson(data),
      queryParams: queryParams,
    );
  }

  /// Get competitions
  Future<ApiResponse<List<Competition>>> getCompetitions({
    String? genre,
    String? skillLevel,
    String? instrument,
    bool activeOnly = true,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (genre != null) queryParams['genre'] = genre;
    if (skillLevel != null) queryParams['skillLevel'] = skillLevel;
    if (instrument != null) queryParams['instrument'] = instrument;
    if (activeOnly) queryParams['status'] = 'active';

    return await _httpService.getList<Competition>(
      ApiConfig.competitionsEndpoint,
      (data) => Competition.fromJson(data),
      queryParams: queryParams,
    );
  }

  /// Get active competitions
  Future<ApiResponse<List<Competition>>> getActiveCompetitions() async {
    return await getCompetitions(activeOnly: true);
  }

  /// Get competition by ID
  Future<ApiResponse<Competition>> getCompetition(String competitionId) async {
    return await _httpService.get<Competition>(
      '${ApiConfig.competitionsEndpoint}/$competitionId',
      (data) => Competition.fromJson(data),
    );
  }

  /// Submit competition entry
  Future<ApiResponse<Map<String, dynamic>>> submitCompetitionEntry({
    required String competitionId,
    required String performanceUrl,
    String? notes,
  }) async {
    return await _httpService.post<Map<String, dynamic>>(
      '${ApiConfig.competitionsEndpoint}/$competitionId/entries',
      {
        'performanceUrl': performanceUrl,
        'notes': notes,
      },
      (data) => data,
    );
  }

  /// Get community posts
  Future<ApiResponse<List<CommunityPost>>> getCommunityPosts({
    String? category,
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (category != null && category.toLowerCase() != 'all') {
      queryParams['category'] = category;
    }
    if (search != null) queryParams['search'] = search;

    return await _httpService.getList<CommunityPost>(
      '${ApiConfig.communityEndpoint}/posts',
      (data) => CommunityPost.fromJson(data),
      queryParams: queryParams,
    );
  }

  /// Get posts by category
  Future<ApiResponse<List<CommunityPost>>> getPostsByCategory(String category) async {
    return await getCommunityPosts(category: category);
  }

  /// Get community post by ID
  Future<ApiResponse<CommunityPost>> getCommunityPost(String postId) async {
    return await _httpService.get<CommunityPost>(
      '${ApiConfig.communityEndpoint}/posts/$postId',
      (data) => CommunityPost.fromJson(data),
    );
  }

  /// Create community post
  Future<ApiResponse<CommunityPost>> createCommunityPost({
    required String title,
    required String content,
    required String category,
    List<String>? tags,
    List<String>? imageUrls,
  }) async {
    return await _httpService.post<CommunityPost>(
      '${ApiConfig.communityEndpoint}/posts',
      {
        'title': title,
        'content': content,
        'category': category,
        'tags': tags ?? [],
        'imageUrls': imageUrls ?? [],
      },
      (data) => CommunityPost.fromJson(data),
    );
  }

  /// Like/unlike community post
  Future<ApiResponse<Map<String, dynamic>>> toggleLikePost(String postId) async {
    return await _httpService.post<Map<String, dynamic>>(
      '${ApiConfig.communityEndpoint}/posts/$postId/like',
      {},
      (data) => data,
    );
  }

  /// Get tutorials
  Future<ApiResponse<List<Tutorial>>> getTutorials({
    String? instrument,
    String? skillLevel,
    String? search,
    bool premiumOnly = false,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (instrument != null) queryParams['instrument'] = instrument;
    if (skillLevel != null) queryParams['skillLevel'] = skillLevel;
    if (search != null) queryParams['search'] = search;
    if (premiumOnly) queryParams['premium'] = 'true';

    return await _httpService.getList<Tutorial>(
      ApiConfig.tutorialsEndpoint,
      (data) => Tutorial.fromJson(data),
      queryParams: queryParams,
    );
  }

  /// Get tutorials for specific instrument
  Future<ApiResponse<List<Tutorial>>> getTutorialsForInstrument(String instrument) async {
    return await getTutorials(instrument: instrument);
  }

  /// Get tutorial by ID
  Future<ApiResponse<Tutorial>> getTutorial(String tutorialId) async {
    return await _httpService.get<Tutorial>(
      '${ApiConfig.tutorialsEndpoint}/$tutorialId',
      (data) => Tutorial.fromJson(data),
    );
  }

  /// Enroll in tutorial
  Future<ApiResponse<Map<String, dynamic>>> enrollInTutorial(String tutorialId) async {
    return await _httpService.post<Map<String, dynamic>>(
      '${ApiConfig.tutorialsEndpoint}/$tutorialId/enroll',
      {},
      (data) => data,
    );
  }

  /// Get instructors
  Future<ApiResponse<List<Instructor>>> getInstructors({
    String? instrument,
    String? specialization,
    bool availableOnly = false,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (instrument != null) queryParams['instrument'] = instrument;
    if (specialization != null) queryParams['specialization'] = specialization;
    if (availableOnly) queryParams['available'] = 'true';

    return await _httpService.getList<Instructor>(
      '${ApiConfig.usersEndpoint}/instructors',
      (data) => Instructor.fromJson(data),
      queryParams: queryParams,
    );
  }

  /// Get instructors for specific instrument
  Future<ApiResponse<List<Instructor>>> getInstructorsForInstrument(String instrument) async {
    return await getInstructors(instrument: instrument);
  }

  /// Get marketplace items
  Future<ApiResponse<List<MarketplaceItem>>> getMarketplaceItems({
    String? category,
    String? search,
    String? condition,
    double? minPrice,
    double? maxPrice,
    String? location,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (category != null && category.toLowerCase() != 'all') {
      queryParams['category'] = category;
    }
    if (search != null) queryParams['search'] = search;
    if (condition != null) queryParams['condition'] = condition;
    if (minPrice != null) queryParams['minPrice'] = minPrice.toString();
    if (maxPrice != null) queryParams['maxPrice'] = maxPrice.toString();
    if (location != null) queryParams['location'] = location;

    return await _httpService.getList<MarketplaceItem>(
      ApiConfig.marketplaceEndpoint,
      (data) => MarketplaceItem.fromJson(data),
      queryParams: queryParams,
    );
  }

  /// Get available marketplace items
  Future<ApiResponse<List<MarketplaceItem>>> getAvailableMarketplaceItems({String? category}) async {
    return await getMarketplaceItems(category: category);
  }

  /// Get marketplace item by ID
  Future<ApiResponse<MarketplaceItem>> getMarketplaceItem(String itemId) async {
    return await _httpService.get<MarketplaceItem>(
      '${ApiConfig.marketplaceEndpoint}/$itemId',
      (data) => MarketplaceItem.fromJson(data),
    );
  }

  /// Create marketplace listing
  Future<ApiResponse<MarketplaceItem>> createMarketplaceListing({
    required String title,
    required String description,
    required String category,
    required double price,
    required String condition,
    required String location,
    List<String>? imageUrls,
    List<String>? tags,
  }) async {
    return await _httpService.post<MarketplaceItem>(
      ApiConfig.marketplaceEndpoint,
      {
        'title': title,
        'description': description,
        'category': category,
        'price': price,
        'condition': condition,
        'location': location,
        'imageUrls': imageUrls ?? [],
        'tags': tags ?? [],
      },
      (data) => MarketplaceItem.fromJson(data),
    );
  }

  /// Get practice sessions
  Future<ApiResponse<List<PracticeSession>>> getPracticeSessions({
    bool liveOnly = false,
    String? instrument,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (liveOnly) queryParams['live'] = 'true';
    if (instrument != null) queryParams['instrument'] = instrument;

    return await _httpService.getList<PracticeSession>(
      ApiConfig.practiceEndpoint,
      (data) => PracticeSession.fromJson(data),
      queryParams: queryParams,
    );
  }

  /// Get live practice sessions
  Future<ApiResponse<List<PracticeSession>>> getLivePracticeSessions() async {
    return await getPracticeSessions(liveOnly: true);
  }

  /// Get user's practice history
  Future<ApiResponse<List<PracticeSession>>> getUserPracticeHistory(String userId) async {
    return await _httpService.getList<PracticeSession>(
      '${ApiConfig.practiceEndpoint}/user/$userId',
      (data) => PracticeSession.fromJson(data),
    );
  }

  /// Create practice session
  Future<ApiResponse<PracticeSession>> createPracticeSession({
    required String title,
    String? description,
    required String instrument,
    List<String>? practiceGoals,
    bool isLive = false,
  }) async {
    return await _httpService.post<PracticeSession>(
      ApiConfig.practiceEndpoint,
      {
        'title': title,
        'description': description,
        'instrument': instrument,
        'practiceGoals': practiceGoals ?? [],
        'isLive': isLive,
      },
      (data) => PracticeSession.fromJson(data),
    );
  }

  /// Join practice session
  Future<ApiResponse<Map<String, dynamic>>> joinPracticeSession(String sessionId) async {
    return await _httpService.post<Map<String, dynamic>>(
      '${ApiConfig.practiceEndpoint}/$sessionId/join',
      {},
      (data) => data,
    );
  }

  /// Leave practice session
  Future<ApiResponse<Map<String, dynamic>>> leavePracticeSession(String sessionId) async {
    return await _httpService.post<Map<String, dynamic>>(
      '${ApiConfig.practiceEndpoint}/$sessionId/leave',
      {},
      (data) => data,
    );
  }

  /// End practice session
  Future<ApiResponse<PracticeSession>> endPracticeSession({
    required String sessionId,
    String? notes,
  }) async {
    return await _httpService.put<PracticeSession>(
      '${ApiConfig.practiceEndpoint}/$sessionId/end',
      {'notes': notes},
      (data) => PracticeSession.fromJson(data),
    );
  }

  /// Search across all content types
  Future<ApiResponse<Map<String, List<dynamic>>>> searchContent(String query) async {
    final response = await _httpService.get<Map<String, dynamic>>(
      '/search',
      (data) => data,
      queryParams: {'q': query},
    );

    if (response.success && response.data != null) {
      final data = response.data!;
      final results = <String, List<dynamic>>{};
      
      // Parse tutorials
      if (data['tutorials'] != null) {
        results['tutorials'] = (data['tutorials'] as List)
            .map((item) => Tutorial.fromJson(item))
            .toList();
      }
      
      // Parse posts
      if (data['posts'] != null) {
        results['posts'] = (data['posts'] as List)
            .map((item) => CommunityPost.fromJson(item))
            .toList();
      }
      
      // Parse marketplace items
      if (data['items'] != null) {
        results['items'] = (data['items'] as List)
            .map((item) => MarketplaceItem.fromJson(item))
            .toList();
      }
      
      return ApiResponse.success(results);
    }

    return ApiResponse.error(response.error ?? 'Search failed');
  }

  /// Upload file to server
  Future<ApiResponse<String>> uploadFile({
    required String filePath,
    required String endpoint,
    String fieldName = 'file',
    Map<String, String>? additionalFields,
  }) async {
    final response = await _httpService.uploadFile<Map<String, dynamic>>(
      endpoint,
      filePath,
      fieldName,
      (data) => data,
      additionalFields: additionalFields,
    );

    if (response.success && response.data != null) {
      final fileUrl = response.data!['url'] as String;
      return ApiResponse.success(fileUrl);
    }

    return ApiResponse.error(response.error ?? 'Upload failed');
  }

  /// Follow/unfollow user
  Future<ApiResponse<Map<String, dynamic>>> toggleFollowUser(String userId) async {
    return await _httpService.post<Map<String, dynamic>>(
      '${ApiConfig.usersEndpoint}/$userId/follow',
      {},
      (data) => data,
    );
  }

  /// Get user's followers
  Future<ApiResponse<List<User>>> getUserFollowers(String userId, {int page = 1, int limit = 20}) async {
    return await _httpService.getList<User>(
      '${ApiConfig.usersEndpoint}/$userId/followers',
      (data) => User.fromJson(data),
      queryParams: {
        'page': page.toString(),
        'limit': limit.toString(),
      },
    );
  }

  /// Get user's following
  Future<ApiResponse<List<User>>> getUserFollowing(String userId, {int page = 1, int limit = 20}) async {
    return await _httpService.getList<User>(
      '${ApiConfig.usersEndpoint}/$userId/following',
      (data) => User.fromJson(data),
      queryParams: {
        'page': page.toString(),
        'limit': limit.toString(),
      },
    );
  }
}