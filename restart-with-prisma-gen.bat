@echo off
echo Stopping dev server...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm*"
timeout /t 2 /nobreak >nul

echo.
echo Regenerating Prisma client...
call npx prisma generate

echo.
echo Starting dev server...
start cmd /k "npm run dev"

echo.
echo Done! Dev server is restarting in a new window.
pause
