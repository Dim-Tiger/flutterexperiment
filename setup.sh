#!/bin/bash

# Music Practice Platform - Quick Setup Script
# This script helps set up the development environment quickly

echo "🎵 Music Practice Platform - Quick Setup"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "\n${BLUE}Checking prerequisites...${NC}"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"
    
    # Check if version is 18 or higher
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo -e "${YELLOW}⚠️  Node.js version should be 18 or higher${NC}"
    fi
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/${NC}"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm found: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

# Check Docker (optional)
if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ Docker found: $DOCKER_VERSION${NC}"
    DOCKER_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  Docker not found (optional for containerized setup)${NC}"
    DOCKER_AVAILABLE=false
fi

# Check PostgreSQL (optional)
if command_exists psql; then
    POSTGRES_VERSION=$(psql --version)
    echo -e "${GREEN}✅ PostgreSQL found: $POSTGRES_VERSION${NC}"
    POSTGRES_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  PostgreSQL not found (can use Docker instead)${NC}"
    POSTGRES_AVAILABLE=false
fi

# Check Redis (optional)
if command_exists redis-cli; then
    echo -e "${GREEN}✅ Redis CLI found${NC}"
    REDIS_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  Redis not found (can use Docker instead)${NC}"
    REDIS_AVAILABLE=false
fi

echo -e "\n${BLUE}Setting up backend...${NC}"

# Navigate to backend directory
cd backend || {
    echo -e "${RED}❌ Backend directory not found${NC}"
    exit 1
}

# Install dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi

# Set up environment file
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Environment file created${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env file with your configuration${NC}"
else
    echo -e "${GREEN}✅ Environment file already exists${NC}"
fi

echo -e "\n${BLUE}Setup Options:${NC}"
echo "1. Docker Compose (Recommended - includes database)"
echo "2. Local Development (requires manual database setup)"
echo "3. Quick Test (without database - API only)"

read -p "Choose setup option (1-3): " SETUP_OPTION

case $SETUP_OPTION in
    1)
        if [ "$DOCKER_AVAILABLE" = true ]; then
            echo -e "\n${YELLOW}Setting up with Docker Compose...${NC}"
            cd ..
            
            # Update docker-compose.yml with development settings
            echo -e "${YELLOW}Starting services with Docker Compose...${NC}"
            docker-compose up -d db redis
            
            echo -e "${GREEN}✅ Database and Redis started with Docker${NC}"
            echo -e "${YELLOW}Starting backend server...${NC}"
            
            cd backend
            npm run dev &
            BACKEND_PID=$!
            
            echo -e "${GREEN}✅ Backend server started (PID: $BACKEND_PID)${NC}"
            echo -e "${BLUE}Server running at: http://localhost:3000${NC}"
            echo -e "${BLUE}Health check: http://localhost:3000/health${NC}"
            
        else
            echo -e "${RED}❌ Docker not available. Please install Docker or choose option 2${NC}"
            exit 1
        fi
        ;;
    2)
        echo -e "\n${YELLOW}Setting up for local development...${NC}"
        
        if [ "$POSTGRES_AVAILABLE" = false ] || [ "$REDIS_AVAILABLE" = false ]; then
            echo -e "${YELLOW}⚠️  You'll need to set up PostgreSQL and Redis manually${NC}"
            echo -e "${YELLOW}   PostgreSQL: https://www.postgresql.org/download/${NC}"
            echo -e "${YELLOW}   Redis: https://redis.io/download${NC}"
        fi
        
        echo -e "${YELLOW}Please update your .env file with database credentials${NC}"
        echo -e "${YELLOW}Then run: npm run dev${NC}"
        ;;
    3)
        echo -e "\n${YELLOW}Starting backend in test mode (no database)...${NC}"
        npm run dev &
        BACKEND_PID=$!
        
        echo -e "${GREEN}✅ Backend server started in test mode (PID: $BACKEND_PID)${NC}"
        echo -e "${BLUE}Server running at: http://localhost:3000${NC}"
        echo -e "${BLUE}Health check: http://localhost:3000/health${NC}"
        echo -e "${YELLOW}⚠️  API endpoints will return database errors until database is connected${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

echo -e "\n${BLUE}Testing setup...${NC}"
sleep 3

# Test health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend server is responding${NC}"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "${YELLOW}⚠️  Backend server not yet responding (may need more time to start)${NC}"
fi

echo -e "\n${GREEN}🎉 Setup Complete!${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Visit http://localhost:3000/health to verify the server"
echo "2. Review DEPLOYMENT_GUIDE.md for production setup"
echo "3. Configure your Flutter app to use the backend API"
echo "4. Set up Cloudinary for file uploads (optional)"
echo "5. Configure Stripe for marketplace features (optional)"

echo -e "\n${YELLOW}Quick Commands:${NC}"
echo "• Test integration: ./test-integration.sh"
echo "• Stop backend: kill $BACKEND_PID (if running)"
echo "• View logs: docker-compose logs -f api (if using Docker)"
echo "• Stop all services: docker-compose down (if using Docker)"

echo -e "\n${BLUE}Documentation:${NC}"
echo "• Backend API: http://localhost:3000/health"
echo "• Deployment Guide: ./DEPLOYMENT_GUIDE.md"
echo "• Frontend README: ./app/README.md"
echo "• Backend README: ./backend/README.md"