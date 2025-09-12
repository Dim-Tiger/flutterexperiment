import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/app_state.dart';

class AuthPage extends StatefulWidget {
  const AuthPage({super.key});

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  bool _isLogin = true;
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _bioController = TextEditingController();
  
  List<String> _selectedInstruments = [];
  String _selectedSkillLevel = 'Beginner';
  
  final List<String> _availableInstruments = [
    'Piano', 'Guitar', 'Violin', 'Drums', 'Bass', 'Saxophone', 'Trumpet', 'Flute', 'Cello', 'Viola'
  ];
  
  final List<String> _skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Consumer<AppState>(
          builder: (context, appState, child) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 60),
                    
                    // App Logo and Title
                    const Icon(
                      Icons.music_note,
                      size: 80,
                      color: Color(0xFF6366F1),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Music Practice\nCommunity',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF6366F1),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _isLogin 
                        ? 'Welcome back! Sign in to continue your musical journey.'
                        : 'Join our community of musicians and take your practice to the next level.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                    
                    const SizedBox(height: 48),
                    
                    // Form Fields
                    if (!_isLogin) ...[
                      TextFormField(
                        controller: _nameController,
                        decoration: const InputDecoration(
                          labelText: 'Full Name',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your name';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                    ],
                    
                    TextFormField(
                      controller: _emailController,
                      decoration: const InputDecoration(
                        labelText: 'Email Address',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your email';
                        }
                        if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(value)) {
                          return 'Please enter a valid email';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    
                    TextFormField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'Password',
                        prefixIcon: Icon(Icons.lock_outline),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your password';
                        }
                        if (!_isLogin && value.length < 6) {
                          return 'Password must be at least 6 characters';
                        }
                        return null;
                      },
                    ),
                    
                    if (!_isLogin) ...[
                      const SizedBox(height: 24),
                      
                      // Instruments Selection
                      Text(
                        'Instruments You Play',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _availableInstruments.map((instrument) {
                          final isSelected = _selectedInstruments.contains(instrument);
                          return FilterChip(
                            label: Text(instrument),
                            selected: isSelected,
                            onSelected: (selected) {
                              setState(() {
                                if (selected) {
                                  _selectedInstruments.add(instrument);
                                } else {
                                  _selectedInstruments.remove(instrument);
                                }
                              });
                            },
                          );
                        }).toList(),
                      ),
                      
                      const SizedBox(height: 24),
                      
                      // Skill Level
                      Text(
                        'Skill Level',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: _selectedSkillLevel,
                        decoration: const InputDecoration(
                          prefixIcon: Icon(Icons.trending_up_outlined),
                        ),
                        items: _skillLevels.map((level) {
                          return DropdownMenuItem(
                            value: level,
                            child: Text(level),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() {
                            _selectedSkillLevel = value!;
                          });
                        },
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Bio
                      TextFormField(
                        controller: _bioController,
                        decoration: const InputDecoration(
                          labelText: 'Bio (Optional)',
                          prefixIcon: Icon(Icons.edit_outlined),
                          hintText: 'Tell us about your musical journey...',
                        ),
                        maxLines: 3,
                      ),
                    ],
                    
                    const SizedBox(height: 32),
                    
                    // Error Message
                    if (appState.errorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red[200]!),
                        ),
                        child: Text(
                          appState.errorMessage!,
                          style: TextStyle(color: Colors.red[700]),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    
                    // Submit Button
                    ElevatedButton(
                      onPressed: appState.isLoading ? null : _handleSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6366F1),
                        foregroundColor: Colors.white,
                        minimumSize: const Size(double.infinity, 56),
                      ),
                      child: appState.isLoading 
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text(
                            _isLogin ? 'Sign In' : 'Create Account',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Toggle between login and register
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          _isLogin 
                            ? "Don't have an account? "
                            : "Already have an account? ",
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _isLogin = !_isLogin;
                              // Clear form when switching
                              _formKey.currentState?.reset();
                              _selectedInstruments.clear();
                              _selectedSkillLevel = 'Beginner';
                            });
                          },
                          child: Text(
                            _isLogin ? 'Sign Up' : 'Sign In',
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF6366F1),
                            ),
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (!_isLogin && _selectedInstruments.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one instrument'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final appState = Provider.of<AppState>(context, listen: false);

    bool success;
    if (_isLogin) {
      success = await appState.login(
        _emailController.text.trim(),
        _passwordController.text,
      );
    } else {
      success = await appState.register(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        instruments: _selectedInstruments,
        skillLevel: _selectedSkillLevel,
        bio: _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
      );
    }

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _isLogin 
              ? 'Welcome back!' 
              : 'Account created successfully! Welcome to the community!',
          ),
          backgroundColor: Colors.green,
        ),
      );
    }
  }
}