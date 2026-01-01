# ✅ Demo Video System Testing Checklist

## Pre-Test Setup

- [ ] Development server is running (`npm run dev`)
- [ ] Database is accessible and migrated
- [ ] Can access http://localhost:3000 in browser
- [ ] Playwright browsers installed (`npx playwright install`)

---

## Step 1: Seed Demo Data

```bash
npm run demo:seed
```

### Expected Output:
```
🎬 Seeding demo data for training videos...
🏢 Creating branches...
✅ Created 2 branches
🏭 Creating warehouses...
✅ Created 2 warehouses
👥 Creating suppliers...
✅ Created 2 suppliers
👨‍💼 Creating customers...
✅ Created 2 customers
📦 Generating product catalog...
✅ Created 30 products
📦 Creating initial inventory...
✅ Created XX inventory records
🛒 Creating sample POS transaction...
✅ Created sample POS transaction: RCP-XXXXXXXX-0001
✨ Demo data seeding completed successfully!
```

### Verification:
- [ ] No errors in output
- [ ] See "✨ Demo data seeding completed successfully!"
- [ ] Summary shows: 2 branches, 2 warehouses, 2 suppliers, 2 customers, 30 products

---

## Step 2: Test Individual Demos (Recommended First Time)

### Test 1: Login Demo (~5 min)

```bash
npm run demo:record:login
```

#### What to Watch For:
- [ ] Browser opens automatically
- [ ] Navigates to login page
- [ ] Blue cursor ring is visible
- [ ] Fills email character-by-character
- [ ] Fills password character-by-character
- [ ] Clicks Sign In with blue highlight
- [ ] Redirects to dashboard
- [ ] Console shows narration timestamps

#### Expected Output Files:
```
demo-recordings/
└── 01-authentication/
    ├── login-demo-chrome-demo/
    │   ├── video.webm            ✅ Check this exists
    │   └── screenshots/
    ├── login-script.json         ✅ Check this exists
    └── login-subtitles.srt       ✅ Check this exists
```

#### Verification:
- [ ] Video file exists and can be played
- [ ] Video shows blue cursor ring
- [ ] Actions are slowed down and visible
- [ ] JSON script has timestamps
- [ ] SRT file has subtitle entries

---

### Test 2: Dashboard Demo (~6 min)

```bash
npm run demo:record:dashboard
```

#### What to Watch For:
- [ ] Navigates to dashboard
- [ ] Shows KPI cards
- [ ] Blue cursor visible
- [ ] Narration timing matches actions

#### Verification:
- [ ] `demo-recordings/02-dashboard/overview-demo-chrome-demo/video.webm` exists
- [ ] `demo-recordings/02-dashboard/overview-script.json` exists
- [ ] `demo-recordings/02-dashboard/overview-subtitles.srt` exists

---

### Test 3: Product Creation Demo (~7 min)

```bash
npm run demo:record:products
```

#### What to Watch For:
- [ ] Navigates to Products page
- [ ] Clicks Add Product
- [ ] Fills form fields with typing effect
- [ ] Blue highlighting on fields
- [ ] Creates product successfully

#### Verification:
- [ ] `demo-recordings/03-products/product-creation-demo-chrome-demo/video.webm` exists
- [ ] Video shows product creation flow
- [ ] Narration scripts exported

---

### Test 4: POS Transaction Demo (~8 min)

```bash
npm run demo:record:pos
```

#### What to Watch For:
- [ ] Navigates to POS page
- [ ] Shows product grid
- [ ] Adds items to cart
- [ ] Processes payment
- [ ] Generates receipt

#### Verification:
- [ ] `demo-recordings/06-sales-workflow/pos-transaction-demo-chrome-demo/video.webm` exists
- [ ] Video shows complete transaction
- [ ] All interactive elements working

---

## Step 3: Test Full Recording (All 4 Demos)

```bash
npm run demo:record
```

### Expected Flow:
1. **Demo Setup** runs first (seeds + login)
2. **Login demo** records (~5 min)
3. **Dashboard demo** records (~6 min)
4. **Product demo** records (~7 min)
5. **POS demo** records (~8 min)

**Total Time**: ~30-35 minutes

### Verification:
- [ ] All 4 videos created
- [ ] All 4 JSON scripts created
- [ ] All 4 SRT subtitle files created
- [ ] No errors in console
- [ ] Each video is playable

---

## Step 4: Video Quality Check

### For Each Video:

#### Visual Quality
- [ ] 1920x1080 resolution
- [ ] Clear and sharp
- [ ] Blue cursor ring visible
- [ ] Element highlighting works
- [ ] No flickering or glitches

#### Timing & Pacing
- [ ] Actions are slow enough to follow
- [ ] Not too slow (boring)
- [ ] Reasonable pauses between actions
- [ ] Narration timing makes sense

#### Interactive Elements
- [ ] Mouse pointer with blue ring visible
- [ ] Click animations (pulse effect)
- [ ] Keyboard display appears when typing
- [ ] Element highlighting (blue border + glow)

#### Content Coverage
- **Login**: Email, password, sign in, dashboard
- **Dashboard**: KPIs, charts, navigation
- **Products**: Add product form, all fields, submit
- **POS**: Product selection, cart, payment, receipt

---

## Step 5: Narration Scripts Check

### JSON Script (`*-script.json`)

Open any script file and verify:
- [ ] `videoTitle` is present
- [ ] `totalDuration` is reasonable (milliseconds)
- [ ] `cues` array has multiple entries
- [ ] Each cue has:
  - [ ] `timestamp` (milliseconds)
  - [ ] `text` (narration content)
  - [ ] `duration` (how long to display)
  - [ ] `action` (optional description)

### SRT Subtitles (`*-subtitles.srt`)

Open any SRT file and verify:
- [ ] Numbered entries (1, 2, 3...)
- [ ] Timestamps in format: `HH:MM:SS,mmm --> HH:MM:SS,mmm`
- [ ] Subtitle text after timestamps
- [ ] Blank line between entries

---

## Troubleshooting

### Issue: "Demo setup failed"
**Solution**:
```bash
# Re-seed data
npm run demo:seed

# Check admin user exists
npx prisma studio
# Look for: cybergada@gmail.com
```

### Issue: "Browser not found"
**Solution**:
```bash
npx playwright install chromium
```

### Issue: "Video file is 0 bytes"
**Possible Causes**:
- Recording failed mid-way
- Disk space full
- Permissions issue

**Solution**:
- Check disk space
- Re-run the demo
- Check console for errors

### Issue: "Elements not found in test"
**Solution**:
- UI may have changed
- Check selectors in demo test files
- Update selectors if needed

### Issue: "Typing is too slow/fast"
**Solution**:
Edit `tests/demos/helpers/demo-actions.helper.ts`:
```typescript
const typingSpeed = options?.typingSpeed ?? 100; // Change this value
```

### Issue: "Actions are too slow"
**Solution**:
Edit `playwright.config.demo.ts`:
```typescript
slowMo: 500, // Change to 300 or 200
```

Or edit `tests/demos/helpers/demo-actions.helper.ts`:
```typescript
private defaultDelay = 1500; // Change to 1000 or 800
```

---

## Success Criteria

✅ **POC is successful if**:
- [ ] All 4 videos record without errors
- [ ] Videos are playable in Chrome/VLC
- [ ] Blue cursor ring is visible
- [ ] Actions are slowed and clear
- [ ] Narration scripts are generated
- [ ] SRT subtitles are created
- [ ] Total duration is ~25-30 minutes
- [ ] Content covers key features

---

## File Size Reference

**Expected file sizes** (approximate):
- Each 5-min video: ~50-100 MB
- Each 10-min video: ~100-200 MB
- JSON scripts: ~5-10 KB
- SRT files: ~2-5 KB

**Total POC output**: ~500 MB - 1 GB

---

## Next Steps After Testing

### If Everything Works ✅

1. **Review videos** for quality and coverage
2. **Note improvements** (timing, content, etc.)
3. **Proceed to Phase 2**:
   - Post-production utilities
   - TTS voiceover
   - MP4 conversion
   - YouTube upload

### If Issues Found ❌

1. **Document the issue**:
   - Which demo failed?
   - Error message?
   - Screenshot if possible

2. **Check troubleshooting section**

3. **Review demo test file** for the failing demo

4. **Test in isolation**:
   ```bash
   npm run demo:record:login  # Test just this one
   ```

---

## Video Playback

### Recommended Players:
- **Chrome/Edge**: Native WebM support ✅
- **VLC Media Player**: Universal playback ✅
- **Firefox**: Native WebM support ✅
- **Windows Media Player**: May need codec pack

### Convert to MP4 (Phase 2):
```bash
# Will be available after implementing post-production
npm run demo:convert-mp4
```

---

## Documentation References

- **Full Documentation**: `tests/demos/README.md`
- **Quick Start**: `DEMO-QUICKSTART.md`
- **POC Summary**: `POC-SUMMARY.md`
- **Plan Details**: `C:\Users\HI\.claude\plans\transient-watching-yao.md`

---

## Contact & Support

**YouTube Channel**: [@mainframe4715](https://www.youtube.com/@mainframe4715)

**Issues or Questions**:
1. Check `tests/demos/README.md` troubleshooting section
2. Review demo test file code
3. Check Playwright documentation

---

**Happy Testing!** 🎬🎉
