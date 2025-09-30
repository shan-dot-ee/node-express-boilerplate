# Deployment Guide

This guide covers deploying the Node.js Express API to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [PM2 Deployment](#pm2-deployment)
- [Docker Deployment](#docker-deployment)
- [Cloud Platform Guides](#cloud-platform-guides)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js >= 12.0.0
- PostgreSQL 12+
- Domain name (for production)
- SSL certificate (Let's Encrypt recommended)

## Environment Configuration

### Production Environment Variables

Create a `.env` file with production values:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/production_db

# JWT Configuration
JWT_SECRET=your-super-secure-random-secret-key-here
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30
JWT_RESET_PASSWORD_EXPIRATION_MINUTES=10
JWT_VERIFY_EMAIL_EXPIRATION_MINUTES=10

# Email Configuration (SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

**Security Checklist:**
- ✅ Use strong random JWT secret (32+ characters)
- ✅ Never commit `.env` to version control
- ✅ Use environment-specific databases
- ✅ Enable rate limiting in production
- ✅ Use HTTPS only
- ✅ Configure CORS properly

## PM2 Deployment

PM2 is a production process manager for Node.js applications.

### Installation

```bash
npm install pm2 -g
```

### Configuration

The project includes `ecosystem.config.json`:

```json
{
  "apps": [
    {
      "name": "node-api",
      "script": "src/index.js",
      "instances": "max",
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production"
      }
    }
  ]
}
```

### Deploy with PM2

```bash
# Start application
pm2 start ecosystem.config.json

# Start with specific instances
pm2 start ecosystem.config.json -i 4

# View logs
pm2 logs

# Monitor
pm2 monit

# Restart
pm2 restart node-api

# Stop
pm2 stop node-api

# Delete from PM2
pm2 delete node-api

# Save PM2 configuration
pm2 save

# Setup PM2 startup script (auto-restart on reboot)
pm2 startup
# Follow the instructions shown
```

### Zero-Downtime Deployment

```bash
# Update code
git pull origin main

# Install dependencies
yarn install --production

# Run database migrations
npx sequelize-cli db:migrate

# Reload app (zero-downtime)
pm2 reload node-api
```

## Docker Deployment

### Production Dockerfile

The included `Dockerfile` is optimized for production:

```dockerfile
FROM node:18-alpine
WORKDIR /usr/src/node-app
COPY package*.json ./
RUN yarn install --production
COPY . .
EXPOSE 3000
CMD ["yarn", "start"]
```

### Docker Compose Production

```bash
# Start production environment
yarn docker:prod

# Or manually:
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Deploy to Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml node-api

# Scale services
docker service scale node-api_node-app=3

# View services
docker service ls

# View logs
docker service logs node-api_node-app
```

## Cloud Platform Guides

### Heroku

**1. Install Heroku CLI**
```bash
brew install heroku/brew/heroku  # macOS
# or download from https://devcenter.heroku.com/articles/heroku-cli
```

**2. Login and Create App**
```bash
heroku login
heroku create your-app-name
```

**3. Add PostgreSQL**
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

**4. Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
heroku config:set SMTP_HOST=smtp.sendgrid.net
# ... set all required variables
```

**5. Deploy**
```bash
git push heroku main

# Run migrations
heroku run npx sequelize-cli db:migrate

# View logs
heroku logs --tail
```

### AWS (EC2 + RDS)

**1. Launch EC2 Instance**
- Choose Ubuntu Server 20.04 LTS
- Select t2.micro or larger
- Configure Security Group (allow ports 22, 80, 443)

**2. Create RDS PostgreSQL Instance**
- Choose PostgreSQL version 12+
- Note endpoint URL

**3. Connect to EC2**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

**4. Install Dependencies**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

**5. Deploy Application**
```bash
# Clone repository
git clone your-repo-url
cd your-app

# Install dependencies
npm install --production

# Setup environment variables
nano .env  # Add production values

# Run migrations
npx sequelize-cli db:migrate

# Start with PM2
pm2 start ecosystem.config.json
pm2 startup
pm2 save
```

**6. Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/default
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### DigitalOcean

**Using App Platform:**

1. Connect GitHub repository
2. Select branch to deploy
3. Configure environment variables
4. Add PostgreSQL database
5. Deploy automatically

**Manual Deployment (Droplet):**

Similar to AWS EC2 steps above.

### Google Cloud Platform (Cloud Run)

**1. Build Container**
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/node-api
```

**2. Deploy**
```bash
gcloud run deploy node-api \
  --image gcr.io/PROJECT_ID/node-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**3. Set Environment Variables**
```bash
gcloud run services update node-api \
  --set-env-vars="NODE_ENV=production,JWT_SECRET=your-secret"
```

## SSL/HTTPS Setup

### Let's Encrypt with Certbot (Nginx)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### Cloudflare

1. Add your domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS (Full mode)
4. Use Cloudflare's proxy (orange cloud)

## Monitoring

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Web dashboard
pm2 plus  # Sign up for PM2 Plus for advanced monitoring
```

### Application Logs

```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f logs/combined.log
tail -f logs/error.log
```

### Health Checks

Create a health check endpoint:

```javascript
// Add to src/routes/v1/index.js
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
```

Monitor with:
- UptimeRobot
- Pingdom
- AWS CloudWatch
- Datadog

### Database Monitoring

```bash
# Check PostgreSQL connections
SELECT * FROM pg_stat_activity;

# Check database size
SELECT pg_database_size('your_database');

# Slow query log
ALTER DATABASE your_database SET log_min_duration_statement = 1000;
```

## Security Hardening

### Server Security

```bash
# Setup firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Automatic security updates
sudo apt install unattended-upgrades -y
```

### Application Security

1. **Rate Limiting**: Already configured in `src/app.js`
2. **Helmet.js**: Security headers enabled
3. **CORS**: Configure allowed origins
4. **XSS Protection**: Enabled via xss-clean
5. **SQL Injection**: Sequelize uses parameterized queries
6. **Environment Variables**: Never commit secrets

## Backup Strategy

### Automated Database Backups

```bash
# Create backup script
nano /home/ubuntu/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U your_user your_database > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

```bash
chmod +x /home/ubuntu/backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

### Code Backup

- Use Git for version control
- Push to GitHub/GitLab regularly
- Tag releases

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs node-api --lines 100

# Check environment variables
pm2 env node-api

# Check disk space
df -h

# Check memory
free -m
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h your-db-host -U your-user -d your-database

# Check DATABASE_URL format
echo $DATABASE_URL

# Verify network connectivity
telnet your-db-host 5432
```

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart node-api

# Reduce instances if needed
pm2 scale node-api 2
```

### Nginx Errors

```bash
# Check Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

## Rollback Procedure

```bash
# Rollback code
git checkout previous-commit-hash

# Reinstall dependencies
yarn install --production

# Rollback database migrations
npx sequelize-cli db:migrate:undo

# Reload application
pm2 reload node-api
```

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Heroku Node.js Guide](https://devcenter.heroku.com/categories/nodejs-support)
- [AWS EC2 Guide](https://docs.aws.amazon.com/ec2/)