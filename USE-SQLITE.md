# Use SQLite for Local Development

## Quick Setup (2 Minutes)

This creates a local database file on your computer. No internet needed!

### 1. Update .env
```bash
# Comment out the Neon connection
# DATABASE_URL="postgresql://..."

# Add SQLite connection
DATABASE_URL="file:./dev.db"
```

### 2. Update prisma/schema.prisma
Open `prisma/schema.prisma` and change line 10:

**FROM:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**TO:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### 3. Generate and Migrate
```bash
# Generate Prisma client for SQLite
npx prisma generate

# Create database file and tables
npx prisma migrate dev --name init

# Seed with data
npx prisma db seed

# Start server
npm run dev
```

### 4. Login
Go to: http://localhost:3000/login
- Email: cybergada@gmail.com
- Password: Qweasd145698@

## Benefits of SQLite
- ✅ Works offline
- ✅ No sign-up needed
- ✅ Fast for development
- ✅ Database is a file: `dev.db`

## Limitations
- ❌ Less scalable than PostgreSQL
- ❌ Missing some Postgres features
- ❌ Not recommended for production

## To Switch Back to PostgreSQL Later
1. Change `provider = "postgresql"` in schema.prisma
2. Update DATABASE_URL in .env
3. Run `npx prisma migrate deploy`

---

**Perfect for quick local testing!** 🚀
