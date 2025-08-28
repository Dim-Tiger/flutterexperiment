import '../models/music_models.dart';

/// Sample data service to demonstrate the flexibility of the music practice app
/// In a real application, this would connect to your backend API
class MusicDataService {
  static List<User> getSampleUsers() {
    return [
      User(
        id: '1',
        name: 'Sarah Chen',
        email: 'sarah@example.com',
        instruments: ['Piano', 'Guitar'],
        skillLevel: 'Intermediate',
        joinDate: DateTime.now().subtract(const Duration(days: 180)),
        isVerified: true,
      ),
      User(
        id: '2',
        name: 'Alex Rodriguez',
        email: 'alex@example.com',
        instruments: ['Guitar', 'Bass'],
        skillLevel: 'Advanced',
        joinDate: DateTime.now().subtract(const Duration(days: 120)),
        isVerified: false,
      ),
      User(
        id: '3',
        name: 'Emma Wilson',
        email: 'emma@example.com',
        instruments: ['Violin', 'Piano'],
        skillLevel: 'Expert',
        joinDate: DateTime.now().subtract(const Duration(days: 300)),
        isVerified: true,
      ),
    ];
  }

  static List<Competition> getSampleCompetitions() {
    final now = DateTime.now();
    return [
      Competition(
        id: '1',
        title: 'Piano Solo Challenge',
        description: 'Showcase your best piano performance in this classical music competition.',
        genre: 'Classical',
        skillLevel: 'Intermediate',
        prize: 'Masterclass with Vienna Philharmonic',
        deadline: now.add(const Duration(days: 15)),
        eligibleInstruments: ['Piano'],
        participantCount: 234,
        isActive: true,
      ),
      Competition(
        id: '2',
        title: 'Jazz Improvisation Contest',
        description: 'Express your creativity through jazz improvisation.',
        genre: 'Jazz',
        skillLevel: 'Advanced',
        prize: 'Recording Session Prize',
        deadline: now.add(const Duration(days: 8)),
        eligibleInstruments: ['Piano', 'Guitar', 'Saxophone', 'Trumpet'],
        participantCount: 156,
        isActive: true,
      ),
      Competition(
        id: '3',
        title: 'Young Violinist Competition',
        description: 'Competition for young and emerging violin talent.',
        genre: 'Classical',
        skillLevel: 'Beginner',
        prize: 'Instrument Scholarship',
        deadline: now.add(const Duration(days: 22)),
        eligibleInstruments: ['Violin'],
        participantCount: 89,
        isActive: true,
      ),
    ];
  }

  static List<CommunityPost> getSampleCommunityPosts() {
    final now = DateTime.now();
    return [
      CommunityPost(
        id: '1',
        userId: '1',
        userName: 'Sarah Chen',
        userAvatar: 'S',
        category: 'Tips',
        title: 'Piano Practice Schedule That Actually Works',
        content: 'After years of struggling with consistency, I found a practice routine that keeps me motivated. Here\'s what works for me: Start with 10 minutes of scales, then work on technique for 15 minutes...',
        createdAt: now.subtract(const Duration(hours: 2)),
        likeCount: 24,
        commentCount: 8,
        tags: ['piano', 'practice', 'routine'],
      ),
      CommunityPost(
        id: '2',
        userId: '2',
        userName: 'Alex Rodriguez',
        userAvatar: 'A',
        category: 'Questions',
        title: 'How to overcome performance anxiety?',
        content: 'I get so nervous before performing that my hands shake. Does anyone have tips for managing stage fright? I\'ve been playing guitar for 3 years but still struggle with this.',
        createdAt: now.subtract(const Duration(hours: 5)),
        likeCount: 15,
        commentCount: 12,
        tags: ['performance', 'anxiety', 'guitar'],
      ),
      CommunityPost(
        id: '3',
        userId: '3',
        userName: 'Emma Wilson',
        userAvatar: 'E',
        category: 'Technique',
        title: 'Violin Bow Technique Breakthrough',
        content: 'Finally mastered the spiccato technique! It took months of practice but here\'s the exercise that made it click. The key is starting very slowly...',
        createdAt: now.subtract(const Duration(days: 1)),
        likeCount: 31,
        commentCount: 6,
        imageUrls: ['https://example.com/violin-technique.jpg'],
        tags: ['violin', 'technique', 'bow'],
      ),
    ];
  }

  static List<Tutorial> getSampleTutorials() {
    final now = DateTime.now();
    return [
      Tutorial(
        id: '1',
        title: 'Piano Scales and Arpeggios Mastery',
        description: 'Learn the fundamental piano scales and arpeggios that every pianist should know.',
        instructorId: 'i1',
        instructorName: 'Dr. Sarah Johnson',
        instrument: 'Piano',
        skillLevel: 'Intermediate',
        durationMinutes: 45,
        rating: 4.8,
        studentCount: 1200,
        isPremium: false,
        tags: ['scales', 'arpeggios', 'technique'],
        publishedAt: now.subtract(const Duration(days: 7)),
      ),
      Tutorial(
        id: '2',
        title: 'Guitar Fingerpicking Patterns',
        description: 'Master essential fingerpicking patterns for acoustic guitar.',
        instructorId: 'i2',
        instructorName: 'Miguel Rodriguez',
        instrument: 'Guitar',
        skillLevel: 'Beginner',
        durationMinutes: 32,
        rating: 4.9,
        studentCount: 980,
        isPremium: true,
        tags: ['fingerpicking', 'acoustic', 'patterns'],
        publishedAt: now.subtract(const Duration(days: 3)),
      ),
      Tutorial(
        id: '3',
        title: 'Violin Bow Technique Advanced',
        description: 'Advanced bowing techniques for experienced violinists.',
        instructorId: 'i3',
        instructorName: 'Emma Chen',
        instrument: 'Violin',
        skillLevel: 'Advanced',
        durationMinutes: 75,
        rating: 4.7,
        studentCount: 654,
        isPremium: false,
        tags: ['bow', 'technique', 'advanced'],
        publishedAt: now.subtract(const Duration(days: 14)),
      ),
    ];
  }

  static List<Instructor> getSampleInstructors() {
    final now = DateTime.now();
    return [
      Instructor(
        id: 'i1',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@example.com',
        instruments: ['Piano'],
        skillLevel: 'Expert',
        joinDate: now.subtract(const Duration(days: 1200)),
        specialization: 'Piano & Music Theory',
        yearsExperience: 15,
        rating: 4.9,
        studentCount: 2500,
        certifications: ['PhD Music Education', 'ABRSM Diploma'],
        hourlyRate: 75.0,
        isAvailableForLessons: true,
      ),
      Instructor(
        id: 'i2',
        name: 'Miguel Rodriguez',
        email: 'miguel@example.com',
        instruments: ['Guitar', 'Bass'],
        skillLevel: 'Expert',
        joinDate: now.subtract(const Duration(days: 800)),
        specialization: 'Classical Guitar',
        yearsExperience: 12,
        rating: 4.8,
        studentCount: 1800,
        certifications: ['Classical Guitar Certificate', 'Music Performance Degree'],
        hourlyRate: 60.0,
        isAvailableForLessons: true,
      ),
      Instructor(
        id: 'i3',
        name: 'Emma Chen',
        email: 'emma.chen@example.com',
        instruments: ['Violin', 'Viola'],
        skillLevel: 'Expert',
        joinDate: now.subtract(const Duration(days: 600)),
        specialization: 'Violin & Chamber Music',
        yearsExperience: 10,
        rating: 4.9,
        studentCount: 1200,
        certifications: ['Violin Performance Degree', 'Suzuki Method Certificate'],
        hourlyRate: 65.0,
        isAvailableForLessons: false,
      ),
    ];
  }

  static List<MarketplaceItem> getSampleMarketplaceItems() {
    final now = DateTime.now();
    return [
      MarketplaceItem(
        id: '1',
        sellerId: 'u1',
        sellerName: 'Music Studio Pro',
        title: 'Yamaha P-45 Digital Piano',
        description: 'Excellent condition digital piano, barely used. Perfect for beginners and intermediate players.',
        category: 'Piano',
        price: 549.0,
        condition: 'Like New',
        location: 'San Francisco, CA',
        imageUrls: ['https://example.com/piano1.jpg', 'https://example.com/piano2.jpg'],
        listedAt: now.subtract(const Duration(hours: 2)),
        isVerified: true,
        tags: ['yamaha', 'digital', 'weighted-keys'],
      ),
      MarketplaceItem(
        id: '2',
        sellerId: 'u2',
        sellerName: 'Guitar Center',
        title: 'Gibson Les Paul Standard',
        description: 'Professional electric guitar in excellent condition. Includes hard case.',
        category: 'Guitar',
        price: 2299.0,
        condition: 'Excellent',
        location: 'Los Angeles, CA',
        imageUrls: ['https://example.com/guitar1.jpg'],
        listedAt: now.subtract(const Duration(hours: 5)),
        isVerified: true,
        isUrgent: true,
        tags: ['gibson', 'electric', 'professional'],
      ),
      MarketplaceItem(
        id: '3',
        sellerId: 'u3',
        sellerName: 'Classical Instruments',
        title: 'Professional Violin 4/4',
        description: 'Handcrafted violin with beautiful tone. Includes bow and case.',
        category: 'Violin',
        price: 1200.0,
        condition: 'Good',
        location: 'New York, NY',
        imageUrls: ['https://example.com/violin1.jpg'],
        listedAt: now.subtract(const Duration(days: 1)),
        isVerified: true,
        tags: ['acoustic', 'handcrafted', 'full-size'],
      ),
    ];
  }

  static List<PracticeSession> getSamplePracticeSessions() {
    final now = DateTime.now();
    return [
      PracticeSession(
        id: '1',
        userId: '1',
        title: 'Piano Practice Room',
        description: 'Working on Chopin Nocturnes',
        startTime: now.subtract(const Duration(minutes: 30)),
        instrument: 'Piano',
        practiceGoals: ['Improve left hand technique', 'Work on dynamics'],
        isLive: true,
        participants: ['user2', 'user3'],
      ),
      PracticeSession(
        id: '2',
        userId: '2',
        title: 'Guitar Jam Session',
        description: 'Practicing jazz standards',
        startTime: now.subtract(const Duration(hours: 1, minutes: 20)),
        instrument: 'Guitar',
        practiceGoals: ['Learn new chord progressions', 'Improve improvisation'],
        isLive: true,
        participants: ['user1', 'user4', 'user5'],
      ),
      PracticeSession(
        id: '3',
        userId: '3',
        title: 'Violin Study Group',
        description: 'Bach Partitas study session',
        startTime: now.add(const Duration(hours: 2)),
        instrument: 'Violin',
        practiceGoals: ['Work on intonation', 'Master difficult passages'],
        isLive: false,
        participants: ['user1', 'user2'],
      ),
    ];
  }

  /// Example method showing how to filter data based on user preferences
  static List<Tutorial> getTutorialsForInstrument(String instrument) {
    return getSampleTutorials()
        .where((tutorial) => tutorial.instrument.toLowerCase() == instrument.toLowerCase())
        .toList();
  }

  /// Example method showing how to filter community posts by category
  static List<CommunityPost> getPostsByCategory(String category) {
    if (category.toLowerCase() == 'all') {
      return getSampleCommunityPosts();
    }
    return getSampleCommunityPosts()
        .where((post) => post.category.toLowerCase() == category.toLowerCase())
        .toList();
  }

  /// Example method showing how to get active competitions
  static List<Competition> getActiveCompetitions() {
    return getSampleCompetitions()
        .where((competition) => competition.isActive && competition.deadline.isAfter(DateTime.now()))
        .toList();
  }

  /// Example method showing how to get available marketplace items
  static List<MarketplaceItem> getAvailableMarketplaceItems({String? category}) {
    var items = getSampleMarketplaceItems()
        .where((item) => item.isAvailable)
        .toList();
    
    if (category != null && category.toLowerCase() != 'all') {
      items = items
          .where((item) => item.category.toLowerCase() == category.toLowerCase())
          .toList();
    }
    
    return items;
  }

  /// Example method showing how to get live practice sessions
  static List<PracticeSession> getLivePracticeSessions() {
    return getSamplePracticeSessions()
        .where((session) => session.isActive)
        .toList();
  }

  /// Example method showing how to get instructors by instrument
  static List<Instructor> getInstructorsForInstrument(String instrument) {
    return getSampleInstructors()
        .where((instructor) => 
            instructor.instruments.any((inst) => 
                inst.toLowerCase() == instrument.toLowerCase()))
        .toList();
  }

  /// Example method showing how to get user's practice history
  static List<PracticeSession> getUserPracticeHistory(String userId) {
    return getSamplePracticeSessions()
        .where((session) => session.userId == userId && !session.isActive)
        .toList();
  }

  /// Example method showing how to search content
  static Map<String, List<dynamic>> searchContent(String query) {
    final lowerQuery = query.toLowerCase();
    
    final tutorials = getSampleTutorials()
        .where((tutorial) => 
            tutorial.title.toLowerCase().contains(lowerQuery) ||
            tutorial.description.toLowerCase().contains(lowerQuery) ||
            tutorial.tags.any((tag) => tag.toLowerCase().contains(lowerQuery)))
        .toList();
    
    final posts = getSampleCommunityPosts()
        .where((post) => 
            post.title.toLowerCase().contains(lowerQuery) ||
            post.content.toLowerCase().contains(lowerQuery) ||
            post.tags.any((tag) => tag.toLowerCase().contains(lowerQuery)))
        .toList();
    
    final items = getSampleMarketplaceItems()
        .where((item) => 
            item.title.toLowerCase().contains(lowerQuery) ||
            item.description.toLowerCase().contains(lowerQuery) ||
            item.tags.any((tag) => tag.toLowerCase().contains(lowerQuery)))
        .toList();
    
    return {
      'tutorials': tutorials,
      'posts': posts,
      'items': items,
    };
  }
}