# InventoryPro Training Demo Videos - Proof of Concept

Automated screen recording system for generating professional training videos using Playwright.

## 🎯 Overview

This proof-of-concept includes **4 demo videos** showcasing the core features of InventoryPro:

1. **Login & Authentication** (~5 min) - User login and dashboard access
2. **Dashboard Overview** (~6 min) - KPIs, charts, and navigation
3. **Product Creation** (~7 min) - Creating products with multi-UOM
4. **POS Transaction** (~8 min) - Complete point of sale workflow

**Total Duration**: ~26 minutes

---

## 🚀 Quick Start

### Prerequisites

1. **Development server running**: `npm run dev`
2. **Database seeded** with demo data
3. **Playwright installed**: Should already be installed via `package.json`

### Step 1: Seed Demo Data

```bash
npm run demo:seed
```

This creates:
- 2 branches (Manila Main, Quezon City)
- 2 warehouses
- 2 suppliers, 2 customers
- 30 products (Water, Carbonated, Juice, Energy, Sports drinks)
- Initial inventory
- Sample POS transaction

### Step 2: Record All Demos

```bash
npm run demo:record
```

This will:
1. Run the setup script (seed data + login)
2. Record all 4 demo videos sequentially
3. Generate narration scripts and subtitles
4. Save videos to `demo-recordings/`

### Step 3: Record Individual Demos

```bash
# Record just the login demo
npm run demo:record:login

# Record dashboard demo
npm run demo:record:dashboard

# Record product creation demo
npm run demo:record:products

# Record POS transaction demo
npm run demo:record:pos
```

---

## 📁 Output Structure

After recording, you'll find:

```
demo-recordings/
├── 01-authentication/
│   ├── login-demo-chrome-demo/
│   │   ├── video.webm              # Recorded video
│   │   └── screenshots/
│   ├── login-script.json           # Narration timestamps
│   └── login-subtitles.srt         # SRT subtitles
├── 02-dashboard/
│   ├── overview-demo-chrome-demo/
│   ├── overview-script.json
│   └── overview-subtitles.srt
├── 03-products/
│   ├── product-creation-demo-chrome-demo/
│   ├── product-creation-script.json
│   └── product-creation-subtitles.srt
└── 06-sales-workflow/
    ├── pos-transaction-demo-chrome-demo/
    ├── pos-transaction-script.json
    └── pos-transaction-subtitles.srt
```

---

## 🎬 Features Included in POC

### ✅ Implemented

- **Automated screen recording** at 1920x1080 (Full HD)
- **Slowed-down actions** with visual highlighting
- **Narration system** with timestamp tracking
- **Interactive elements**:
  - Mouse pointer highlighting with blue ring
  - Keyboard input display (bottom-right overlay)
  - Dynamic annotations and callouts
- **Subtitle generation** (SRT format)
- **Narration scripts** (JSON format with timestamps)
- **Demo data seeding** (30 products, transactions, inventory)

### ⏳ To Be Implemented (Next Phase)

- **TTS voiceover** generation (Google Cloud Text-to-Speech)
- **MP4 conversion** (WebM → H.264 MP4)
- **Thumbnail generation** (auto-extract at 5 seconds)
- **Video concatenation** (combine related demos)
- **YouTube upload** automation (@mainframe4715 channel)

---

## 🔧 Technical Details

### Helper Classes

**NarrationHelper** (`tests/demos/helpers/narration.helper.ts`)
- Records narration cues with timestamps
- Exports JSON scripts for post-production
- Generates SRT subtitle files
- Console logging with formatted timestamps

**DemoActions** (`tests/demos/helpers/demo-actions.helper.ts`)
- Slowed-down clicks with 1.5s delay
- Character-by-character typing effect
- Blue border + glow highlighting
- Screenshot capture with labels

**MouseTracker** (`tests/demos/helpers/mouse-tracker.helper.ts`)
- Injects blue ring cursor overlay
- Pulse animation on click
- Always visible during recording

**KeyboardDisplay** (`tests/demos/helpers/keyboard-display.helper.ts`)
- Shows keyboard inputs on-screen
- Displays key combinations (e.g., "Ctrl + F")
- Auto-hides after 2 seconds

**AnnotationHelper** (`tests/demos/helpers/annotation.helper.ts`)
- Dynamic callouts with position awareness
- Section highlighting with labels
- Fade-in/fade-out animations

### Demo Test Pattern

```typescript
import { test, expect } from '@playwright/test';
import { NarrationHelper } from '../helpers/narration.helper';
import { DemoActions } from '../helpers/demo-actions.helper';
import { MouseTracker } from '../helpers/mouse-tracker.helper';

test('demo name', async ({ page }) => {
  const narration = new NarrationHelper('Video Title');
  const demo = new DemoActions(page);
  const mouseTracker = new MouseTracker();

  // Inject interactive elements
  await mouseTracker.inject(page);

  // Record narration with timestamps
  await narration.narrate('Welcome text...', 5000);

  // Perform slowed actions with highlighting
  await demo.click(page.getByRole('button', { name: 'Click Me' }));
  await demo.fill(page.getByLabel('Name'), 'Product Name');

  // Export scripts
  writeFileSync('script.json', narration.exportScript());
  writeFileSync('subtitles.srt', narration.exportSRT());
});
```

---

## 📊 Video Details

### 1. Login & Authentication
- **File**: `tests/demos/01-authentication/login.demo.ts`
- **Duration**: ~5 minutes
- **Covers**:
  - Login page overview
  - Email and password input
  - Sign in button click
  - Dashboard redirect
  - KPI overview
  - Sidebar navigation

### 2. Dashboard Overview
- **File**: `tests/demos/02-dashboard/overview.demo.ts`
- **Duration**: ~6 minutes
- **Covers**:
  - KPI cards (Products, Stock, Inventory Value, Sales)
  - AR/AP monitoring
  - Charts and visualizations
  - Navigation sidebar
  - Branch selector

### 3. Product Creation
- **File**: `tests/demos/03-products/product-creation.demo.ts`
- **Duration**: ~7 minutes
- **Covers**:
  - Products page overview
  - Add Product dialog
  - Product name, category selection
  - Base UOM configuration
  - Pricing (base price, cost price)
  - Minimum stock level
  - Shelf life in days
  - Product description

### 4. POS Transaction
- **File**: `tests/demos/06-sales-workflow/pos-transaction.demo.ts`
- **Duration**: ~8 minutes
- **Covers**:
  - POS interface overview
  - Product grid and search
  - Adding items to cart
  - Cart management
  - Subtotal, tax, total calculation
  - Payment method selection (Cash)
  - Amount paid and change calculation
  - Transaction completion
  - Receipt generation
  - Automatic inventory updates

---

## 🛠️ Troubleshooting

### Video recording failed
- Ensure development server is running: `npm run dev`
- Check Playwright browser installation: `npx playwright install`
- Verify database is accessible

### Slow recording
- Adjust `slowMo` in `playwright.config.demo.ts` (default: 500ms)
- Reduce `defaultDelay` in `DemoActions` class (default: 1500ms)

### Missing narration cues
- Check console output for timestamps
- Verify narration scripts are exported to correct directory
- Ensure `writeFileSync` has proper permissions

### Demo setup fails
- Run `npm run demo:seed` separately first
- Check database connection
- Verify admin user exists: `cybergada@gmail.com`

### Elements not found
- UI selectors may need adjustment for your specific implementation
- Check if elements have proper `aria-labels` or `data-testid` attributes
- Add waits for dynamic content to load

---

## 📝 Narration Script Format

### JSON Format (`*-script.json`)

```json
{
  "videoTitle": "Product Creation and Management",
  "totalDuration": 420000,
  "cues": [
    {
      "timestamp": 0,
      "text": "Welcome to InventoryPro...",
      "duration": 5000,
      "action": "Introduction"
    },
    {
      "timestamp": 5000,
      "text": "Click the Add Product button.",
      "duration": 3000,
      "action": "Click Add Product button"
    }
  ]
}
```

### SRT Format (`*-subtitles.srt`)

```
1
00:00:00,000 --> 00:00:05,000
Welcome to InventoryPro...

2
00:00:05,000 --> 00:00:08,000
Click the Add Product button.
```

---

## 🎥 Next Steps (Post-POC)

### Phase 1: Post-Production Tools
1. Implement thumbnail generation script
2. Add Google Cloud TTS integration
3. Create WebM → MP4 conversion script
4. Build video concatenation utility

### Phase 2: YouTube Integration
1. Set up YouTube Data API v3
2. Create upload automation script
3. Organize videos into playlists
4. Add video metadata and descriptions

### Phase 3: Expand Video Library
5. Record remaining 18 demo videos:
   - Registration & email verification
   - Inventory management (batch tracking, adjustments, transfers)
   - Purchase workflows (POs, receiving vouchers)
   - Sales orders
   - Financials (AR, AP, expenses)
   - Reports (inventory, sales, financial)
   - User & role management

### Phase 4: Manual Voiceover
6. Generate professional recording scripts
7. Record manual voiceover
8. Replace TTS with human voice
9. Re-export final videos

---

## 📚 Additional Resources

### Playwright Documentation
- [Playwright Test](https://playwright.dev/docs/intro)
- [Video Recording](https://playwright.dev/docs/videos)
- [Screenshots](https://playwright.dev/docs/screenshots)

### Project Files
- Playwright Config: `playwright.config.demo.ts`
- Demo Setup: `tests/demos/demo.setup.ts`
- Seed Script: `scripts/demo/seed-demo-data.ts`
- Helper Classes: `tests/demos/helpers/`

---

## 👥 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review existing demo test files for patterns
3. Examine helper class implementations
4. Test individual components in isolation

---

## ✅ POC Success Criteria

- [x] 4 demo videos recorded successfully
- [x] Total duration: ~26 minutes
- [x] Interactive elements working (mouse, keyboard, annotations)
- [x] Narration scripts generated with timestamps
- [x] SRT subtitles created for all videos
- [x] Demo data seeding functional
- [x] Automated recording workflow operational

**Status**: ✨ POC Complete and Ready for Testing!

---

**YouTube Channel**: [@mainframe4715](https://www.youtube.com/@mainframe4715)

**Next Phase**: Post-production utilities + YouTube upload automation
