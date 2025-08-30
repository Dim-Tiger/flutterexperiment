/// Base user model that can be extended for different user types
class User {
  final String id;
  final String name;
  final String email;
  final String? avatarUrl;
  final String? bio;
  final List<String> instruments;
  final String skillLevel;
  final DateTime joinDate;
  final bool isVerified;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.avatarUrl,
    this.bio,
    this.instruments = const [],
    this.skillLevel = 'Beginner',
    required this.joinDate,
    this.isVerified = false,
  });

  String get initials {
    List<String> nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase();
    } else {
      return name.length >= 2 ? name.substring(0, 2).toUpperCase() : name.toUpperCase();
    }
  }

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      avatarUrl: json['avatarUrl'],
      bio: json['bio'],
      instruments: List<String>.from(json['instruments'] ?? []),
      skillLevel: json['skillLevel'] ?? 'Beginner',
      joinDate: DateTime.parse(json['joinDate']),
      isVerified: json['isVerified'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'avatarUrl': avatarUrl,
      'bio': bio,
      'instruments': instruments,
      'skillLevel': skillLevel,
      'joinDate': joinDate.toIso8601String(),
      'isVerified': isVerified,
    };
  }

  User copyWith({
    String? name,
    String? email,
    String? avatarUrl,
    String? bio,
    List<String>? instruments,
    String? skillLevel,
    DateTime? joinDate,
    bool? isVerified,
  }) {
    return User(
      id: id,
      name: name ?? this.name,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      bio: bio ?? this.bio,
      instruments: instruments ?? this.instruments,
      skillLevel: skillLevel ?? this.skillLevel,
      joinDate: joinDate ?? this.joinDate,
      isVerified: isVerified ?? this.isVerified,
    );
  }
}

/// Competition model for music competitions
class Competition {
  final String id;
  final String title;
  final String description;
  final String genre;
  final String skillLevel;
  final String prize;
  final DateTime deadline;
  final List<String> eligibleInstruments;
  final int participantCount;
  final bool isActive;
  final String? imageUrl;

  Competition({
    required this.id,
    required this.title,
    required this.description,
    required this.genre,
    required this.skillLevel,
    required this.prize,
    required this.deadline,
    this.eligibleInstruments = const [],
    this.participantCount = 0,
    this.isActive = true,
    this.imageUrl,
  });

  String get timeRemaining {
    final now = DateTime.now();
    final difference = deadline.difference(now);
    
    if (difference.inDays > 0) {
      return '${difference.inDays} days left';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hours left';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minutes left';
    } else {
      return 'Expired';
    }
  }

  factory Competition.fromJson(Map<String, dynamic> json) {
    return Competition(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      genre: json['genre'],
      skillLevel: json['skillLevel'],
      prize: json['prize'],
      deadline: DateTime.parse(json['deadline']),
      eligibleInstruments: List<String>.from(json['eligibleInstruments'] ?? []),
      participantCount: json['participantCount'] ?? 0,
      isActive: json['isActive'] ?? true,
      imageUrl: json['imageUrl'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'genre': genre,
      'skillLevel': skillLevel,
      'prize': prize,
      'deadline': deadline.toIso8601String(),
      'eligibleInstruments': eligibleInstruments,
      'participantCount': participantCount,
      'isActive': isActive,
      'imageUrl': imageUrl,
    };
  }
}

/// Practice session model
class PracticeSession {
  final String id;
  final String userId;
  final String? title;
  final String? description;
  final DateTime startTime;
  final DateTime? endTime;
  final int durationMinutes;
  final String instrument;
  final List<String> practiceGoals;
  final String? notes;
  final bool isLive;
  final List<String> participants;

  PracticeSession({
    required this.id,
    required this.userId,
    this.title,
    this.description,
    required this.startTime,
    this.endTime,
    this.durationMinutes = 0,
    required this.instrument,
    this.practiceGoals = const [],
    this.notes,
    this.isLive = false,
    this.participants = const [],
  });

  bool get isActive => isLive && endTime == null;
  
  Duration get duration {
    if (endTime != null) {
      return endTime!.difference(startTime);
    } else {
      return DateTime.now().difference(startTime);
    }
  }

  factory PracticeSession.fromJson(Map<String, dynamic> json) {
    return PracticeSession(
      id: json['id'],
      userId: json['userId'],
      title: json['title'],
      description: json['description'],
      startTime: DateTime.parse(json['startTime']),
      endTime: json['endTime'] != null ? DateTime.parse(json['endTime']) : null,
      durationMinutes: json['durationMinutes'] ?? 0,
      instrument: json['instrument'],
      practiceGoals: List<String>.from(json['practiceGoals'] ?? []),
      notes: json['notes'],
      isLive: json['isLive'] ?? false,
      participants: List<String>.from(json['participants'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'title': title,
      'description': description,
      'startTime': startTime.toIso8601String(),
      'endTime': endTime?.toIso8601String(),
      'durationMinutes': durationMinutes,
      'instrument': instrument,
      'practiceGoals': practiceGoals,
      'notes': notes,
      'isLive': isLive,
      'participants': participants,
    };
  }
}

/// Community post model
class CommunityPost {
  final String id;
  final String userId;
  final String userName;
  final String userAvatar;
  final String category;
  final String title;
  final String content;
  final DateTime createdAt;
  final List<String> imageUrls;
  final int likeCount;
  final int commentCount;
  final bool isLiked;
  final bool isPinned;
  final List<String> tags;

  CommunityPost({
    required this.id,
    required this.userId,
    required this.userName,
    required this.userAvatar,
    required this.category,
    required this.title,
    required this.content,
    required this.createdAt,
    this.imageUrls = const [],
    this.likeCount = 0,
    this.commentCount = 0,
    this.isLiked = false,
    this.isPinned = false,
    this.tags = const [],
  });

  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays > 7) {
      return '${(difference.inDays / 7).floor()}w ago';
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  factory CommunityPost.fromJson(Map<String, dynamic> json) {
    return CommunityPost(
      id: json['id'],
      userId: json['userId'],
      userName: json['userName'],
      userAvatar: json['userAvatar'],
      category: json['category'],
      title: json['title'],
      content: json['content'],
      createdAt: DateTime.parse(json['createdAt']),
      imageUrls: List<String>.from(json['imageUrls'] ?? []),
      likeCount: json['likeCount'] ?? 0,
      commentCount: json['commentCount'] ?? 0,
      isLiked: json['isLiked'] ?? false,
      isPinned: json['isPinned'] ?? false,
      tags: List<String>.from(json['tags'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'userName': userName,
      'userAvatar': userAvatar,
      'category': category,
      'title': title,
      'content': content,
      'createdAt': createdAt.toIso8601String(),
      'imageUrls': imageUrls,
      'likeCount': likeCount,
      'commentCount': commentCount,
      'isLiked': isLiked,
      'isPinned': isPinned,
      'tags': tags,
    };
  }
}

/// Tutorial/Lesson model
class Tutorial {
  final String id;
  final String title;
  final String description;
  final String instructorId;
  final String instructorName;
  final String instrument;
  final String skillLevel;
  final int durationMinutes;
  final String? videoUrl;
  final String? thumbnailUrl;
  final double rating;
  final int studentCount;
  final bool isPremium;
  final List<String> tags;
  final DateTime publishedAt;

  Tutorial({
    required this.id,
    required this.title,
    required this.description,
    required this.instructorId,
    required this.instructorName,
    required this.instrument,
    required this.skillLevel,
    required this.durationMinutes,
    this.videoUrl,
    this.thumbnailUrl,
    this.rating = 0.0,
    this.studentCount = 0,
    this.isPremium = false,
    this.tags = const [],
    required this.publishedAt,
  });

  String get durationText {
    if (durationMinutes >= 60) {
      final hours = durationMinutes ~/ 60;
      final minutes = durationMinutes % 60;
      return '${hours}h ${minutes}min';
    } else {
      return '${durationMinutes}min';
    }
  }

  factory Tutorial.fromJson(Map<String, dynamic> json) {
    return Tutorial(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      instructorId: json['instructorId'],
      instructorName: json['instructorName'],
      instrument: json['instrument'],
      skillLevel: json['skillLevel'],
      durationMinutes: json['durationMinutes'],
      videoUrl: json['videoUrl'],
      thumbnailUrl: json['thumbnailUrl'],
      rating: (json['rating'] ?? 0.0).toDouble(),
      studentCount: json['studentCount'] ?? 0,
      isPremium: json['isPremium'] ?? false,
      tags: List<String>.from(json['tags'] ?? []),
      publishedAt: DateTime.parse(json['publishedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'instructorId': instructorId,
      'instructorName': instructorName,
      'instrument': instrument,
      'skillLevel': skillLevel,
      'durationMinutes': durationMinutes,
      'videoUrl': videoUrl,
      'thumbnailUrl': thumbnailUrl,
      'rating': rating,
      'studentCount': studentCount,
      'isPremium': isPremium,
      'tags': tags,
      'publishedAt': publishedAt.toIso8601String(),
    };
  }
}

/// Marketplace item model
class MarketplaceItem {
  final String id;
  final String sellerId;
  final String sellerName;
  final String title;
  final String description;
  final String category;
  final double price;
  final String condition;
  final String location;
  final List<String> imageUrls;
  final DateTime listedAt;
  final bool isAvailable;
  final bool isVerified;
  final bool isUrgent;
  final List<String> tags;

  MarketplaceItem({
    required this.id,
    required this.sellerId,
    required this.sellerName,
    required this.title,
    required this.description,
    required this.category,
    required this.price,
    required this.condition,
    required this.location,
    this.imageUrls = const [],
    required this.listedAt,
    this.isAvailable = true,
    this.isVerified = false,
    this.isUrgent = false,
    this.tags = const [],
  });

  String get priceText => '\$${price.toStringAsFixed(0)}';
  
  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(listedAt);

    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else {
      return 'Just listed';
    }
  }

  factory MarketplaceItem.fromJson(Map<String, dynamic> json) {
    return MarketplaceItem(
      id: json['id'],
      sellerId: json['sellerId'],
      sellerName: json['sellerName'],
      title: json['title'],
      description: json['description'],
      category: json['category'],
      price: (json['price'] ?? 0.0).toDouble(),
      condition: json['condition'],
      location: json['location'],
      imageUrls: List<String>.from(json['imageUrls'] ?? []),
      listedAt: DateTime.parse(json['listedAt']),
      isAvailable: json['isAvailable'] ?? true,
      isVerified: json['isVerified'] ?? false,
      isUrgent: json['isUrgent'] ?? false,
      tags: List<String>.from(json['tags'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sellerId': sellerId,
      'sellerName': sellerName,
      'title': title,
      'description': description,
      'category': category,
      'price': price,
      'condition': condition,
      'location': location,
      'imageUrls': imageUrls,
      'listedAt': listedAt.toIso8601String(),
      'isAvailable': isAvailable,
      'isVerified': isVerified,
      'isUrgent': isUrgent,
      'tags': tags,
    };
  }
}

/// Instructor model extending User
class Instructor extends User {
  final String specialization;
  final int yearsExperience;
  final double rating;
  final int studentCount;
  final List<String> certifications;
  final double hourlyRate;
  final bool isAvailableForLessons;

  Instructor({
    required super.id,
    required super.name,
    required super.email,
    super.avatarUrl,
    super.bio,
    super.instruments,
    super.skillLevel = 'Expert',
    required super.joinDate,
    super.isVerified = true,
    required this.specialization,
    required this.yearsExperience,
    this.rating = 0.0,
    this.studentCount = 0,
    this.certifications = const [],
    this.hourlyRate = 0.0,
    this.isAvailableForLessons = true,
  });

  String get experienceText => '$yearsExperience+ years';

  factory Instructor.fromJson(Map<String, dynamic> json) {
    return Instructor(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      avatarUrl: json['avatarUrl'],
      bio: json['bio'],
      instruments: List<String>.from(json['instruments'] ?? []),
      skillLevel: json['skillLevel'] ?? 'Expert',
      joinDate: DateTime.parse(json['joinDate']),
      isVerified: json['isVerified'] ?? true,
      specialization: json['specialization'],
      yearsExperience: json['yearsExperience'],
      rating: (json['rating'] ?? 0.0).toDouble(),
      studentCount: json['studentCount'] ?? 0,
      certifications: List<String>.from(json['certifications'] ?? []),
      hourlyRate: (json['hourlyRate'] ?? 0.0).toDouble(),
      isAvailableForLessons: json['isAvailableForLessons'] ?? true,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    final baseJson = super.toJson();
    baseJson.addAll({
      'specialization': specialization,
      'yearsExperience': yearsExperience,
      'rating': rating,
      'studentCount': studentCount,
      'certifications': certifications,
      'hourlyRate': hourlyRate,
      'isAvailableForLessons': isAvailableForLessons,
    });
    return baseJson;
  }
}