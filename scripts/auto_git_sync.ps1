$intervalSeconds = 1800 # 30 minutes

Write-Host "Starting Auto-Git Sync..."
Write-Host "Sync interval: $intervalSeconds seconds"
Write-Host "Press Ctrl+C to stop."

while ($true) {
    try {
        $status = git status --porcelain
        if ($status) {
            Write-Host "Changes detected. Syncing..."
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            
            git add .
            git commit -m "Auto-save: $timestamp"
            git push
            
            Write-Host "Sync completed at $timestamp"
        }
        else {
            Write-Host "No changes detected. Skipping sync."
        }
    }
    catch {
        Write-Error "An error occurred during sync: $_"
    }

    Start-Sleep -Seconds $intervalSeconds
}
