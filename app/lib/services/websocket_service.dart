import 'dart:convert';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config/api_config.dart';
import '../models/music_models.dart';
import 'auth_service.dart';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  IO.Socket? _socket;
  final AuthService _authService = AuthService();
  bool _isConnected = false;

  // Event callbacks
  Function(PracticeSession)? onPracticeSessionUpdate;
  Function(String, Map<String, dynamic>)? onPracticeMessage;
  Function(String)? onUserJoinedSession;
  Function(String)? onUserLeftSession;
  Function(Map<String, dynamic>)? onNewCommunityPost;
  Function(String, int)? onPostLikeUpdate;

  bool get isConnected => _isConnected;

  /// Initialize WebSocket connection
  Future<void> connect() async {
    if (_socket != null && _isConnected) {
      return; // Already connected
    }

    try {
      final token = await _authService.getToken();
      
      _socket = IO.io(ApiConfig.wsUrl, 
        IO.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .setAutoConnect(false)
          .build()
      );

      _socket!.connect();

      _socket!.onConnect((_) {
        print('WebSocket connected');
        _isConnected = true;
        _setupEventListeners();
      });

      _socket!.onDisconnect((_) {
        print('WebSocket disconnected');
        _isConnected = false;
      });

      _socket!.onConnectError((error) {
        print('WebSocket connection error: $error');
        _isConnected = false;
      });

      _socket!.onError((error) {
        print('WebSocket error: $error');
      });

    } catch (e) {
      print('Failed to initialize WebSocket: $e');
    }
  }

  /// Set up event listeners
  void _setupEventListeners() {
    if (_socket == null) return;

    // Practice session events
    _socket!.on('practice_session_updated', (data) {
      try {
        final session = PracticeSession.fromJson(data as Map<String, dynamic>);
        onPracticeSessionUpdate?.call(session);
      } catch (e) {
        print('Error parsing practice session update: $e');
      }
    });

    _socket!.on('practice_message', (data) {
      try {
        final sessionId = data['sessionId'] as String;
        final message = data['message'] as Map<String, dynamic>;
        onPracticeMessage?.call(sessionId, message);
      } catch (e) {
        print('Error parsing practice message: $e');
      }
    });

    _socket!.on('user_joined_session', (data) {
      try {
        final userId = data['userId'] as String;
        onUserJoinedSession?.call(userId);
      } catch (e) {
        print('Error parsing user joined event: $e');
      }
    });

    _socket!.on('user_left_session', (data) {
      try {
        final userId = data['userId'] as String;
        onUserLeftSession?.call(userId);
      } catch (e) {
        print('Error parsing user left event: $e');
      }
    });

    // Community events
    _socket!.on('new_community_post', (data) {
      try {
        final postData = data as Map<String, dynamic>;
        onNewCommunityPost?.call(postData);
      } catch (e) {
        print('Error parsing new community post: $e');
      }
    });

    _socket!.on('post_like_updated', (data) {
      try {
        final postId = data['postId'] as String;
        final likeCount = data['likeCount'] as int;
        onPostLikeUpdate?.call(postId, likeCount);
      } catch (e) {
        print('Error parsing post like update: $e');
      }
    });
  }

  /// Join a practice session room
  void joinPracticeSession(String sessionId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('join_practice_session', {'sessionId': sessionId});
    }
  }

  /// Leave a practice session room
  void leavePracticeSession(String sessionId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('leave_practice_session', {'sessionId': sessionId});
    }
  }

  /// Send a message to practice session
  void sendPracticeMessage({
    required String sessionId,
    required String message,
    String? messageType,
  }) {
    if (_socket != null && _isConnected) {
      _socket!.emit('practice_message', {
        'sessionId': sessionId,
        'message': message,
        'type': messageType ?? 'text',
        'timestamp': DateTime.now().toIso8601String(),
      });
    }
  }

  /// Send practice session update
  void sendPracticeUpdate({
    required String sessionId,
    Map<String, dynamic>? metadata,
  }) {
    if (_socket != null && _isConnected) {
      _socket!.emit('practice_update', {
        'sessionId': sessionId,
        'metadata': metadata ?? {},
        'timestamp': DateTime.now().toIso8601String(),
      });
    }
  }

  /// Join community room for real-time updates
  void joinCommunityRoom() {
    if (_socket != null && _isConnected) {
      _socket!.emit('join_community');
    }
  }

  /// Leave community room
  void leaveCommunityRoom() {
    if (_socket != null && _isConnected) {
      _socket!.emit('leave_community');
    }
  }

  /// Send typing indicator for community posts
  void sendTypingIndicator({
    required String postId,
    required bool isTyping,
  }) {
    if (_socket != null && _isConnected) {
      _socket!.emit('typing_indicator', {
        'postId': postId,
        'isTyping': isTyping,
      });
    }
  }

  /// Subscribe to user activity updates
  void subscribeToUserActivity(String userId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('subscribe_user_activity', {'userId': userId});
    }
  }

  /// Unsubscribe from user activity updates
  void unsubscribeFromUserActivity(String userId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('unsubscribe_user_activity', {'userId': userId});
    }
  }

  /// Send presence update
  void updatePresence({
    required String status, // 'online', 'away', 'practice', 'offline'
    Map<String, dynamic>? metadata,
  }) {
    if (_socket != null && _isConnected) {
      _socket!.emit('presence_update', {
        'status': status,
        'metadata': metadata ?? {},
        'timestamp': DateTime.now().toIso8601String(),
      });
    }
  }

  /// Request to start collaborative practice
  void requestCollaborativePractice({
    required String partnerId,
    required String instrument,
    String? message,
  }) {
    if (_socket != null && _isConnected) {
      _socket!.emit('collaboration_request', {
        'partnerId': partnerId,
        'instrument': instrument,
        'message': message,
        'timestamp': DateTime.now().toIso8601String(),
      });
    }
  }

  /// Respond to collaborative practice request
  void respondToCollaborationRequest({
    required String requestId,
    required bool accepted,
    String? message,
  }) {
    if (_socket != null && _isConnected) {
      _socket!.emit('collaboration_response', {
        'requestId': requestId,
        'accepted': accepted,
        'message': message,
        'timestamp': DateTime.now().toIso8601String(),
      });
    }
  }

  /// Start video call for practice session
  void startVideoCall({
    required String sessionId,
    required Map<String, dynamic> callConfig,
  }) {
    if (_socket != null && _isConnected) {
      _socket!.emit('start_video_call', {
        'sessionId': sessionId,
        'config': callConfig,
        'timestamp': DateTime.now().toIso8601String(),
      });
    }
  }

  /// End video call
  void endVideoCall({
    required String sessionId,
    required String callId,
  }) {
    if (_socket != null && _isConnected) {
      _socket!.emit('end_video_call', {
        'sessionId': sessionId,
        'callId': callId,
        'timestamp': DateTime.now().toIso8601String(),
      });
    }
  }

  /// Send real-time notification
  void sendNotification({
    required String recipientId,
    required String type,
    required String title,
    required String message,
    Map<String, dynamic>? data,
  }) {
    if (_socket != null && _isConnected) {
      _socket!.emit('send_notification', {
        'recipientId': recipientId,
        'type': type,
        'title': title,
        'message': message,
        'data': data ?? {},
        'timestamp': DateTime.now().toIso8601String(),
      });
    }
  }

  /// Disconnect WebSocket
  void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
      _isConnected = false;
    }
  }

  /// Reconnect WebSocket
  Future<void> reconnect() async {
    disconnect();
    await Future.delayed(const Duration(seconds: 1));
    await connect();
  }

  /// Set event callbacks
  void setEventCallbacks({
    Function(PracticeSession)? onPracticeSessionUpdate,
    Function(String, Map<String, dynamic>)? onPracticeMessage,
    Function(String)? onUserJoinedSession,
    Function(String)? onUserLeftSession,
    Function(Map<String, dynamic>)? onNewCommunityPost,
    Function(String, int)? onPostLikeUpdate,
  }) {
    this.onPracticeSessionUpdate = onPracticeSessionUpdate;
    this.onPracticeMessage = onPracticeMessage;
    this.onUserJoinedSession = onUserJoinedSession;
    this.onUserLeftSession = onUserLeftSession;
    this.onNewCommunityPost = onNewCommunityPost;
    this.onPostLikeUpdate = onPostLikeUpdate;
  }

  /// Clear all event callbacks
  void clearCallbacks() {
    onPracticeSessionUpdate = null;
    onPracticeMessage = null;
    onUserJoinedSession = null;
    onUserLeftSession = null;
    onNewCommunityPost = null;
    onPostLikeUpdate = null;
  }
}