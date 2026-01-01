
$ProdUrl = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
$DevUrl = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-spring-pond-a1stve3k-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

Write-Host "Comparing Prod to Dev..."
# Using --exit-code to get status
# Using config files
npx -y prisma migrate diff --from-config-datasource prisma.config.prod.ts --to-config-datasource prisma.config.dev.ts --exit-code

if ($LASTEXITCODE -eq 0) {
    Write-Host "Schemas are IDENTICAL."
}
elseif ($LASTEXITCODE -eq 2) {
    Write-Host "Schemas are DIFFERENT."
}
else {
    Write-Host "Error occurred."
}
