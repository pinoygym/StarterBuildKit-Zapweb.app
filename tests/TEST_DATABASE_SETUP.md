# Test Database Setup Script

This script helps create and configure the test database in Neon.

## Steps to Create Test Database

### Option 1: Using Neon Console (Recommended)

1. Go to your Neon Console: https://console.neon.tech
2. Select your project: `ep-spring-pond-a1stve3k`
3. Click "Databases" in the sidebar
4. Click "New Database"
5. Name it: `neondb_test`
6. Click "Create"

The test database URL will be:
```
postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-spring-pond-a1stve3k-pooler.ap-southeast-1.aws.neon.tech/neondb_test?sslmode=require&channel_binding=require
```

### Option 2: Using Neon CLI

```bash
# Install Neon CLI (if not already installed)
npm install -g neonctl

# Create test database
neonctl database create --name neondb_test --project-id ep-spring-pond-a1stve3k
```

### Option 3: Using SQL (via psql or Neon SQL Editor)

```sql
CREATE DATABASE neondb_test;
```

## Verification

After creating the database, verify the setup:

```bash
# Test database connection
bunx prisma db push --skip-generate

# Run migrations
bunx prisma migrate deploy

# Generate Prisma client
bunx prisma generate
```

## Running Tests

Once the database is created:

```bash
# Run all tests with the new test database
bun run test:all

# Run integration tests only
bun run test:integration

# Run unit tests only
bun run test:unit
```

## Troubleshooting

### Connection Error
If you get a connection error, verify:
1. Database name is correct in `.env.test`
2. Database exists in Neon console
3. Connection string is correct

### Migration Error
If migrations fail:
```bash
# Reset and reapply migrations
bunx prisma migrate reset --skip-seed
bunx prisma migrate deploy
```

### Permission Error
Ensure your Neon user has permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE neondb_test TO neondb_owner;
```
