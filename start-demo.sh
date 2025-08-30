#!/bin/bash

# Music Practice App - Development Startup Script
# This script starts the backend demo server for development and testing

echo "🎵 Starting Music Practice App Backend Demo..."
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to continue."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm to continue."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Navigate to backend directory
cd backend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

echo "🚀 Starting backend demo server..."
echo "📊 API will be available at: http://localhost:5000/api"
echo "🔗 Health check: http://localhost:5000/health"
echo ""
echo "Available endpoints:"
echo "  POST /api/auth/register - User registration"
echo "  POST /api/auth/login - User login"
echo "  GET  /api/competitions - Get competitions"
echo "  GET  /api/community/posts - Get community posts"
echo "  POST /api/community/posts - Create community post (requires auth)"
echo "  GET  /api/tutorials - Get tutorials"
echo "  GET  /api/marketplace - Get marketplace items"
echo "  GET  /api/practice - Get practice sessions"
echo "  POST /api/practice - Create practice session (requires auth)"
echo "  GET  /api/search?q=query - Search content"
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================================"

# Start the demo server
npm run demo