
Write-Host "Checking for drift between schema.prisma and Production Config..."
npx -y prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-config-datasource prisma.config.prod.ts --exit-code

if ($LASTEXITCODE -eq 0) {
    Write-Host "No drift. Schema matches Production."
}
elseif ($LASTEXITCODE -eq 2) {
    Write-Host "Drift detected! Local schema has changes not in Production."
}
else {
    Write-Host "Error running diff."
}
