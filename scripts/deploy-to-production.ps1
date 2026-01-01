# Production Deployment Script for InventoryPro (PowerShell)
# This script ensures safe deployment of database migrations to production

$ErrorActionPreference = "Stop"

Write-Host "🚀 InventoryPro Production Deployment Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify we're on the correct branch
Write-Host "📋 Step 1: Checking Git branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "❌ Error: You must be on 'main' branch to deploy to production" -ForegroundColor Red
    Write-Host "Current branch: $currentBranch" -ForegroundColor Red
    exit 1
}
Write-Host "✅ On main branch" -ForegroundColor Green
Write-Host ""

# Step 2: Check for uncommitted changes
Write-Host "📋 Step 2: Checking for uncommitted changes..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "❌ Error: You have uncommitted changes" -ForegroundColor Red
    Write-Host "Please commit or stash your changes before deploying" -ForegroundColor Red
    git status --short
    exit 1
}
Write-Host "✅ No uncommitted changes" -ForegroundColor Green
Write-Host ""

# Step 3: Pull latest changes
Write-Host "📋 Step 3: Pulling latest changes from remote..." -ForegroundColor Yellow
git pull origin main
Write-Host "✅ Repository up to date" -ForegroundColor Green
Write-Host ""

# Step 4: Verify schema comparison
Write-Host "📋 Step 4: Comparing Dev and Production schemas..." -ForegroundColor Yellow
$schemaComparisonOutput = node scripts/compare-neon-schemas.js 2>&1 | Out-String
if ($schemaComparisonOutput -match "SCHEMA MISMATCH") {
    Write-Host "❌ Warning: Schema differences detected!" -ForegroundColor Red
    Write-Host $schemaComparisonOutput
    Write-Host ""
    $continue = Read-Host "Do you want to continue anyway? (yes/no)"
    if ($continue -ne "yes") {
        Write-Host "Deployment aborted" -ForegroundColor Yellow
        exit 1
    }
}
else {
    Write-Host "✅ Schemas are in sync" -ForegroundColor Green
}
Write-Host ""

# Step 5: Backup production database
Write-Host "📋 Step 5: Creating production backup..." -ForegroundColor Yellow
$backupDate = Get-Date -Format "yyyyMMdd_HHmmss"
Write-Host "Backup timestamp: $backupDate"
Write-Host "⚠️  Manual backup recommended via Neon Console" -ForegroundColor Yellow
$backupDone = Read-Host "Have you created a backup in Neon Console? (yes/no)"
if ($backupDone -ne "yes") {
    Write-Host "❌ Please create a backup before proceeding" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backup confirmed" -ForegroundColor Green
Write-Host ""

# Step 6: Switch to production DATABASE_URL
Write-Host "📋 Step 6: Preparing to deploy migrations..." -ForegroundColor Yellow
Write-Host "⚠️  About to deploy migrations to PRODUCTION" -ForegroundColor Yellow
Write-Host ""
Write-Host "Production Database: ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech"
Write-Host ""
$finalConfirm = Read-Host "Are you sure you want to continue? (yes/no)"
if ($finalConfirm -ne "yes") {
    Write-Host "Deployment aborted" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 7: Deploy migrations to production
Write-Host "📋 Step 7: Deploying migrations to production..." -ForegroundColor Yellow
$env:DATABASE_URL = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations deployed successfully!" -ForegroundColor Green
}
else {
    Write-Host "❌ Migration deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 8: Verify deployment
Write-Host "📋 Step 8: Verifying deployment..." -ForegroundColor Yellow
npx prisma migrate status
Write-Host ""

# Step 9: Final schema comparison
Write-Host "📋 Step 9: Running final schema comparison..." -ForegroundColor Yellow
node scripts/compare-neon-schemas.js
Write-Host ""

# Step 10: Build and deploy application
Write-Host "📋 Step 10: Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Application built successfully!" -ForegroundColor Green
}
else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Deploy the built application to your hosting platform (Vercel, etc.)"
Write-Host "2. Monitor application logs for any errors"
Write-Host "3. Test critical features in production"
Write-Host ""
