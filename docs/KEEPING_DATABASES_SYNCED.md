# How to Keep Dev and Production Databases Always Synced

## 🎯 TL;DR - Quick Answer

Run these commands regularly:

```bash
# Before making schema changes
npm run db:check

# After creating migrations
npm run db:sync:verify

# When deploying to production
npm run db:deploy:prod
```

## 📦 What We've Set Up For You

### 1. **Automated Safety Scripts**

#### `npm run db:check` - Pre-Migration Safety Checks
Runs before you create a migration. Checks:
- ✅ Schema is valid
- ✅ No drift detected
- ✅ All migrations applied
- ✅ No data loss risks
- ✅ TypeScript compiles
- ✅ Dev/Prod schemas match

#### `npm run db:compare` - Schema Comparison
Compares Dev and Production schemas in detail:
- Tables, columns, indexes, foreign keys
- Enums and data types
- Defaults and constraints
- Shows exactly what's different

#### `npm run db:sync:verify` - Quick Health Check
One command to verify everything is synced:
- Migration status
- Schema comparison
- Quick confirmation of sync state

#### `npm run db:deploy:prod` - Production Deployment
Automated deployment script with built-in safety:
- Checks you're on main branch
- Verifies no uncommitted changes
- Compares schemas
- Prompts for backup confirmation
- Deploys migrations
- Verifies deployment
- Builds application

### 2. **Deployment Scripts**

Located in `scripts/`:
- `deploy-to-production.sh` - Bash version (Linux/Mac)
- `deploy-to-production.ps1` - PowerShell version (Windows)
- `pre-migration-checks.js` - Automated safety checks
- `compare-neon-schemas.js` - Deep schema comparison

### 3. **Complete Documentation**

See `docs/DATABASE_SYNC_GUIDE.md` for:
- Detailed workflows
- Common pitfalls
- Troubleshooting guide
- Emergency procedures
- Checklists

## 🔄 The Sync Workflow

### Daily Development (On Feature Branch)

```bash
# 1. Make changes to prisma/schema.prisma
code prisma/schema.prisma

# 2. Run safety checks
npm run db:check

# 3. Create migration (dev database only!)
npx prisma migrate dev --name add_new_feature

# 4. Test your changes
npm run test:integration

# 5. Verify everything is good
npm run db:sync:verify

# 6. Commit to git
git add prisma/
git commit -m "feat: add new feature"
git push
```

### Production Deployment (After PR Merge)

```bash
# 1. Switch to main and pull latest
git checkout main
git pull origin main

# 2. Run automated deployment
npm run db:deploy:prod

# This will:
# - Verify you're on main branch
# - Check for uncommitted changes
# - Compare schemas
# - Prompt for backup confirmation
# - Deploy migrations to production
# - Verify deployment
# - Build application
```

## ⚠️ Critical Rules to Follow

### Rule #1: Development First, Always
```
✅ CORRECT Flow:
Schema Change → Dev Migration → Test → Commit → Production Deploy

❌ WRONG Flow:
Schema Change → Production Deploy (NEVER!)
```

### Rule #2: Never Skip Safety Checks
```bash
# Always run before creating migrations
npm run db:check

# Always verify before deploying
npm run db:compare
```

### Rule #3: Migrations Are Immutable
```
✅ DO: Create new migrations to fix issues
❌ DON'T: Edit existing migration files
❌ DON'T: Delete migration files
❌ DON'T: Run SQL manually in database
```

### Rule #4: Backup Before Production Changes
```
Every production deployment:
1. Create backup in Neon Console
2. Note the timestamp
3. Then deploy migrations
```

### Rule #5: Use the Right Commands
```bash
# Development
npx prisma migrate dev        ✅ Creates and applies migrations

# Production
npx prisma migrate deploy     ✅ Applies existing migrations
npm run db:deploy:prod        ✅ Automated with safety checks
```

## 🚨 Common Mistakes to Avoid

### Mistake #1: Creating Migrations in Production
```bash
❌ NEVER DO THIS:
# With production DATABASE_URL set
npx prisma migrate dev  # WRONG!

✅ ALWAYS DO THIS:
# With development DATABASE_URL
npx prisma migrate dev  # Correct
# Then deploy to production
npm run db:deploy:prod
```

### Mistake #2: Skipping Schema Comparison
```bash
❌ DON'T:
npx prisma migrate deploy  # Without checking

✅ DO:
npm run db:compare         # Check first
npm run db:deploy:prod     # Then deploy
```

### Mistake #3: Manual Database Changes
```bash
❌ NEVER:
- Use Neon Console to ALTER tables
- Run SQL directly in database
- Modify schema without Prisma

✅ ALWAYS:
- Edit prisma/schema.prisma
- Let Prisma generate migrations
- Deploy through proper channels
```

## 📊 Monitoring Sync Health

### Daily (Automated)
Set up a cron job or GitHub Action:

```yaml
# .github/workflows/daily-schema-check.yml
name: Daily Schema Health Check
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM daily

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run db:compare
      - name: Notify if mismatch
        if: failure()
        uses: slack-notification-action@v1
```

### Weekly Audit Checklist
- [ ] Run `npm run db:sync:verify`
- [ ] Verify all migrations in git
- [ ] Check Neon backup strategy
- [ ] Review migration history
- [ ] Test rollback procedure

## 🛠️ Troubleshooting

### Problem: Schemas Don't Match
```bash
# Run comparison to see differences
npm run db:compare

# If dev is ahead (you have new migrations)
npm run db:deploy:prod

# If prod is ahead (someone deployed manually - BAD!)
# Contact team immediately
# DO NOT force reset production
```

### Problem: Migration Failed in Production
```bash
# Don't panic - database is likely unchanged
# Check error message
npx prisma migrate status

# Mark as rolled back if needed
npx prisma migrate resolve --rolled-back "migration_name"

# Fix the issue and try again
npx prisma migrate dev --name fixed_migration
npm run db:deploy:prod
```

### Problem: Schema Drift Detected
```bash
# Check what changed
npm run db:compare

# Usually means:
# - Uncommitted migrations in dev
# - Manual changes in database
# - Missing deployments to production

# Solution: Follow proper workflow to sync
```

## 📈 Best Practices for Long-Term Sync

### 1. Use Feature Branches
```bash
# Create feature branch
git checkout -b feature/add-user-preferences

# Make schema changes
# Create migrations
npx prisma migrate dev --name add_user_preferences

# Test thoroughly
npm run test:all

# Merge to main only when ready
```

### 2. Coordinate Team Deployments
```
- Use a deployment schedule
- Communicate in team chat before deployments
- Use deployment locks/flags
- Monitor after deployment
```

### 3. Keep Migration History Clean
```
- Use descriptive migration names
- One logical change per migration
- Document complex migrations
- Never squash migrations
```

### 4. Regular Backups
```
- Enable Neon point-in-time restore
- Create manual backups before major changes
- Test restore procedure quarterly
- Document backup/restore process
```

### 5. Version Control Everything
```
✅ Commit to git:
- prisma/schema.prisma
- prisma/migrations/*
- All migration SQL files

❌ DON'T commit:
- .env files
- Database credentials
- Local test data
```

## 🎓 Understanding the System

### How Prisma Migrations Work
```
1. You edit schema.prisma
2. Run: npx prisma migrate dev
3. Prisma generates SQL migration file
4. Prisma applies migration to dev DB
5. Migration file tracked in git
6. In production: npx prisma migrate deploy
7. Prisma applies same migration to prod DB
8. Both DBs now have identical schema
```

### Why This Keeps DBs Synced
```
- Migrations are version controlled
- Same SQL runs in both environments
- Migration history prevents skipping
- Schema comparison catches drift
- Automated checks prevent mistakes
```

## 📚 Additional Resources

- **Full Guide**: `docs/DATABASE_SYNC_GUIDE.md`
- **CLAUDE.md**: Quick reference for AI assistants
- **Prisma Docs**: https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Neon Docs**: https://neon.tech/docs

## 🆘 Need Help?

### Quick Checks
```bash
# Is everything in sync?
npm run db:sync:verify

# What's different?
npm run db:compare

# Am I safe to migrate?
npm run db:check
```

### Still Stuck?
1. Check `docs/DATABASE_SYNC_GUIDE.md` troubleshooting section
2. Review recent git commits for migrations
3. Check Neon Console for manual changes
4. Verify DATABASE_URL environment variable
5. Contact your team lead

---

## ✅ Quick Checklist

Print this and keep it handy:

**Before Every Schema Change:**
- [ ] Run `npm run db:check`
- [ ] Understand the change impact
- [ ] Plan for data migration if needed

**After Creating Migration:**
- [ ] Test in development
- [ ] Run integration tests
- [ ] Verify with `npm run db:sync:verify`
- [ ] Commit migration files to git

**Before Production Deploy:**
- [ ] On main branch
- [ ] All changes pulled
- [ ] `npm run db:compare` reviewed
- [ ] Backup created
- [ ] Team notified

**After Production Deploy:**
- [ ] Run `npm run db:sync:verify`
- [ ] Smoke test application
- [ ] Monitor for errors
- [ ] Confirm with team

---

**Remember: The automated scripts are your friends! Use them religiously.** 🎉
