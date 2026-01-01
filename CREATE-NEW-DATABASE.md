# Create New Neon Database (5 Minutes)

## Why You Need This
Your current Neon database is unreachable. Creating a new one is the fastest solution.

## Step-by-Step Guide

### 1. Create Neon Account (if you don't have one)
- Go to: https://neon.tech/
- Click "Sign Up"
- Use GitHub, Google, or Email
- **It's FREE** (no credit card needed)

### 2. Create New Database
1. After signing in, click **"Create Project"**
2. Choose:
   - **Region**: Singapore (or closest to you)
   - **Database name**: inventorypro
   - Click **"Create Project"**

### 3. Get Connection String
1. You'll see your new database dashboard
2. Click **"Connection Details"**
3. Copy the **Connection string**
   - It looks like: `postgresql://username:password@ep-xxxxx.neon.tech/dbname?sslmode=require`

### 4. Update Your .env File
1. Open: `.env` in your project
2. Find the line: `DATABASE_URL=...`
3. Replace it with your NEW connection string:
   ```
   DATABASE_URL="postgresql://your-new-connection-string-here"
   ```
4. Save the file

### 5. Setup Database
Run these commands:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate deploy

# Seed with initial data
npx prisma db seed

# Start server
npm run dev
```

### 6. Login
Go to: http://localhost:3000/login
- Email: cybergada@gmail.com
- Password: Qweasd145698@

## Troubleshooting

### If migration fails:
```bash
# Reset and try again
npx prisma migrate reset
npx prisma db seed
```

### If you see "Migration table already exists":
```bash
# Just seed the database
npx prisma db seed
```

### Still having issues?
The connection string should look like:
```
postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE?sslmode=require
```

Make sure:
- No extra spaces
- Wrapped in quotes
- Has `?sslmode=require` at the end

---

**This takes 5 minutes and gives you a fresh, working database!** 🚀
