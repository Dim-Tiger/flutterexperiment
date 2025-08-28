// This is a basic Flutter widget test for the Music Practice App.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:music_practice_app/main.dart';

void main() {
  testWidgets('Music Practice App smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify that the app starts with the home page
    expect(find.text('Welcome Back!'), findsOneWidget);
    expect(find.text('Share your musical journey'), findsOneWidget);

    // Verify that bottom navigation is present
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Practice'), findsOneWidget);
    expect(find.text('Community'), findsOneWidget);
    expect(find.text('Learn'), findsOneWidget);
    expect(find.text('Market'), findsOneWidget);

    // Test navigation to Practice Hub
    await tester.tap(find.text('Practice'));
    await tester.pumpAndSettle();

    // Verify Practice Hub page loads
    expect(find.text('Practice Hub'), findsOneWidget);
    expect(find.text('Build your musical skills'), findsOneWidget);

    // Test navigation to Community
    await tester.tap(find.text('Community'));
    await tester.pumpAndSettle();

    // Verify Community page loads
    expect(find.text('Community'), findsOneWidget);
    expect(find.text('Connect with fellow musicians'), findsOneWidget);

    // Test navigation to Tutorial page
    await tester.tap(find.text('Learn'));
    await tester.pumpAndSettle();

    // Verify Tutorial page loads
    expect(find.text('Learn & Grow'), findsOneWidget);
    expect(find.text('Expert tutorials and lessons'), findsOneWidget);

    // Test navigation to Marketplace
    await tester.tap(find.text('Market'));
    await tester.pumpAndSettle();

    // Verify Marketplace page loads
    expect(find.text('Marketplace'), findsOneWidget);
    expect(find.text('Buy & sell musical instruments'), findsOneWidget);

    // Return to home
    await tester.tap(find.text('Home'));
    await tester.pumpAndSettle();

    // Verify we're back at home
    expect(find.text('Welcome Back!'), findsOneWidget);
  });

  testWidgets('Upload section functionality test', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    // Find and tap the Upload Audio button
    final uploadAudioButton = find.text('Upload Audio');
    expect(uploadAudioButton, findsOneWidget);
    
    await tester.tap(uploadAudioButton);
    await tester.pumpAndSettle();

    // Verify snackbar appears
    expect(find.text('Audio upload feature coming soon!'), findsOneWidget);
  });

  testWidgets('Competition cards are displayed', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    // Verify competition section is present
    expect(find.text('Active Competitions'), findsOneWidget);
    expect(find.text('View All'), findsOneWidget);

    // Look for at least one competition card
    expect(find.byType(ElevatedButton), findsWidgets);
  });
}
