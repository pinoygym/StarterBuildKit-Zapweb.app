#!/bin/bash
# Script to clean up .backup files after verifying the conversion worked

echo "This will delete all .backup files created during the async handler conversion."
echo "Make sure you've tested the application first!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    echo "Removing backup files..."
    find /home/user/buenasv2/app/api -name "*.backup" -delete
    echo "✅ Cleanup complete!"
else
    echo "❌ Cleanup cancelled."
fi
