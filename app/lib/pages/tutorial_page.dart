import 'package:flutter/material.dart';

class TutorialPage extends StatefulWidget {
  const TutorialPage({super.key});

  @override
  State<TutorialPage> createState() => _TutorialPageState();
}

class _TutorialPageState extends State<TutorialPage> {
  String _selectedInstrument = 'All';
  String _selectedDifficulty = 'All';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: Column(
          children: [
            // Header
            _buildHeader(context),
            
            // Filters
            _buildFilters(context),
            
            // Content
            Expanded(
              child: _buildContent(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Learn & Grow',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
              ),
              Text(
                'Expert tutorials and lessons',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.school,
              color: Theme.of(context).primaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          // Instrument Filter
          Row(
            children: [
              Text(
                'Instrument:',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[700],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: ['All', 'Piano', 'Guitar', 'Violin', 'Drums', 'Voice']
                        .map((instrument) => Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: FilterChip(
                                label: Text(instrument),
                                selected: _selectedInstrument == instrument,
                                onSelected: (selected) {
                                  setState(() {
                                    _selectedInstrument = instrument;
                                  });
                                },
                                backgroundColor: Colors.white,
                                selectedColor: Theme.of(context).primaryColor.withOpacity(0.2),
                                checkmarkColor: Theme.of(context).primaryColor,
                              ),
                            ))
                        .toList(),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          
          // Difficulty Filter
          Row(
            children: [
              Text(
                'Level:',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[700],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: ['All', 'Beginner', 'Intermediate', 'Advanced']
                        .map((level) => Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: FilterChip(
                                label: Text(level),
                                selected: _selectedDifficulty == level,
                                onSelected: (selected) {
                                  setState(() {
                                    _selectedDifficulty = level;
                                  });
                                },
                                backgroundColor: Colors.white,
                                selectedColor: Colors.green.withOpacity(0.2),
                                checkmarkColor: Colors.green,
                              ),
                            ))
                        .toList(),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Featured Section
          _buildFeaturedSection(context),
          const SizedBox(height: 24),
          
          // Weekly Tutorials
          _buildWeeklyTutorials(context),
          const SizedBox(height: 24),
          
          // Instructors Section
          _buildInstructorsSection(context),
          const SizedBox(height: 24),
          
          // Practice Challenges
          _buildPracticeChallenges(context),
        ],
      ),
    );
  }

  Widget _buildFeaturedSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Featured This Week',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          height: 200,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              colors: [
                Colors.purple.withOpacity(0.8),
                Colors.purple.withOpacity(0.6),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                right: -20,
                top: -20,
                child: Icon(
                  Icons.music_note,
                  size: 120,
                  color: Colors.white.withOpacity(0.1),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'MASTERCLASS',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Advanced Piano Technique',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Text(
                      'with Maria Joao Pires',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                      ),
                    ),
                    const Spacer(),
                    Row(
                      children: [
                        ElevatedButton(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Opening masterclass...')),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: Colors.purple,
                          ),
                          child: const Text('Watch Now'),
                        ),
                        const SizedBox(width: 12),
                        const Icon(Icons.play_circle_filled, color: Colors.white, size: 40),
                        const SizedBox(width: 8),
                        const Text(
                          '2.5h duration',
                          style: TextStyle(color: Colors.white),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildWeeklyTutorials(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Weekly Tutorials',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton(
              onPressed: () {
                // View all tutorials
              },
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _getFilteredTutorials().length,
          itemBuilder: (context, index) {
            return _buildTutorialCard(context, _getFilteredTutorials()[index]);
          },
        ),
      ],
    );
  }

  Widget _buildTutorialCard(BuildContext context, Map<String, dynamic> tutorial) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          // Thumbnail
          Container(
            width: 120,
            height: 90,
            decoration: BoxDecoration(
              color: (tutorial['color'] as Color).withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                bottomLeft: Radius.circular(12),
              ),
            ),
            child: Stack(
              children: [
                Center(
                  child: Icon(
                    _getInstrumentIcon(tutorial['instrument'] as String),
                    size: 32,
                    color: tutorial['color'] as Color,
                  ),
                ),
                Positioned(
                  bottom: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      tutorial['duration'] as String,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: _buildLevelBadge(tutorial['level'] as String),
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: _buildInstrumentBadge(tutorial['instrument'] as String),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    tutorial['title'] as String,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'by ${tutorial['instructor']}',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.star, color: Colors.amber, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        '${tutorial['rating']}',
                        style: const TextStyle(fontSize: 14),
                      ),
                      const SizedBox(width: 12),
                      Icon(Icons.people, color: Colors.grey[600], size: 16),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${tutorial['students']}',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 14,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          
          // Action Button
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                IconButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Playing ${tutorial['title']}')),
                    );
                  },
                  icon: Icon(
                    Icons.play_circle_filled,
                    color: tutorial['color'] as Color,
                    size: 32,
                  ),
                ),
                if (tutorial['isPremium'] == true)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'PRO',
                      style: TextStyle(
                        color: Colors.amber,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInstructorsSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Featured Instructors',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 160,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: 4,
            itemBuilder: (context, index) {
              return _buildInstructorCard(context, index);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildInstructorCard(BuildContext context, int index) {
    final instructors = [
      {
        'name': 'Dr. Sarah Johnson',
        'specialty': 'Piano & Music Theory',
        'experience': '15+ years',
        'students': '2.5k',
        'rating': 4.9,
        'avatar': 'S',
        'color': Colors.blue,
      },
      {
        'name': 'Miguel Rodriguez',
        'specialty': 'Classical Guitar',
        'experience': '12+ years',
        'students': '1.8k',
        'rating': 4.8,
        'avatar': 'M',
        'color': Colors.green,
      },
      {
        'name': 'Emma Chen',
        'specialty': 'Violin & Chamber Music',
        'experience': '10+ years',
        'students': '1.2k',
        'rating': 4.9,
        'avatar': 'E',
        'color': Colors.purple,
      },
      {
        'name': 'David Kim',
        'specialty': 'Jazz & Improvisation',
        'experience': '20+ years',
        'students': '3.1k',
        'rating': 4.7,
        'avatar': 'D',
        'color': Colors.orange,
      },
    ];

    final instructor = instructors[index];

    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: instructor['color'] as Color,
            child: Text(
              instructor['avatar'] as String,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            instructor['name'] as String,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            instructor['specialty'] as String,
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.star, color: Colors.amber, size: 12),
              const SizedBox(width: 2),
              Text(
                '${instructor['rating']}',
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '${instructor['students']} students',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPracticeChallenges(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Practice Challenges',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.orange.withOpacity(0.1), Colors.red.withOpacity(0.1)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.orange.withOpacity(0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.emoji_events, color: Colors.orange),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '30-Day Scale Challenge',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          'Master all major scales in 30 days',
                          style: TextStyle(color: Colors.grey),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      '5 days left',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const LinearProgressIndicator(
                value: 0.7,
                backgroundColor: Colors.orange,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.deepOrange),
              ),
              const SizedBox(height: 8),
              const Text(
                '21/30 days completed • 847 participants',
                style: TextStyle(
                  color: Colors.grey,
                  fontSize: 12,
                ),
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Joining practice challenge!')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                  ),
                  child: const Text('Continue Challenge'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLevelBadge(String level) {
    Color color;
    switch (level) {
      case 'Beginner':
        color = Colors.green;
        break;
      case 'Intermediate':
        color = Colors.orange;
        break;
      case 'Advanced':
        color = Colors.red;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        level,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  Widget _buildInstrumentBadge(String instrument) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        instrument,
        style: const TextStyle(
          color: Colors.blue,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  IconData _getInstrumentIcon(String instrument) {
    switch (instrument.toLowerCase()) {
      case 'piano':
        return Icons.piano;
      case 'guitar':
        return Icons.music_note;
      case 'violin':
        return Icons.music_note;
      case 'drums':
        return Icons.music_note;
      case 'voice':
        return Icons.mic;
      default:
        return Icons.music_note;
    }
  }

  List<Map<String, dynamic>> _getFilteredTutorials() {
    final allTutorials = [
      {
        'title': 'Piano Scales and Arpeggios Mastery',
        'instructor': 'Dr. Sarah Johnson',
        'instrument': 'Piano',
        'level': 'Intermediate',
        'duration': '45 min',
        'rating': 4.8,
        'students': '1.2k',
        'color': Colors.blue,
        'isPremium': false,
      },
      {
        'title': 'Guitar Fingerpicking Patterns',
        'instructor': 'Miguel Rodriguez',
        'instrument': 'Guitar',
        'level': 'Beginner',
        'duration': '32 min',
        'rating': 4.9,
        'students': '980',
        'color': Colors.green,
        'isPremium': true,
      },
      {
        'title': 'Violin Bow Technique Advanced',
        'instructor': 'Emma Chen',
        'instrument': 'Violin',
        'level': 'Advanced',
        'duration': '1h 15min',
        'rating': 4.7,
        'students': '654',
        'color': Colors.purple,
        'isPremium': false,
      },
      {
        'title': 'Jazz Improvisation Fundamentals',
        'instructor': 'David Kim',
        'instrument': 'Piano',
        'level': 'Intermediate',
        'duration': '58 min',
        'rating': 4.9,
        'students': '1.5k',
        'color': Colors.orange,
        'isPremium': true,
      },
    ];

    return allTutorials.where((tutorial) {
      if (_selectedInstrument != 'All' && tutorial['instrument'] != _selectedInstrument) {
        return false;
      }
      if (_selectedDifficulty != 'All' && tutorial['level'] != _selectedDifficulty) {
        return false;
      }
      return true;
    }).toList();
  }
}