#!/usr/bin/env pwsh
# Full Test Suite Runner
# This script stops the dev server, runs all tests, and restarts the dev server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Full Test Suite Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to find and kill processes on a specific port
function Stop-ProcessOnPort {
    param (
        [int]$Port
    )
    
    Write-Host "Checking for processes on port $Port..." -ForegroundColor Yellow
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        
        if ($connections) {
            foreach ($conn in $connections) {
                $processId = $conn.OwningProcess
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                
                if ($process) {
                    Write-Host "  Stopping process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
                    Stop-Process -Id $processId -Force
                    Start-Sleep -Seconds 2
                }
            }
            Write-Host "  ✓ Port $Port is now free" -ForegroundColor Green
        }
        else {
            Write-Host "  ✓ No process found on port $Port" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  ! Could not check port $Port : $_" -ForegroundColor Red
    }
}

# Step 1: Stop dev servers on ports 3000 and 3001
Write-Host ""
Write-Host "Step 1: Stopping dev servers..." -ForegroundColor Cyan
Stop-ProcessOnPort -Port 3000
Stop-ProcessOnPort -Port 3001

# Wait a bit to ensure ports are fully released
Start-Sleep -Seconds 3

# Step 2: Run Unit Tests
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 2: Running Unit Tests..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$unitTestResult = $true
try {
    bun run test:unit
    if ($LASTEXITCODE -ne 0) {
        $unitTestResult = $false
        Write-Host ""
        Write-Host "✗ Unit tests failed!" -ForegroundColor Red
    }
    else {
        Write-Host ""
        Write-Host "✓ Unit tests passed!" -ForegroundColor Green
    }
}
catch {
    $unitTestResult = $false
    Write-Host ""
    Write-Host "✗ Unit tests failed with error: $_" -ForegroundColor Red
}

# Step 3: Start test server for integration tests
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 3: Running Integration Tests..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$integrationTestResult = $true

# Start dev server on port 3001 in background
Write-Host "Starting test server on port 3001..." -ForegroundColor Yellow
$testServer = Start-Process -FilePath "bunx" -ArgumentList "next", "dev", "-p", "3001" -PassThru -NoNewWindow -RedirectStandardOutput "test-server-output.log" -RedirectStandardError "test-server-error.log"

# Wait for server to start
Write-Host "Waiting for test server to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if server is running
$serverRunning = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 2 -ErrorAction SilentlyContinue | Out-Null
        $serverRunning = $true
        Write-Host "✓ Test server is ready!" -ForegroundColor Green
        break
    }
    catch {
        Write-Host "  Waiting for server... ($i/30)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if ($serverRunning) {
    # Run integration tests
    try {
        $env:BASE_URL = "http://127.0.0.1:3001"
        bun run test:integration
        if ($LASTEXITCODE -ne 0) {
            $integrationTestResult = $false
            Write-Host ""
            Write-Host "✗ Integration tests failed!" -ForegroundColor Red
        }
        else {
            Write-Host ""
            Write-Host "✓ Integration tests passed!" -ForegroundColor Green
        }
    }
    catch {
        $integrationTestResult = $false
        Write-Host ""
        Write-Host "✗ Integration tests failed with error: $_" -ForegroundColor Red
    }
}
else {
    $integrationTestResult = $false
    Write-Host "✗ Test server failed to start!" -ForegroundColor Red
}

# Stop test server
if ($testServer -and !$testServer.HasExited) {
    Write-Host "Stopping test server..." -ForegroundColor Yellow
    Stop-Process -Id $testServer.Id -Force -ErrorAction SilentlyContinue
}
Stop-ProcessOnPort -Port 3001

# Step 4: Run E2E Tests
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 4: Running E2E Tests..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$e2eTestResult = $true
try {
    bun run test:e2e
    if ($LASTEXITCODE -ne 0) {
        $e2eTestResult = $false
        Write-Host ""
        Write-Host "✗ E2E tests failed!" -ForegroundColor Red
    }
    else {
        Write-Host ""
        Write-Host "✓ E2E tests passed!" -ForegroundColor Green
    }
}
catch {
    $e2eTestResult = $false
    Write-Host ""
    Write-Host "✗ E2E tests failed with error: $_" -ForegroundColor Red
}

# Step 5: Restart dev server on port 3000
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 5: Restarting dev server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting dev server on port 3000..." -ForegroundColor Yellow
Start-Process -FilePath "bun" -ArgumentList "run", "dev"

Write-Host "✓ Dev server started!" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($unitTestResult) {
    Write-Host "✓ Unit Tests: PASSED" -ForegroundColor Green
}
else {
    Write-Host "✗ Unit Tests: FAILED" -ForegroundColor Red
}

if ($integrationTestResult) {
    Write-Host "✓ Integration Tests: PASSED" -ForegroundColor Green
}
else {
    Write-Host "✗ Integration Tests: FAILED" -ForegroundColor Red
}

if ($e2eTestResult) {
    Write-Host "✓ E2E Tests: PASSED" -ForegroundColor Green
}
else {
    Write-Host "✗ E2E Tests: FAILED" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Exit with error code if any tests failed
if (!$unitTestResult -or !$integrationTestResult -or !$e2eTestResult) {
    Write-Host "Some tests failed. Please review the output above." -ForegroundColor Red
    exit 1
}
else {
    Write-Host "All tests passed! 🎉" -ForegroundColor Green
    exit 0
}
