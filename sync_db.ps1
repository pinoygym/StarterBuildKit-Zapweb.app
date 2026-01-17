$ErrorActionPreference = "Stop"

# 1. Sync Development DB
$env:DATABASE_URL = 'postgresql://neondb_owner:npg_mBh8RKAr9Nei@ep-noisy-mountain-a18wvzwi-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
Write-Host "----------------------------------------"
Write-Host "Syncing Development DB..."
Write-Host "URL: ...ep-noisy-mountain-a18wvzwi..."
Write-Host "----------------------------------------"
# We use --create-only first to see if there are changes, then apply. 
# Actually, just 'migrate dev' is fine, it handles creation and application.
# If there is drift, it might ask for reset. We'll try to handle that if it happens, 
# but for now let's assume standard flow.
bunx prisma migrate dev --name sync_dev

# 2. Sync Production DB
$env:DATABASE_URL = 'postgresql://neondb_owner:npg_mBh8RKAr9Nei@ep-blue-mouse-a128nyc9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
Write-Host "----------------------------------------"
Write-Host "Syncing Production DB..."
Write-Host "URL: ...ep-blue-mouse-a128nyc9..."
Write-Host "----------------------------------------"
bunx prisma migrate deploy

# 3. Generate Client
Write-Host "----------------------------------------"
Write-Host "Generating Prisma Client..."
Write-Host "----------------------------------------"
bunx prisma generate

# 4. Build
Write-Host "----------------------------------------"
Write-Host "Building Application..."
Write-Host "----------------------------------------"
bun run build
