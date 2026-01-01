#!/bin/bash

# Production Deployment Script for InventoryPro
# This script ensures safe deployment of database migrations to production

set -e  # Exit on error

echo "🚀 InventoryPro Production Deployment Script"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify we're on the correct branch
echo "📋 Step 1: Checking Git branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}❌ Error: You must be on 'main' branch to deploy to production${NC}"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi
echo -e "${GREEN}✅ On main branch${NC}"
echo ""

# Step 2: Check for uncommitted changes
echo "📋 Step 2: Checking for uncommitted changes..."
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ Error: You have uncommitted changes${NC}"
    echo "Please commit or stash your changes before deploying"
    git status --short
    exit 1
fi
echo -e "${GREEN}✅ No uncommitted changes${NC}"
echo ""

# Step 3: Pull latest changes
echo "📋 Step 3: Pulling latest changes from remote..."
git pull origin main
echo -e "${GREEN}✅ Repository up to date${NC}"
echo ""

# Step 4: Verify schema comparison
echo "📋 Step 4: Comparing Dev and Production schemas..."
node scripts/compare-neon-schemas.js > /tmp/schema-comparison.log 2>&1
if grep -q "SCHEMA MISMATCH" /tmp/schema-comparison.log; then
    echo -e "${RED}❌ Warning: Schema differences detected!${NC}"
    cat /tmp/schema-comparison.log
    echo ""
    read -p "Do you want to continue anyway? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        echo "Deployment aborted"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Schemas are in sync${NC}"
fi
echo ""

# Step 5: Backup production database
echo "📋 Step 5: Creating production backup..."
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
echo "Backup timestamp: $BACKUP_DATE"
echo -e "${YELLOW}⚠️  Manual backup recommended via Neon Console${NC}"
read -p "Have you created a backup in Neon Console? (yes/no): " BACKUP_DONE
if [ "$BACKUP_DONE" != "yes" ]; then
    echo -e "${RED}❌ Please create a backup before proceeding${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backup confirmed${NC}"
echo ""

# Step 6: Switch to production DATABASE_URL
echo "📋 Step 6: Preparing to deploy migrations..."
echo -e "${YELLOW}⚠️  About to deploy migrations to PRODUCTION${NC}"
echo ""
echo "Production Database: ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech"
echo ""
read -p "Are you sure you want to continue? (yes/no): " FINAL_CONFIRM
if [ "$FINAL_CONFIRM" != "yes" ]; then
    echo "Deployment aborted"
    exit 1
fi
echo ""

# Step 7: Deploy migrations to production
echo "📋 Step 7: Deploying migrations to production..."
export DATABASE_URL="postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations deployed successfully!${NC}"
else
    echo -e "${RED}❌ Migration deployment failed!${NC}"
    exit 1
fi
echo ""

# Step 8: Verify deployment
echo "📋 Step 8: Verifying deployment..."
npx prisma migrate status
echo ""

# Step 9: Final schema comparison
echo "📋 Step 9: Running final schema comparison..."
node scripts/compare-neon-schemas.js
echo ""

# Step 10: Build and deploy application
echo "📋 Step 10: Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Application built successfully!${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
echo ""

echo "============================================"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Deploy the built application to your hosting platform (Vercel, etc.)"
echo "2. Monitor application logs for any errors"
echo "3. Test critical features in production"
echo ""
