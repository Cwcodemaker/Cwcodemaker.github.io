#!/bin/bash

# DB 14 Discord Bot Platform Deployment Script
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Starting DB 14 deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL client not found. Make sure you have a database URL configured.${NC}"
fi

# Create logs directory
mkdir -p logs

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating template...${NC}"
    cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/db14_production
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
SESSION_SECRET=$(openssl rand -base64 32)
DOMAIN=localhost
PROTOCOL=http
EOF
    echo -e "${YELLOW}📝 Please edit .env file with your configuration before continuing.${NC}"
    echo -e "${YELLOW}   Then run this script again.${NC}"
    exit 1
fi

# Load environment variables
source .env

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🏗️  Building application..."
npm run build

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Push database schema
echo "🗄️  Setting up database..."
if [ -n "$DATABASE_URL" ]; then
    npm run db:push
    echo -e "${GREEN}✅ Database schema updated${NC}"
else
    echo -e "${YELLOW}⚠️  DATABASE_URL not set, skipping database setup${NC}"
fi

# Stop existing PM2 process if running
pm2 delete db14-bot-platform 2>/dev/null || true

# Start the application with PM2
echo "🚀 Starting application..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup || echo -e "${YELLOW}⚠️  Run the PM2 startup command shown above to enable auto-start${NC}"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}📊 Monitor with: pm2 monit${NC}"
echo -e "${GREEN}📋 View logs with: pm2 logs db14-bot-platform${NC}"
echo -e "${GREEN}🌐 Application running on: http://localhost:${PORT}${NC}"

# Check if Nginx is installed
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✅ Nginx detected${NC}"
    echo -e "${YELLOW}📝 Configure Nginx reverse proxy for production domain${NC}"
else
    echo -e "${YELLOW}📦 Consider installing Nginx for reverse proxy in production${NC}"
fi

# Security reminder
echo -e "${YELLOW}🔒 Security reminders:${NC}"
echo -e "${YELLOW}   - Setup SSL certificate for production${NC}"
echo -e "${YELLOW}   - Configure firewall (UFW/iptables)${NC}"
echo -e "${YELLOW}   - Setup regular database backups${NC}"
echo -e "${YELLOW}   - Keep Discord bot tokens secure${NC}"