# Database Schema Sync Process

## Overview
This document outlines the process for syncing database schemas between development and production branches in the Neon PostgreSQL database.

## Current Setup
- **Development Database**: `ep-noisy-mountain-a18wvzwi-pooler.ap-southeast-1.aws.neon.tech`
- **Production Database**: `ep-blue-mouse-a128nyc9-pooler.ap-southeast-1.aws.neon.tech`
- **ORM**: Prisma with migration tracking
- **Migration Count**: 13 migrations (as of 2025-11-25)

## Sync Process

### 1. Verify Current State
```bash
# Check development database status
npx prisma migrate status

# Check production database status (temporarily switch DATABASE_URL)
# Edit .env to uncomment production DATABASE_URL
npx prisma migrate status
```

### 2. Handle Migration Drift
If development shows "drift detected":
```bash
# Mark all migrations as applied in development
node mark-migrations-applied.js
```

### 3. Apply Migrations to Production (if needed)
```bash
# Switch to production DATABASE_URL in .env
# Then run:
npx prisma migrate deploy
```

### 4. Verify Sync Completion
Both databases should show:
```
Database schema is up to date!
```

### 5. Restore Development Configuration
Switch DATABASE_URL back to development endpoint in .env

## Key Findings
- Production database was already up to date with all migrations
- Development database had schema drift (tables existed but migrations weren't tracked)
- Resolution: Marked all migrations as applied in development database
- Result: Both databases now have identical schema and migration state

## Scripts Used
- `backup-production-schema.js`: Creates schema backup before changes
- `mark-migrations-applied.js`: Marks all pending migrations as applied

## Best Practices
1. Always backup production schema before making changes
2. Test migration commands on development first
3. Verify both databases show "up to date" after sync
4. Document any schema changes and their purposes
5. Use `prisma migrate deploy` for production deployments

## Emergency Rollback
If issues occur after sync:
1. Restore from Neon database backup (if available)
2. Or use the schema backup created during sync process
3. Contact Neon support if database-level issues occur

## Date Completed
2025-11-25 - Schema sync between development and production branches completed successfully.