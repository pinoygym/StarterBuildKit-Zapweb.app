@echo off
REM Full Test Suite Runner
REM This script stops the dev server, runs all tests, and restarts the dev server

echo ========================================
echo   Full Test Suite Runner
echo ========================================
echo.

REM Step 1: Stop dev servers
echo Step 1: Stopping dev servers...
powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
powershell -Command "Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
powershell -Command "Start-Sleep -Seconds 3"
echo   Done!
echo.

REM Step 2: Run Unit Tests
echo ========================================
echo Step 2: Running Unit Tests...
echo ========================================
echo.
call bun run test:unit
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [FAILED] Unit tests failed!
    set UNIT_FAILED=1
) else (
    echo.
    echo [PASSED] Unit tests passed!
    set UNIT_FAILED=0
)

REM Step 3: Run Integration Tests
echo.
echo ========================================
echo Step 3: Running Integration Tests...
echo ========================================
echo.
echo Starting test server on port 3001...
set NODE_ENV=test
start /B "" cmd /c "bunx next dev -p 3001 2>nul >nul"
echo Waiting for server to start...
powershell -Command "Start-Sleep -Seconds 20"

REM Check if server is running
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001' -TimeoutSec 5 -ErrorAction SilentlyContinue -UseBasicParsing; Write-Host 'Server is ready!' } catch { Write-Host 'Server may still be starting...' }"

set BASE_URL=http://127.0.0.1:3001
call bun run test:integration
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [FAILED] Integration tests failed!
    set INTEGRATION_FAILED=1
) else (
    echo.
    echo [PASSED] Integration tests passed!
    set INTEGRATION_FAILED=0
)

REM Stop test server
echo Stopping test server...
powershell -Command "Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
powershell -Command "Start-Sleep -Seconds 2"

REM Step 4: Run E2E Tests
echo.
echo ========================================
echo Step 4: Running E2E Tests...
echo ========================================
echo.
REM E2E tests will start their own server via Playwright config
call bun run test:e2e
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [FAILED] E2E tests failed!
    set E2E_FAILED=1
) else (
    echo.
    echo [PASSED] E2E tests passed!
    set E2E_FAILED=0
)

REM Step 5: Restart dev server
echo.
echo ========================================
echo Step 5: Restarting dev server...
echo ========================================
echo.
start "" cmd /c "bun run dev"
echo Dev server started!

REM Summary
echo.
echo ========================================
echo   Test Results Summary
echo ========================================
echo.
if %UNIT_FAILED%==0 (
    echo [PASSED] Unit Tests
) else (
    echo [FAILED] Unit Tests
)
if %INTEGRATION_FAILED%==0 (
    echo [PASSED] Integration Tests
) else (
    echo [FAILED] Integration Tests
)
if %E2E_FAILED%==0 (
    echo [PASSED] E2E Tests
) else (
    echo [FAILED] E2E Tests
)
echo.
echo ========================================

if %UNIT_FAILED%==1 exit /b 1
if %INTEGRATION_FAILED%==1 exit /b 1
if %E2E_FAILED%==1 exit /b 1

echo All tests passed!
exit /b 0
