import 'package:flutter/material.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome Back!',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.grey[800],
                        ),
                      ),
                      Text(
                        'Share your musical journey',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: Theme.of(context).primaryColor,
                    child: const Icon(Icons.person, color: Colors.white),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Upload Section
              _buildUploadSection(context),
              const SizedBox(height: 24),

              // Active Competitions
              _buildCompetitionsSection(context),
              const SizedBox(height: 24),

              // Recent Activity Feed
              _buildActivityFeed(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUploadSection(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).primaryColor.withOpacity(0.1),
            Theme.of(context).primaryColor.withOpacity(0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).primaryColor.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.upload, color: Theme.of(context).primaryColor),
              const SizedBox(width: 8),
              Text(
                'Share Your Progress',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Upload your latest performance or practice session to track your musical journey and get feedback from the community.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    // Upload audio functionality
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Audio upload feature coming soon!')),
                    );
                  },
                  icon: const Icon(Icons.audiotrack),
                  label: const Text('Upload Audio'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    // Upload video functionality
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Video upload feature coming soon!')),
                    );
                  },
                  icon: const Icon(Icons.videocam),
                  label: const Text('Upload Video'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCompetitionsSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Active Competitions',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton(
              onPressed: () {
                // View all competitions
              },
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 180,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: 3,
            itemBuilder: (context, index) {
              return _buildCompetitionCard(context, index);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildCompetitionCard(BuildContext context, int index) {
    final competitions = [
      {
        'title': 'Piano Solo Challenge',
        'genre': 'Classical',
        'level': 'Intermediate',
        'prize': 'Masterclass with Vienna Philharmonic',
        'deadline': '15 days left',
        'color': Colors.blue,
      },
      {
        'title': 'Jazz Improvisation',
        'genre': 'Jazz',
        'level': 'Advanced',
        'prize': 'Recording Session Prize',
        'deadline': '8 days left',
        'color': Colors.purple,
      },
      {
        'title': 'Young Violinist',
        'genre': 'Classical',
        'level': 'Beginner',
        'prize': 'Instrument Scholarship',
        'deadline': '22 days left',
        'color': Colors.green,
      },
    ];

    final competition = competitions[index];

    return Container(
      width: 280,
      margin: const EdgeInsets.only(right: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (competition['color'] as Color).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.emoji_events,
                  color: competition['color'] as Color,
                  size: 20,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  competition['deadline'] as String,
                  style: const TextStyle(
                    color: Colors.orange,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            competition['title'] as String,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildTag(competition['genre'] as String, Colors.blue.shade100, Colors.blue),
                const SizedBox(width: 8),
                _buildTag(competition['level'] as String, Colors.green.shade100, Colors.green),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            competition['prize'] as String,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey[600],
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                // Join competition
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Joining ${competition['title']} competition!')),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: competition['color'] as Color,
                foregroundColor: Colors.white,
              ),
              child: const Text('Join Competition'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTag(String text, Color backgroundColor, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildActivityFeed(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent Activity',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: 4,
          itemBuilder: (context, index) {
            return _buildActivityItem(context, index);
          },
        ),
      ],
    );
  }

  Widget _buildActivityItem(BuildContext context, int index) {
    final activities = [
      {
        'user': 'Sarah Chen',
        'action': 'uploaded a piano performance',
        'time': '2 hours ago',
        'avatar': 'S',
        'color': Colors.pink,
      },
      {
        'user': 'Alex Johnson',
        'action': 'won the Jazz Guitar Challenge',
        'time': '1 day ago',
        'avatar': 'A',
        'color': Colors.blue,
      },
      {
        'user': 'Maria Rodriguez',
        'action': 'shared practice tips for violin',
        'time': '2 days ago',
        'avatar': 'M',
        'color': Colors.green,
      },
      {
        'user': 'David Kim',
        'action': 'started a 30-day practice streak',
        'time': '3 days ago',
        'avatar': 'D',
        'color': Colors.orange,
      },
    ];

    final activity = activities[index];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
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
          CircleAvatar(
            backgroundColor: activity['color'] as Color,
            child: Text(
              activity['avatar'] as String,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: TextSpan(
                    style: Theme.of(context).textTheme.bodyMedium,
                    children: [
                      TextSpan(
                        text: activity['user'] as String,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      TextSpan(text: ' ${activity['action']}'),
                    ],
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  activity['time'] as String,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.more_vert,
            color: Colors.grey[400],
          ),
        ],
      ),
    );
  }
}