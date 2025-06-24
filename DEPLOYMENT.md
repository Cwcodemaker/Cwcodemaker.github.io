# Deployment Guide - DB 14 Discord Bot Platform

This guide will help you deploy the DB 14 Discord Bot Management Platform on your personal machine and assign a custom website URL.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Discord Application with OAuth2 credentials
- Domain name (optional, for custom URL)

## Step 1: Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd discord-bot-platform

# Install dependencies
npm install

# Build the application
npm run build
```

## Step 2: Database Setup

### Option A: Local PostgreSQL
```bash
# Install PostgreSQL
# Ubuntu/Debian:
sudo apt update && sudo apt install postgresql postgresql-contrib

# macOS:
brew install postgresql

# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS

# Create database
sudo -u postgres createdb db14_production
```

### Option B: Cloud Database (Recommended)
- Use services like Neon, Supabase, or Railway
- Get the DATABASE_URL connection string

## Step 3: Environment Variables

Create a `.env` file in the root directory:

```bash
# Production Environment
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/db14_production

# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Session Secret (generate a random string)
SESSION_SECRET=your_super_secret_session_key_here

# Domain Configuration
DOMAIN=yourdomain.com
PROTOCOL=https
```

## Step 4: Discord Application Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 settings
4. Add redirect URI: `https://yourdomain.com/api/auth/callback`
5. Copy Client ID and Client Secret to your `.env` file

## Step 5: Database Migration

```bash
# Push database schema
npm run db:push

# Verify tables are created
npm run db:studio  # Opens Drizzle Studio
```

## Step 6: Build and Start

```bash
# Build the application
npm run build

# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "db14" -- start
pm2 startup
pm2 save
```

## Step 7: Reverse Proxy Setup (Nginx)

### Install Nginx
```bash
# Ubuntu/Debian
sudo apt install nginx

# macOS
brew install nginx
```

### Configure Nginx
Create `/etc/nginx/sites-available/db14`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (see SSL setup below)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/db14 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 8: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx  # Ubuntu/Debian
brew install certbot                             # macOS

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 9: Domain Configuration

### Option A: Custom Domain
1. Purchase a domain from a registrar (Namecheap, GoDaddy, etc.)
2. Point the domain to your server's IP address:
   - A record: `@` → `your.server.ip`
   - A record: `www` → `your.server.ip`

### Option B: Dynamic DNS (Home Setup)
If running from home with dynamic IP:
1. Use services like DuckDNS, No-IP, or DynDNS
2. Set up dynamic DNS client on your machine
3. Configure port forwarding on your router (port 80, 443)

## Step 10: Firewall Configuration

```bash
# Ubuntu/Debian
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

## Step 11: Monitoring and Logs

```bash
# View application logs
pm2 logs db14

# Monitor system resources
pm2 monit

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database setup and migrated
- [ ] Discord OAuth configured with correct redirect URI
- [ ] SSL certificate installed and auto-renewal setup
- [ ] Firewall configured
- [ ] Process manager (PM2) setup with auto-restart
- [ ] Nginx reverse proxy configured
- [ ] Domain DNS records pointing to server
- [ ] Backup strategy for database
- [ ] Monitoring setup

## Troubleshooting

### Common Issues

1. **Discord OAuth not working**
   - Check redirect URI matches exactly
   - Ensure HTTPS is used in production

2. **Database connection failed**
   - Verify DATABASE_URL format
   - Check database server is running
   - Confirm firewall allows database connections

3. **SSL certificate issues**
   - Ensure domain DNS is properly configured
   - Check Nginx configuration syntax
   - Verify ports 80/443 are open

4. **Application not starting**
   - Check Node.js version compatibility
   - Verify all environment variables are set
   - Review application logs for errors

### Performance Optimization

1. **Enable Gzip compression in Nginx**
2. **Setup Redis for session storage** (optional)
3. **Configure database connection pooling**
4. **Setup CDN for static assets** (optional)

## Backup Strategy

```bash
# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/home/backups/db14"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > $BACKUP_DIR/db14_backup_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

## Security Considerations

1. Regular security updates for OS and dependencies
2. Strong database passwords and restricted access
3. Regular backup testing
4. Monitor application logs for suspicious activity
5. Keep Discord bot tokens secure and rotate regularly