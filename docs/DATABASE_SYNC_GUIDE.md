# Database Sync Best Practices Guide

This guide ensures your Development and Production databases stay perfectly synchronized.

## 🎯 Quick Reference

### Daily Development Workflow

```bash
# 1. Before making schema changes
npm run db:check

# 2. Create a migration
npx prisma migrate dev --name descriptive_migration_name

# 3. Verify the migration
npm run db:sync:verify

# 4. Commit the migration
git add prisma/migrations/
git commit -m "feat: add descriptive migration name"
```

### Production Deployment Workflow

```bash
# 1. Ensure you're on main branch and up to date
git checkout main
git pull origin main

# 2. Verify schemas are in sync
npm run db:compare

# 3. Run automated deployment (includes all safety checks)
npm run db:deploy:prod

# OR manually deploy
npx prisma migrate deploy  # with production DATABASE_URL
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run db:check` | Run pre-migration safety checks |
| `npm run db:compare` | Compare Dev and Production schemas |
| `npm run db:sync:verify` | Verify migration status and schema sync |
| `npm run db:deploy:prod` | Deploy to production with safety checks |

## 🛡️ Golden Rules

### Rule 1: Never Modify Migrations
**❌ NEVER:**
- Edit migration files after they've been applied
- Delete migration files from `prisma/migrations/`
- Manually run SQL that bypasses Prisma

**✅ ALWAYS:**
- Create new migrations for changes
- Use `npx prisma migrate dev` for schema changes
- Let Prisma generate migration SQL

### Rule 2: Always Test in Development First
**Development → Production Flow:**
```
1. Make schema changes in prisma/schema.prisma
2. Run: npm run db:check
3. Create migration: npx prisma migrate dev --name my_change
4. Test thoroughly in development
5. Commit migration files to git
6. Deploy to production: npm run db:deploy:prod
```

### Rule 3: Synchronize Deployments
**Coordinated Deployment:**
- Deploy database migrations BEFORE deploying application code
- Always use `npx prisma migrate deploy` in production (not migrate dev)
- Never mix development and production DATABASE_URLs

### Rule 4: Backup Before Major Changes
**Before any schema change in production:**
1. Create a backup in Neon Console
2. Note the timestamp
3. Test rollback procedure
4. Proceed with deployment

### Rule 5: Verify After Every Deployment
**Post-deployment checklist:**
```bash
# Verify migrations applied
npx prisma migrate status

# Compare schemas
npm run db:compare

# Check application health
# Test critical features
```

## 🔄 Common Workflows

### Making Schema Changes

```bash
# Step 1: Update schema
# Edit prisma/schema.prisma

# Step 2: Run safety checks
npm run db:check

# Step 3: Create migration (Dev only!)
npx prisma migrate dev --name add_user_preferences

# Step 4: Verify changes
npm run db:sync:verify

# Step 5: Test your changes
npm run test:integration

# Step 6: Commit to git
git add prisma/
git commit -m "feat: add user preferences table"
git push
```

### Deploying to Production

```bash
# Automated (Recommended)
npm run db:deploy:prod

# Manual (if needed)
# 1. Switch to main branch
git checkout main
git pull

# 2. Set production DATABASE_URL
$env:DATABASE_URL = "postgresql://neondb_owner:...@ep-blue-mouse-a128nyc9-pooler..."

# 3. Deploy migrations
npx prisma migrate deploy

# 4. Verify
npx prisma migrate status
npm run db:compare

# 5. Build and deploy app
npm run build
```

### Fixing Schema Drift

If dev and production schemas diverge:

```bash
# 1. Check current status
npm run db:compare

# 2. Identify the issue
# - Missing migrations in production?
# - Uncommitted migrations in development?
# - Manual changes in database?

# 3. Fix the issue
# Option A: Deploy pending migrations to production
npm run db:deploy:prod

# Option B: Reset development to match production
npx prisma db push --force-reset  # ⚠️ Deletes dev data!
npx prisma migrate deploy

# 4. Verify sync
npm run db:sync:verify
```

## ⚠️ Common Pitfalls to Avoid

### 1. Skipping Migration Testing
**❌ DON'T:**
```bash
# Creating migration without testing
npx prisma migrate dev --name untested_change
git add . && git commit -m "quick fix" && git push
npm run db:deploy:prod  # 💥 Production breaks!
```

**✅ DO:**
```bash
npx prisma migrate dev --name well_tested_change
npm run test:integration
npm run test:e2e
# Verify everything works, then deploy
```

### 2. Direct Database Modifications
**❌ DON'T:**
- Run SQL directly in Neon Console
- Use database GUI tools to modify schema
- Create tables/columns manually

**✅ DO:**
- Always modify `prisma/schema.prisma`
- Let Prisma generate migrations
- Use `npx prisma db push` only for prototyping

### 3. Mixed Environments
**❌ DON'T:**
```bash
# Using dev DATABASE_URL with migrate deploy
npx prisma migrate deploy  # Wrong environment!
```

**✅ DO:**
```bash
# Always verify which database you're targeting
echo $DATABASE_URL
# Then run appropriate command
```

### 4. Ignoring Warnings
**❌ DON'T:**
- Ignore "SCHEMA MISMATCH" warnings
- Skip schema comparison checks
- Deploy without verifying migration status

**✅ DO:**
- Investigate all warnings before proceeding
- Run `npm run db:check` before migrations
- Verify with `npm run db:sync:verify`

## 🔍 Troubleshooting

### Schema Mismatch Detected

```bash
# Symptom: npm run db:compare shows differences

# Solution 1: Deploy pending migrations to production
npm run db:deploy:prod

# Solution 2: Check for uncommitted changes in dev
git status
npx prisma migrate status

# Solution 3: Verify both databases are accessible
# Check DATABASE_URL in .env
```

### Migration History Diverged

```bash
# Symptom: Production has migrations not in git

# Solution: This is serious - contact your team
# DO NOT force reset production
# Manually reconcile migration history
```

### Migration Failed in Production

```bash
# Symptom: npx prisma migrate deploy failed

# Immediate actions:
# 1. Don't panic - database is likely unchanged
# 2. Check error message carefully
# 3. Restore from backup if needed
# 4. Fix migration SQL and retry
# 5. Contact support if stuck

# Example fix for safe retry:
npx prisma migrate resolve --rolled-back "20231201000000_failed_migration"
# Fix the issue in schema
npx prisma migrate dev --name fixed_migration
npm run db:deploy:prod
```

## 📊 Monitoring Schema Health

### Daily Checks (Automated)

Set up a cron job or GitHub Action:

```bash
# .github/workflows/schema-check.yml
name: Schema Health Check
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM
  workflow_dispatch:

jobs:
  check-schema:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run db:compare
      - run: npm run db:sync:verify
```

### Weekly Audits

```bash
# Every week, verify:
1. All migrations are applied to production
2. No schema drift exists
3. Backup strategy is working
4. Migration history is clean
```

## 🚀 Advanced Tips

### Using Shadow Database for Testing

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")  // For migration testing
}
```

### Creating Reversible Migrations

When possible, make migrations reversible:

```sql
-- Safe: Adding nullable column
ALTER TABLE "User" ADD COLUMN "preferences" TEXT;

-- Risky: Adding non-nullable column
-- Better approach: Add as nullable first, fill data, then make required
```

### Zero-Downtime Migrations

For large tables, use multi-step approach:

```bash
# Step 1: Add new column (nullable)
npx prisma migrate dev --name add_new_column_nullable

# Step 2: Backfill data in application code
# Deploy app with backfill logic

# Step 3: Make column required
npx prisma migrate dev --name make_column_required
```

## 📝 Checklist Templates

### Pre-Migration Checklist

- [ ] Schema changes documented
- [ ] `npm run db:check` passed
- [ ] Migration tested locally
- [ ] Integration tests pass
- [ ] No data loss confirmed
- [ ] Migration files committed to git

### Production Deployment Checklist

- [ ] On main branch
- [ ] Latest changes pulled
- [ ] Backup created in Neon Console
- [ ] `npm run db:compare` reviewed
- [ ] Team notified of deployment
- [ ] `npm run db:deploy:prod` executed
- [ ] Migration status verified
- [ ] Application deployed
- [ ] Smoke tests passed
- [ ] Monitoring confirmed healthy

## 🆘 Emergency Contacts

- **Database Issues**: Check Neon Console
- **Migration Failures**: Review migration logs
- **Schema Drift**: Run `npm run db:compare`
- **Rollback Needed**: Restore from Neon backup

## 📚 Additional Resources

- [Prisma Migration Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Neon Branching Guide](https://neon.tech/docs/guides/branching)
- [Database Backup Best Practices](https://neon.tech/docs/introduction/point-in-time-restore)

---

**Remember:** A synced database is a happy database! 🎉
