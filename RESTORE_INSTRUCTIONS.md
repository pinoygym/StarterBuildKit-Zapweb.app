# ⚠️ IMPORTANT: Backup Restore Instructions

## The Problem You Just Encountered

You tried to restore this file:
```
❌ Ormoc_Buenas_Shoppers_2025-12-31_08-39-49.json (v1.1 - INCOMPATIBLE)
```

This caused a **500 Internal Server Error** because the v1.1 format uses plural keys (`branches`, `warehouses`) but the current restore service expects singular keys (`branch`, `warehouse`).

## The Solution

Use the **converted v2.0 file** instead:
```
✅ Ormoc_Buenas_Shoppers_2025-12-31_08-39-49_v2.json (v2.0 - COMPATIBLE)
```

This file was automatically created for you with all keys converted to the correct format.

## How to Restore (Step-by-Step)

1. **Go to Settings** → **Database** section
2. Click **"Restore from Backup"** button
3. **IMPORTANT**: Select the file ending with `_v2.json`:
   ```
   Ormoc_Buenas_Shoppers_2025-12-31_08-39-49_v2.json
   ```
4. Confirm the restore operation
5. Wait for completion (may take 30-60 seconds for large databases)

## File Comparison

| File | Version | Status | Use For |
|------|---------|--------|---------|
| `Ormoc_Buenas_Shoppers_2025-12-31_08-39-49.json` | v1.1 | ❌ Incompatible | Archive only |
| `Ormoc_Buenas_Shoppers_2025-12-31_08-39-49_v2.json` | v2.0 | ✅ Compatible | **Restore** |

## What's Different?

The v2.0 file has the same data, just with corrected key names:

**v1.1 (Old - Don't Use)**:
```json
{
  "version": "1.1",
  "data": {
    "branches": [...],      // ❌ Plural
    "warehouses": [...],    // ❌ Plural
    "users": [...]          // ❌ Plural
  }
}
```

**v2.0 (New - Use This)**:
```json
{
  "version": "2.0",
  "data": {
    "branch": [...],        // ✅ Singular
    "warehouse": [...],     // ✅ Singular
    "user": [...]           // ✅ Singular
  }
}
```

## Need to Convert Another Backup?

If you have other v1.1 backup files, use the conversion script:

```bash
bun run scripts/convert-backup-v1-to-v2.ts <your-backup-file.json>
```

This will create a new `<your-backup-file>_v2.json` file ready for restore.

## Troubleshooting

### Still Getting 500 Error?
- Make sure you selected the `_v2.json` file
- Check the browser console for specific error messages
- Check the server logs in the terminal running `bun run dev`

### File Not Found?
The v2.0 file should be in the same directory as the original:
```
C:\Users\HI\Documents\GitHub\buenasv2\Ormoc_Buenas_Shoppers_2025-12-31_08-39-49_v2.json
```

If it's missing, run the conversion script again.
