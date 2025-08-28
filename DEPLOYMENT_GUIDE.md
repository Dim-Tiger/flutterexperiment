# Music Practice Platform Deployment Guide

## 🔍 Backend and Frontend Integration Status

✅ **CONFIRMED: Backend and Frontend Work Together Well**

After thorough testing, the backend and frontend are well-integrated with:

- **Matching Architecture**: Backend APIs align with Flutter model expectations
- **Proper Error Handling**: Comprehensive error responses with consistent format
- **Security Features**: JWT authentication, rate limiting, input validation
- **Real-time Support**: Socket.IO integration for live features
- **File Upload Support**: Cloudinary integration for media storage
- **Production Ready**: Proper logging, monitoring, and graceful shutdown

### Integration Points Verified:
- ✅ Server startup and health endpoints
- ✅ Error handling middleware
- ✅ API route structure matches frontend expectations
- ✅ JSON serialization compatibility
- ✅ Security middleware configuration
- ✅ Real-time WebSocket setup

## 🚀 Backend Setup and Hosting Instructions

### Prerequisites

Before setting up the backend, ensure you have:

- **Node.js 18.0.0 or higher**
- **PostgreSQL 12 or higher**
- **Redis 6 or higher**
- **Cloudinary account** (for media storage)
- **SSL certificate** (for production HTTPS)

### 📋 Step-by-Step Setup

#### 1. Clone and Install Dependencies

```bash
git clone https://github.com/Dim-Tiger/flutterexperiment.git
cd flutterexperiment/backend
npm install
```

#### 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Configure your `.env` file with the following required variables:

```env
# Environment
NODE_ENV=production  # or development
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/music_practice_db
REDIS_URL=redis://localhost:6379

# JWT Configuration (IMPORTANT: Use strong secrets in production)
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-minimum-32-characters
JWT_REFRESH_EXPIRES_IN=30d

# Cloudinary Configuration (for media storage)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# CORS Configuration (Update with your frontend URL)
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=10485760      # 10MB
MAX_FILES_PER_REQUEST=5

# Optional: Stripe (for marketplace payments)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

#### 3. Database Setup

**Create the database:**
```sql
-- Connect to PostgreSQL and create database
CREATE DATABASE music_practice_db;
CREATE USER music_practice_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE music_practice_db TO music_practice_user;
```

**The application will automatically create all tables on startup.**

#### 4. Redis Setup

Ensure Redis is running:
```bash
# Ubuntu/Debian
sudo systemctl start redis-server
sudo systemctl enable redis-server

# CentOS/RHEL
sudo systemctl start redis
sudo systemctl enable redis

# Docker
docker run -d --name redis -p 6379:6379 redis:latest
```

#### 5. Cloudinary Setup

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get your cloud name, API key, and API secret
3. Add them to your `.env` file

#### 6. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 3000).

## 🐳 Docker Deployment

### Option 1: Using Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/music_practice_db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-production-jwt-secret-here
      - JWT_REFRESH_SECRET=your-production-refresh-secret-here
      - CLOUDINARY_CLOUD_NAME=your-cloud-name
      - CLOUDINARY_API_KEY=your-api-key
      - CLOUDINARY_API_SECRET=your-api-secret
      - ALLOWED_ORIGINS=https://your-domain.com
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=music_practice_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership and switch to non-root user
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["npm", "start"]
```

Deploy with:
```bash
docker-compose up -d
```

### Option 2: Standalone Docker

Build and run:
```bash
docker build -t music-practice-backend .
docker run -d \
  --name music-practice-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=your-database-url \
  -e REDIS_URL=your-redis-url \
  -e JWT_SECRET=your-jwt-secret \
  music-practice-backend
```

## ☁️ Cloud Platform Deployment

### AWS EC2 / DigitalOcean / VPS

1. **Launch instance** (minimum: 2GB RAM, 1 CPU)
2. **Install dependencies:**
   ```bash
   # Ubuntu 22.04
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs postgresql postgresql-contrib redis-server nginx certbot python3-certbot-nginx
   ```

3. **Setup application:**
   ```bash
   git clone https://github.com/Dim-Tiger/flutterexperiment.git
   cd flutterexperiment/backend
   npm install
   ```

4. **Configure services:**
   ```bash
   # Setup PostgreSQL
   sudo -u postgres createdb music_practice_db
   sudo -u postgres createuser music_practice_user
   
   # Setup systemd service
   sudo nano /etc/systemd/system/music-practice.service
   ```

5. **Create systemd service:**
   ```ini
   [Unit]
   Description=Music Practice Backend API
   After=network.target
   
   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/path/to/flutterexperiment/backend
   ExecStart=/usr/bin/node src/server.js
   Restart=always
   RestartSec=10
   Environment=NODE_ENV=production
   EnvironmentFile=/path/to/flutterexperiment/backend/.env
   
   [Install]
   WantedBy=multi-user.target
   ```

6. **Start services:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable music-practice
   sudo systemctl start music-practice
   ```

### Heroku Deployment

1. **Install Heroku CLI** and login
2. **Create app:**
   ```bash
   heroku create your-app-name
   ```

3. **Add add-ons:**
   ```bash
   heroku addons:create heroku-postgresql:mini
   heroku addons:create heroku-redis:mini
   ```

4. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-jwt-secret
   heroku config:set CLOUDINARY_CLOUD_NAME=your-cloud-name
   # ... add all other environment variables
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

### Railway Deployment

1. **Connect GitHub repo** to Railway
2. **Add PostgreSQL and Redis plugins**
3. **Set environment variables** in Railway dashboard
4. **Deploy automatically** from GitHub

### Vercel/Netlify (Serverless)

The current backend is designed for traditional server deployment. For serverless deployment, you would need to:

1. Refactor routes to serverless functions
2. Use managed database services (PlanetScale, Supabase)
3. Use managed Redis (Upstash)

## 🔒 Production Security Checklist

### Environment Security
- [ ] Use strong JWT secrets (minimum 32 characters)
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS only (SSL/TLS certificates)
- [ ] Configure proper CORS origins
- [ ] Set secure PostgreSQL credentials
- [ ] Use managed Redis with authentication

### Server Security
- [ ] Enable firewall (UFW/iptables)
- [ ] Close unused ports
- [ ] Use non-root user for application
- [ ] Set up automated security updates
- [ ] Configure fail2ban for intrusion prevention
- [ ] Regular security audits (`npm audit`)

### Database Security
- [ ] Use connection pooling
- [ ] Enable PostgreSQL logging
- [ ] Regular database backups
- [ ] Restrict database access to application only
- [ ] Use SSL for database connections in production

### Application Security
- [ ] Rate limiting is properly configured
- [ ] Input validation on all endpoints
- [ ] Proper error handling (no sensitive data leaks)
- [ ] File upload size limits
- [ ] CORS properly configured
- [ ] Helmet.js security headers

## 📊 Monitoring and Maintenance

### Health Monitoring

The API provides a health check endpoint:
```
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

### Logging

Application logs are written to:
- **Development**: Console output
- **Production**: Structured JSON logs

### Backup Strategy

1. **Database backups:**
   ```bash
   # Daily automated backup
   pg_dump -h localhost -U postgres music_practice_db > backup_$(date +%Y%m%d).sql
   ```

2. **Media backups:** Cloudinary automatically handles media storage and backup

3. **Code backups:** Git repository serves as code backup

### Performance Monitoring

1. **Install monitoring tools:**
   ```bash
   npm install --save pm2  # Process manager with monitoring
   ```

2. **Use PM2 for production:**
   ```bash
   pm2 start src/server.js --name music-practice-api
   pm2 startup
   pm2 save
   ```

3. **Monitor metrics:**
   - Response times
   - Memory usage
   - CPU usage
   - Database connection pool
   - Redis performance

## 🔧 Troubleshooting

### Common Issues

1. **Database connection fails:**
   - Check PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure database exists
   - Check firewall settings

2. **Redis connection fails:**
   - Check Redis is running
   - Verify REDIS_URL format
   - Check Redis configuration

3. **File uploads fail:**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper CORS configuration

4. **JWT errors:**
   - Verify JWT_SECRET is set
   - Check JWT_EXPIRES_IN format
   - Ensure token is not expired

### Debugging

1. **Enable debug logs:**
   ```bash
   DEBUG=* npm start
   ```

2. **Check application logs:**
   ```bash
   pm2 logs music-practice-api
   ```

3. **Database debugging:**
   ```bash
   psql -h localhost -U postgres -d music_practice_db
   ```

## 🔄 Updates and Maintenance

### Regular Updates

1. **Update dependencies:**
   ```bash
   npm audit fix
   npm update
   ```

2. **Database migrations:** The application handles schema creation automatically

3. **Server maintenance:**
   - Regular security patches
   - Log rotation
   - Disk space monitoring

### Scaling Considerations

As your application grows, consider:

1. **Horizontal scaling:** Multiple application instances behind a load balancer
2. **Database optimization:** Read replicas, connection pooling, indexing
3. **Redis clustering:** For high-availability caching
4. **CDN integration:** For static content delivery
5. **Monitoring tools:** New Relic, DataDog, or custom monitoring

## 📞 Support

For deployment issues or questions:

1. Check the application logs first
2. Review this deployment guide
3. Test the health endpoint
4. Verify environment configuration
5. Check external service connectivity (PostgreSQL, Redis, Cloudinary)

The backend is production-ready and battle-tested with proper error handling, security features, and monitoring capabilities.