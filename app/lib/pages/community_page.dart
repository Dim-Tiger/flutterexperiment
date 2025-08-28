import 'package:flutter/material.dart';

class CommunityPage extends StatefulWidget {
  const CommunityPage({super.key});

  @override
  State<CommunityPage> createState() => _CommunityPageState();
}

class _CommunityPageState extends State<CommunityPage> {
  String _selectedCategory = 'All';
  final TextEditingController _postController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: Column(
          children: [
            // Header
            _buildHeader(context),
            
            // Category Filter
            _buildCategoryFilter(context),
            
            // Posts Feed
            Expanded(
              child: _buildPostsFeed(context),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreatePostDialog(context),
        child: const Icon(Icons.add),
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
                'Community',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                ),
              ),
              Text(
                'Connect with fellow musicians',
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
              Icons.forum,
              color: Theme.of(context).primaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryFilter(BuildContext context) {
    final categories = ['All', 'Tips', 'Questions', 'Technique', 'Inspiration', 'Gear'];
    
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          final isSelected = _selectedCategory == category;
          
          return Container(
            margin: const EdgeInsets.only(right: 12),
            child: FilterChip(
              label: Text(category),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  _selectedCategory = category;
                });
              },
              backgroundColor: Colors.white,
              selectedColor: Theme.of(context).primaryColor.withOpacity(0.2),
              checkmarkColor: Theme.of(context).primaryColor,
              labelStyle: TextStyle(
                color: isSelected ? Theme.of(context).primaryColor : Colors.grey[700],
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPostsFeed(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _getFilteredPosts().length,
      itemBuilder: (context, index) {
        return _buildPostCard(context, _getFilteredPosts()[index]);
      },
    );
  }

  Widget _buildPostCard(BuildContext context, Map<String, dynamic> post) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
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
          // User Info
          Row(
            children: [
              CircleAvatar(
                backgroundColor: post['userColor'] as Color,
                child: Text(
                  post['userInitial'] as String,
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
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            post['userName'] as String,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        _buildCategoryBadge(post['category'] as String),
                      ],
                    ),
                    Text(
                      post['timeAgo'] as String,
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () {
                  // More options
                },
                icon: Icon(Icons.more_vert, color: Colors.grey[400]),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Post Content
          Text(
            post['title'] as String,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            post['content'] as String,
            style: TextStyle(
              color: Colors.grey[700],
              height: 1.4,
            ),
          ),
          
          // Media if exists
          if (post['hasImage'] == true) ...[
            const SizedBox(height: 12),
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Center(
                child: Icon(
                  Icons.image,
                  size: 48,
                  color: Colors.grey,
                ),
              ),
            ),
          ],
          
          const SizedBox(height: 16),
          
          // Engagement Bar
          Row(
            children: [
              _buildEngagementButton(
                Icons.thumb_up_outlined,
                '${post['likes']}',
                () {
                  // Handle like
                },
              ),
              const SizedBox(width: 16),
              _buildEngagementButton(
                Icons.chat_bubble_outline,
                '${post['comments']}',
                () {
                  _showCommentsSheet(context, post);
                },
              ),
              const SizedBox(width: 16),
              _buildEngagementButton(
                Icons.share_outlined,
                'Share',
                () {
                  // Handle share
                },
              ),
              const Spacer(),
              _buildEngagementButton(
                Icons.bookmark_outline,
                '',
                () {
                  // Handle bookmark
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryBadge(String category) {
    final colors = {
      'Tips': Colors.green,
      'Questions': Colors.blue,
      'Technique': Colors.purple,
      'Inspiration': Colors.orange,
      'Gear': Colors.teal,
    };
    
    final color = colors[category] ?? Colors.grey;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        category,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildEngagementButton(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 18,
              color: Colors.grey[600],
            ),
            if (label.isNotEmpty) ...[
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 14,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  List<Map<String, dynamic>> _getFilteredPosts() {
    final allPosts = [
      {
        'userName': 'Sarah Chen',
        'userInitial': 'S',
        'userColor': Colors.pink,
        'timeAgo': '2 hours ago',
        'category': 'Tips',
        'title': 'Piano Practice Schedule That Actually Works',
        'content': 'After years of struggling with consistency, I found a practice routine that keeps me motivated. Here\'s what works for me: Start with 10 minutes of scales, then work on technique for 15 minutes...',
        'likes': 24,
        'comments': 8,
        'hasImage': false,
      },
      {
        'userName': 'Alex Rodriguez',
        'userInitial': 'A',
        'userColor': Colors.blue,
        'timeAgo': '5 hours ago',
        'category': 'Questions',
        'title': 'How to overcome performance anxiety?',
        'content': 'I get so nervous before performing that my hands shake. Does anyone have tips for managing stage fright? I\'ve been playing guitar for 3 years but still struggle with this.',
        'likes': 15,
        'comments': 12,
        'hasImage': false,
      },
      {
        'userName': 'Emma Wilson',
        'userInitial': 'E',
        'userColor': Colors.green,
        'timeAgo': '1 day ago',
        'category': 'Technique',
        'title': 'Violin Bow Technique Breakthrough',
        'content': 'Finally mastered the spiccato technique! It took months of practice but here\'s the exercise that made it click. The key is starting very slowly...',
        'likes': 31,
        'comments': 6,
        'hasImage': true,
      },
      {
        'userName': 'Michael Kim',
        'userInitial': 'M',
        'userColor': Colors.orange,
        'timeAgo': '2 days ago',
        'category': 'Inspiration',
        'title': 'Just performed my first solo!',
        'content': 'After 6 months of preparation, I finally performed Chopin\'s Nocturne in E-flat major. The feeling was incredible! Thank you to this community for all the encouragement.',
        'likes': 67,
        'comments': 18,
        'hasImage': true,
      },
      {
        'userName': 'Lisa Park',
        'userInitial': 'L',
        'userColor': Colors.purple,
        'timeAgo': '3 days ago',
        'category': 'Gear',
        'title': 'Best practice mute for violin?',
        'content': 'Looking for recommendations for a good practice mute. I live in an apartment and need something that significantly reduces volume without affecting intonation too much.',
        'likes': 9,
        'comments': 14,
        'hasImage': false,
      },
    ];

    if (_selectedCategory == 'All') {
      return allPosts;
    } else {
      return allPosts.where((post) => post['category'] == _selectedCategory).toList();
    }
  }

  void _showCreatePostDialog(BuildContext context) {
    String selectedCategory = 'Tips';
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.only(
          top: 20,
          left: 20,
          right: 20,
          bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Create Post',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 20),
            
            // Category Selector
            Text(
              'Category',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 8),
            StatefulBuilder(
              builder: (context, setModalState) => DropdownButtonFormField<String>(
                value: selectedCategory,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                ),
                items: ['Tips', 'Questions', 'Technique', 'Inspiration', 'Gear']
                    .map((category) => DropdownMenuItem(
                          value: category,
                          child: Text(category),
                        ))
                    .toList(),
                onChanged: (value) {
                  setModalState(() {
                    selectedCategory = value!;
                  });
                },
              ),
            ),
            const SizedBox(height: 20),
            
            // Title Input
            Text(
              'Title',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 8),
            const TextField(
              decoration: InputDecoration(
                hintText: 'Enter post title...',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),
            
            // Content Input
            Text(
              'Content',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: TextField(
                controller: _postController,
                maxLines: null,
                expands: true,
                decoration: const InputDecoration(
                  hintText: 'Share your thoughts, tips, or questions...',
                  border: OutlineInputBorder(),
                  alignLabelWithHint: true,
                ),
              ),
            ),
            const SizedBox(height: 20),
            
            // Action Buttons
            Row(
              children: [
                OutlinedButton.icon(
                  onPressed: () {
                    // Add image
                  },
                  icon: const Icon(Icons.image),
                  label: const Text('Add Image'),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Post created successfully!')),
                      );
                    },
                    child: const Text('Post'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showCommentsSheet(BuildContext context, Map<String, dynamic> post) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Handle
            Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  const Text(
                    'Comments',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${post['comments']} comments',
                    style: TextStyle(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(),
            
            // Comments List
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: 3, // Mock comments
                itemBuilder: (context, index) {
                  return _buildCommentItem(context, index);
                },
              ),
            ),
            
            // Comment Input
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                border: Border(top: BorderSide(color: Colors.grey.shade200)),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 16,
                    backgroundColor: Colors.blue,
                    child: Text('Y', style: TextStyle(color: Colors.white)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      decoration: InputDecoration(
                        hintText: 'Write a comment...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () {
                      // Send comment
                    },
                    icon: Icon(
                      Icons.send,
                      color: Theme.of(context).primaryColor,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCommentItem(BuildContext context, int index) {
    final comments = [
      {
        'user': 'John Doe',
        'initial': 'J',
        'color': Colors.teal,
        'comment': 'Great tips! I\'ve been struggling with consistency too.',
        'time': '1h ago',
      },
      {
        'user': 'Anna Smith',
        'initial': 'A',
        'color': Colors.red,
        'comment': 'This is exactly what I needed to hear. Thank you for sharing!',
        'time': '3h ago',
      },
      {
        'user': 'David Lee',
        'initial': 'D',
        'color': Colors.indigo,
        'comment': 'Have you tried the Pomodoro technique for practice sessions?',
        'time': '5h ago',
      },
    ];

    final comment = comments[index];

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: comment['color'] as Color,
            child: Text(
              comment['initial'] as String,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      comment['user'] as String,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      comment['time'] as String,
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  comment['comment'] as String,
                  style: TextStyle(
                    color: Colors.grey[700],
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}