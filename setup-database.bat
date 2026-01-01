@echo off
echo ========================================
echo Database Setup Script
echo ========================================
echo.

echo Step 1: Testing database connection...
node test-db-connection.js
if errorlevel 1 (
    echo.
    echo ERROR: Cannot connect to database!
    echo Please wake up your Neon database first:
    echo 1. Go to https://console.neon.tech/
    echo 2. Click on your database to wake it up
    echo 3. Run this script again
    pause
    exit /b 1
)

echo.
echo Step 2: Generating Prisma Client...
call npx prisma generate

echo.
echo Step 3: Deploying migrations...
call npx prisma migrate deploy

echo.
echo Step 4: Seeding database...
call npx prisma db seed

echo.
echo ========================================
echo Database setup complete!
echo ========================================
echo.
echo Default login credentials:
echo Email: cybergada@gmail.com
echo Password: Qweasd145698@
echo.
pause
