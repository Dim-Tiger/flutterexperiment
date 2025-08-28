import 'package:flutter/material.dart';

/// Custom App Bar widget that can be reused across pages
class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final List<Widget>? actions;

  const CustomAppBar({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
    this.actions,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 20,
            ),
          ),
          if (subtitle != null)
            Text(
              subtitle!,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
                fontWeight: FontWeight.normal,
              ),
            ),
        ],
      ),
      actions: [
        if (trailing != null) trailing!,
        if (actions != null) ...actions!,
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

/// Reusable card widget for consistent styling
class MusicCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final Color? backgroundColor;
  final double? elevation;
  final BorderRadius? borderRadius;

  const MusicCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.backgroundColor,
    this.elevation,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: backgroundColor ?? Colors.white,
        borderRadius: borderRadius ?? BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: elevation ?? 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: borderRadius ?? BorderRadius.circular(16),
          child: Padding(
            padding: padding ?? const EdgeInsets.all(16),
            child: child,
          ),
        ),
      ),
    );
  }
}

/// Custom badge widget for displaying categories, levels, etc.
class MusicBadge extends StatelessWidget {
  final String text;
  final Color backgroundColor;
  final Color textColor;
  final EdgeInsetsGeometry? padding;
  final double? fontSize;

  const MusicBadge({
    super.key,
    required this.text,
    required this.backgroundColor,
    required this.textColor,
    this.padding,
    this.fontSize,
  });

  factory MusicBadge.level(String level) {
    Color color;
    switch (level.toLowerCase()) {
      case 'beginner':
        color = Colors.green;
        break;
      case 'intermediate':
        color = Colors.orange;
        break;
      case 'advanced':
        color = Colors.red;
        break;
      default:
        color = Colors.grey;
    }

    return MusicBadge(
      text: level,
      backgroundColor: color.withOpacity(0.1),
      textColor: color,
    );
  }

  factory MusicBadge.category(String category) {
    final colors = {
      'tips': Colors.green,
      'questions': Colors.blue,
      'technique': Colors.purple,
      'inspiration': Colors.orange,
      'gear': Colors.teal,
    };

    final color = colors[category.toLowerCase()] ?? Colors.grey;

    return MusicBadge(
      text: category,
      backgroundColor: color.withOpacity(0.1),
      textColor: color,
    );
  }

  factory MusicBadge.instrument(String instrument) {
    return MusicBadge(
      text: instrument,
      backgroundColor: Colors.blue.withOpacity(0.1),
      textColor: Colors.blue,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor,
          fontSize: fontSize ?? 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

/// Loading widget for consistent loading states
class MusicLoadingWidget extends StatelessWidget {
  final String? message;

  const MusicLoadingWidget({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(
            color: Theme.of(context).primaryColor,
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 16,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Empty state widget for when there's no content
class MusicEmptyState extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final String? actionText;
  final VoidCallback? onAction;

  const MusicEmptyState({
    super.key,
    required this.title,
    required this.description,
    required this.icon,
    this.actionText,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              description,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            if (actionText != null && onAction != null) ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onAction,
                child: Text(actionText!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// User avatar widget with initials fallback
class UserAvatar extends StatelessWidget {
  final String? imageUrl;
  final String initials;
  final Color? backgroundColor;
  final double radius;

  const UserAvatar({
    super.key,
    this.imageUrl,
    required this.initials,
    this.backgroundColor,
    this.radius = 20,
  });

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: backgroundColor ?? Theme.of(context).primaryColor,
      backgroundImage: imageUrl != null ? NetworkImage(imageUrl!) : null,
      child: imageUrl == null
          ? Text(
              initials,
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: radius * 0.6,
              ),
            )
          : null,
    );
  }
}

/// Progress indicator for practice sessions, goals, etc.
class MusicProgressIndicator extends StatelessWidget {
  final double progress;
  final Color? color;
  final String? label;
  final String? valueText;

  const MusicProgressIndicator({
    super.key,
    required this.progress,
    this.color,
    this.label,
    this.valueText,
  });

  @override
  Widget build(BuildContext context) {
    final progressColor = color ?? Theme.of(context).primaryColor;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null || valueText != null)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (label != null)
                Text(
                  label!,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
              if (valueText != null)
                Text(
                  valueText!,
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                  ),
                ),
            ],
          ),
        if (label != null || valueText != null) const SizedBox(height: 8),
        LinearProgressIndicator(
          value: progress,
          backgroundColor: progressColor.withOpacity(0.2),
          valueColor: AlwaysStoppedAnimation<Color>(progressColor),
        ),
      ],
    );
  }
}

/// Utility class for common music-related icons and colors
class MusicUtils {
  static IconData getInstrumentIcon(String instrument) {
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
      case 'vocal':
        return Icons.mic;
      case 'trumpet':
      case 'trombone':
      case 'saxophone':
        return Icons.music_note;
      default:
        return Icons.music_note;
    }
  }

  static Color getLevelColor(String level) {
    switch (level.toLowerCase()) {
      case 'beginner':
        return Colors.green;
      case 'intermediate':
        return Colors.orange;
      case 'advanced':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  static Color getCategoryColor(String category) {
    final colors = {
      'tips': Colors.green,
      'questions': Colors.blue,
      'technique': Colors.purple,
      'inspiration': Colors.orange,
      'gear': Colors.teal,
      'competition': Colors.amber,
      'practice': Colors.indigo,
    };

    return colors[category.toLowerCase()] ?? Colors.grey;
  }

  static String formatDuration(int seconds) {
    int hours = seconds ~/ 3600;
    int minutes = (seconds % 3600) ~/ 60;
    int remainingSeconds = seconds % 60;

    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
    } else {
      return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
    }
  }

  static String formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

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
}