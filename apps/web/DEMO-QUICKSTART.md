# 🎬 Demo Video Recording - Quick Start Guide

## Prerequisites Checklist

- [ ] Development server running (`npm run dev`)
- [ ] Database accessible
- [ ] Playwright installed (should be via package.json)

## Step-by-Step Recording Process

### 1. Seed Demo Data (One-time)

```bash
npm run demo:seed
```

**Expected output**:
```
🎬 Seeding demo data for training videos...
🏢 Creating branches...
✅ Created 2 branches
🏭 Creating warehouses...
✅ Created 2 warehouses
...
✅ Demo data seeding completed successfully!
```

### 2. Record All 4 POC Videos

```bash
npm run demo:record
```

**What happens**:
1. Setup runs (seeds data + logs in)
2. Records 4 demos sequentially:
   - Login (~5 min)
   - Dashboard (~6 min)
   - Product Creation (~7 min)
   - POS Transaction (~8 min)
3. Saves to `demo-recordings/`

**Total time**: ~30-35 minutes

### 3. Find Your Videos

```
demo-recordings/
├── 01-authentication/login-demo-chrome-demo/video.webm
├── 02-dashboard/overview-demo-chrome-demo/video.webm
├── 03-products/product-creation-demo-chrome-demo/video.webm
└── 06-sales-workflow/pos-transaction-demo-chrome-demo/video.webm
```

### 4. View Videos

- **Chrome/Edge**: Supports WebM natively - just double-click
- **VLC Player**: Universal playback
- **Windows Media Player**: May need codecs

## Individual Demo Recording

### Record Just One Demo

```bash
# Login only
npm run demo:record:login

# Dashboard only
npm run demo:record:dashboard

# Products only
npm run demo:record:products

# POS only
npm run demo:record:pos
```

## Troubleshooting

### "Demo setup failed"
```bash
# Re-seed data manually
npm run demo:seed

# Check if server is running
curl http://localhost:3000
```

### "Browser not found"
```bash
# Install Playwright browsers
npx playwright install chromium
```

### "Database connection error"
- Check `.env` file has correct `DATABASE_URL`
- Verify database is running
- Run `npx prisma generate`

### "Videos not recording"
- Check disk space (videos are ~100-200MB each)
- Verify `demo-recordings/` directory exists
- Check Playwright config: `playwright.config.demo.ts`

## Output Files Explained

### Video Files (`.webm`)
- Main recording in WebM format
- 1920x1080 Full HD
- ~100-200MB per 10 min video

### Narration Scripts (`.json`)
```json
{
  "videoTitle": "Login & Authentication",
  "totalDuration": 300000,
  "cues": [
    {
      "timestamp": 0,
      "text": "Welcome to InventoryPro...",
      "duration": 5000
    }
  ]
}
```

### Subtitles (`.srt`)
```
1
00:00:00,000 --> 00:00:05,000
Welcome to InventoryPro, a comprehensive inventory management system.
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Slow recording | Adjust `slowMo` in `playwright.config.demo.ts` |
| Missing elements | Check UI selectors in demo test files |
| Authentication fails | Verify admin account exists (`cybergada@gmail.com`) |
| Videos too large | Use post-production compression (Phase 2) |

## Next Steps

After recording POC videos:

1. **Review videos** - Check quality and coverage
2. **Test narration** - Verify timestamps align with actions
3. **Feedback** - Note any improvements needed
4. **Phase 2** - Implement post-production (TTS, MP4 conversion, YouTube upload)

## YouTube Upload (Phase 2)

Target channel: [@mainframe4715](https://www.youtube.com/@mainframe4715)

Will include:
- MP4 conversion
- TTS voiceover (Google Cloud)
- Thumbnail generation
- Automated upload with metadata
- Playlist organization

---

## Quick Reference Commands

```bash
# Full workflow
npm run demo:seed                 # Seed data (once)
npm run demo:record               # Record all 4 demos

# Individual demos
npm run demo:record:login         # Login demo only
npm run demo:record:dashboard     # Dashboard demo only
npm run demo:record:products      # Products demo only
npm run demo:record:pos           # POS demo only

# View help
npx playwright test --help

# Clean recordings
rm -rf demo-recordings/*          # Remove all recordings
```

---

**Estimated Time**: 45 minutes total (15 min setup + 30 min recording)

**YouTube Channel**: [@mainframe4715](https://www.youtube.com/@mainframe4715)
