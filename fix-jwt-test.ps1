# PowerShell script to fix the JWT mocking in auth.service.test.ts
$filePath = "c:/Users/HI/Documents/GitHub/_deve local/_React Apps/test/tests/unit/services/auth.service.test.ts"
$content = Get-Content -Path $filePath -Raw

# Fix the first test: change vi.mocked to vi.spyOn
$content = $content -replace `
  "(?s)(it\('should verify valid token'.*?const jwt = require\('jsonwebtoken'\);)\s*vi\.mocked\(jwt\.verify\)\.mockReturnValue\(", `
  "`$1`r`n      const verifyMock = vi.spyOn(jwt, 'verify').mockReturnValue("

$content = $content -replace `
  "(?s)(expect\(result\?\.userId\)\.toBe\(testUserId\);)\s*\}\);", `
  "`$1`r`n      `r`n      verifyMock.mockRestore();`r`n    });"

# Fix the second test
$content = $content -replace `
  "(?s)(it\('should return null for invalid token'.*?const jwt = require\('jsonwebtoken'\);)\s*vi\.mocked\(jwt\.verify\)\.mockImplementation\(", `
  "`$1`r`n      const verifyMock = vi.spyOn(jwt, 'verify').mockImplementation("

# Fix the third test
$content = $content -replace `
  "(?s)(it\('should return null when JWT_SECRET is not configured'.*?const originalSecret = process\.env\.JWT_SECRET;)\s*(delete process\.env\.JWT_SECRET;)", `
  "`$1`r`n      const originalEnv = process.env.NODE_ENV;`r`n      `r`n      `$2`r`n      process.env.NODE_ENV = 'production';"

$content = $content -replace `
  "(?s)(// Restore\s*process\.env\.JWT_SECRET = originalSecret;)\s*\}\);", `
  "`$1`r`n      process.env.NODE_ENV = originalEnv;`r`n    });"

Set-Content -Path $filePath -Value $content
Write-Host "JWT mocking fixed in auth.service.test.ts"
