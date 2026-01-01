# Demo Video Language Switcher Guide

This guide explains how to create demo videos with narration in multiple languages using the automated language switcher system.

## Overview

The language switcher system allows you to generate demo videos with:
- **Text-to-Speech (TTS) narration** in multiple languages using Google Cloud TTS
- **Automatic subtitle generation** synchronized with narration
- **Professional video output** with burned-in subtitles
- **Support for English, Cebuano, Filipino, and custom languages**

## Table of Contents

1. [Quick Start](#quick-start)
2. [Supported Languages](#supported-languages)
3. [Prerequisites](#prerequisites)
4. [Usage Methods](#usage-methods)
5. [File Structure](#file-structure)
6. [Adding New Languages](#adding-new-languages)
7. [Troubleshooting](#troubleshooting)
8. [Examples](#examples)

---

## Quick Start

Generate a Cebuano version of your demo video:

```bash
npx tsx scripts/post-production/generate-demo-video.ts \
  demo-recordings/06-sales-workflow/pos-video-silent.mp4 \
  demo-recordings/06-sales-workflow/pos-transaction-script-cebuano.json \
  ceb \
  POS-DEMO-CEBUANO.mp4
```

**Output**: `demo-recordings/06-sales-workflow/POS-DEMO-CEBUANO.mp4`

---

## Supported Languages

| Language Code | Language Name     | Voice Name              | Gender | Region |
|---------------|-------------------|-------------------------|--------|--------|
| `en`          | English           | en-US-Neural2-J         | Male   | US     |
| `ceb`         | Cebuano           | fil-PH-Standard-A       | Female | PH     |
| `fil`         | Filipino/Tagalog  | fil-PH-Standard-A       | Female | PH     |

**Note**: Cebuano uses the Filipino voice as Google Cloud TTS doesn't have a dedicated Cebuano voice. This is the closest available option.

---

## Prerequisites

### 1. Google Cloud Text-to-Speech Setup (Optional)

For actual TTS audio generation:

1. Create a Google Cloud project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the Text-to-Speech API
3. Create a service account and download credentials JSON
4. Set environment variable:
   ```bash
   set GOOGLE_APPLICATION_CREDENTIALS=path\to\credentials.json
   ```

**Without credentials**: The system will create silent audio placeholders with narration scripts.

### 2. Required Dependencies

All dependencies are already installed in the project:
- `@google-cloud/text-to-speech` - TTS API client
- `fluent-ffmpeg` - Audio/video processing
- `@ffmpeg-installer/ffmpeg` - FFmpeg binary

---

## Usage Methods

### Method 1: All-in-One Command (Recommended)

Generate complete demo video with a single command:

```bash
npx tsx scripts/post-production/generate-demo-video.ts \
  <video-file> \
  <script-file> \
  <language-code> \
  <output-name>
```

**This automatically:**
1. Generates TTS audio from script
2. Creates subtitle file (.srt)
3. Merges audio with video
4. Burns subtitles into video
5. Outputs final video file

**Parameters:**
- `<video-file>` - Path to silent video (MP4)
- `<script-file>` - Path to narration script (JSON)
- `<language-code>` - Language code (en, ceb, fil)
- `<output-name>` - Output filename (optional)

### Method 2: Step-by-Step (Advanced)

For more control over the process:

**Step 1 - Extract Silent Video** (if needed):
```bash
npx tsx scripts/post-production/extract-silent-video.ts \
  demo-recordings/06-sales-workflow/POS-DEMO-COMPLETE.mp4 \
  demo-recordings/06-sales-workflow/pos-video-silent.mp4
```

**Step 2 - Generate TTS Audio**:
```bash
npx tsx scripts/post-production/generate-tts.ts \
  demo-recordings/06-sales-workflow/pos-transaction-script-cebuano.json \
  demo-recordings/06-sales-workflow/pos-audio-cebuano.mp3 \
  ceb
```

**Step 3 - Generate Complete Video**:
```bash
npx tsx scripts/post-production/generate-demo-video.ts \
  demo-recordings/06-sales-workflow/pos-video-silent.mp4 \
  demo-recordings/06-sales-workflow/pos-transaction-script-cebuano.json \
  ceb \
  POS-DEMO-CEBUANO.mp4
```

---

## File Structure

### Required Files

```
demo-recordings/
└── 06-sales-workflow/
    ├── pos-video-silent.mp4              # Silent video (no audio)
    ├── pos-transaction-script.json        # English narration script
    ├── pos-transaction-script-cebuano.json # Cebuano narration script
    └── [generated files]
```

### Generated Files

After running the language switcher:

```
demo-recordings/
└── 06-sales-workflow/
    ├── POS-DEMO-CEBUANO.mp4                    # Final Cebuano video
    ├── pos-video-silent-audio-ceb.mp3          # Generated Cebuano audio
    ├── pos-video-silent-subtitles-ceb.srt      # Generated Cebuano subtitles
    └── pos-video-silent-with-audio-ceb.mp4     # Video with audio (no subs)
```

### Narration Script Format

JSON file with narration cues:

```json
{
  "videoTitle": "Title in Target Language",
  "totalDuration": 118000,
  "cues": [
    {
      "timestamp": 0,
      "text": "Narration text in target language",
      "duration": 5000,
      "action": "Optional action description"
    },
    {
      "timestamp": 5000,
      "text": "Next narration segment",
      "duration": 4000
    }
  ]
}
```

**Fields:**
- `timestamp` - When narration starts (milliseconds from video start)
- `text` - Narration text in target language
- `duration` - How long to display (milliseconds)
- `action` - Optional description of on-screen action

---

## Adding New Languages

### Step 1: Check Google TTS Voice Availability

Visit [Google Cloud TTS Voice List](https://cloud.google.com/text-to-speech/docs/voices) to find available voices.

### Step 2: Add Language Configuration

Edit `scripts/post-production/tts-languages.ts`:

```typescript
export const TTS_LANGUAGES: Record<string, TTSLanguageConfig> = {
  // ... existing languages
  es: {
    code: 'es',
    name: 'Spanish',
    voiceName: 'es-US-Neural2-A',      // Google TTS voice name
    ssmlGender: 'FEMALE',               // MALE, FEMALE, or NEUTRAL
    languageCode: 'es-US',              // Google TTS language code
  },
};
```

### Step 3: Create Translated Script

Create a new JSON file with translated narration:

```bash
demo-recordings/06-sales-workflow/pos-transaction-script-spanish.json
```

Copy the structure from an existing script and translate the `text` fields and `videoTitle`.

### Step 4: Generate Video

```bash
npx tsx scripts/post-production/generate-demo-video.ts \
  demo-recordings/06-sales-workflow/pos-video-silent.mp4 \
  demo-recordings/06-sales-workflow/pos-transaction-script-spanish.json \
  es \
  POS-DEMO-SPANISH.mp4
```

---

## Troubleshooting

### Issue: "GOOGLE_APPLICATION_CREDENTIALS not set"

**Solution**:
- Set up Google Cloud credentials (see Prerequisites)
- Or accept silent audio placeholders for testing

### Issue: "Script file not found"

**Solution**:
- Verify the script path is correct
- Use absolute paths or paths relative to project root
- Check file extension is `.json`

### Issue: "FFmpeg error" during video processing

**Solution**:
- FFmpeg is installed automatically via `@ffmpeg-installer/ffmpeg`
- Check video file is not corrupted
- Ensure video file is in MP4 format

### Issue: Audio/subtitle timing is off

**Solution**:
- Verify `timestamp` and `duration` values in script
- Timestamps should be in milliseconds
- Ensure timestamps are in ascending order
- Check that `totalDuration` matches actual video length

### Issue: Subtitles not appearing

**Solution**:
- Check subtitle file (.srt) was generated
- Verify subtitle path in FFmpeg command
- Ensure subtitle text is not empty in script

---

## Examples

### Example 1: English Demo Video

```bash
npx tsx scripts/post-production/generate-demo-video.ts \
  demo-recordings/01-authentication/login-recording.mp4 \
  demo-recordings/01-authentication/login-script.json \
  en \
  LOGIN-DEMO-ENGLISH.mp4
```

### Example 2: Cebuano POS Demo

```bash
npx tsx scripts/post-production/generate-demo-video.ts \
  demo-recordings/06-sales-workflow/pos-video-silent.mp4 \
  demo-recordings/06-sales-workflow/pos-transaction-script-cebuano.json \
  ceb \
  POS-DEMO-CEBUANO.mp4
```

### Example 3: Just Generate TTS Audio

```bash
npx tsx scripts/post-production/generate-tts.ts \
  demo-recordings/06-sales-workflow/pos-transaction-script-cebuano.json \
  demo-recordings/06-sales-workflow/pos-audio-cebuano.mp3 \
  ceb
```

### Example 4: Extract Silent Video from Complete Demo

```bash
npx tsx scripts/post-production/extract-silent-video.ts \
  demo-recordings/06-sales-workflow/POS-DEMO-COMPLETE.mp4 \
  demo-recordings/06-sales-workflow/pos-video-silent.mp4
```

---

## Script Files Reference

### Available Scripts

| Script | Purpose |
|--------|---------|
| `generate-demo-video.ts` | All-in-one video generator |
| `generate-tts.ts` | TTS audio generation only |
| `extract-silent-video.ts` | Remove audio from video |
| `tts-languages.ts` | Language configuration |

### Script Locations

```
scripts/post-production/
├── generate-demo-video.ts      # Main video generator
├── generate-tts.ts              # TTS audio generator
├── extract-silent-video.ts      # Silent video extractor
└── tts-languages.ts             # Language configurations
```

---

## Advanced Configuration

### Customize TTS Voice Parameters

Edit `scripts/post-production/generate-tts.ts`:

```typescript
audioConfig: {
  audioEncoding: 'MP3' as const,
  speakingRate: 0.95,    // 0.25 to 4.0 (default: 1.0)
  pitch: 0,              // -20.0 to 20.0 (default: 0)
  volumeGainDb: 0,       // -96.0 to 16.0 (default: 0)
}
```

### Customize Subtitle Styling

Edit `scripts/post-production/generate-demo-video.ts`, modify the `burnSubtitles` function:

```typescript
'-vf', `subtitles='${escapedSubtitlePath}':force_style='FontName=Arial,FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3,Outline=2,Shadow=0,MarginV=20'`
```

**Style Parameters:**
- `FontName` - Font family (e.g., Arial, Verdana)
- `FontSize` - Font size in points
- `PrimaryColour` - Text color in &HBBGGRR format
- `OutlineColour` - Outline color
- `Outline` - Outline thickness
- `MarginV` - Vertical margin from bottom

---

## Production Workflow

### 1. Record Demo Video

```bash
npm run demo:record:pos
```

### 2. Extract Silent Video

```bash
npx tsx scripts/post-production/extract-silent-video.ts \
  demo-recordings/06-sales-workflow/recording-output.mp4 \
  demo-recordings/06-sales-workflow/pos-video-silent.mp4
```

### 3. Create Language-Specific Scripts

Create JSON files for each language:
- `pos-transaction-script.json` (English)
- `pos-transaction-script-cebuano.json` (Cebuano)
- `pos-transaction-script-filipino.json` (Filipino)

### 4. Generate All Language Versions

```bash
# English
npx tsx scripts/post-production/generate-demo-video.ts \
  demo-recordings/06-sales-workflow/pos-video-silent.mp4 \
  demo-recordings/06-sales-workflow/pos-transaction-script.json \
  en \
  POS-DEMO-ENGLISH.mp4

# Cebuano
npx tsx scripts/post-production/generate-demo-video.ts \
  demo-recordings/06-sales-workflow/pos-video-silent.mp4 \
  demo-recordings/06-sales-workflow/pos-transaction-script-cebuano.json \
  ceb \
  POS-DEMO-CEBUANO.mp4

# Filipino
npx tsx scripts/post-production/generate-demo-video.ts \
  demo-recordings/06-sales-workflow/pos-video-silent.mp4 \
  demo-recordings/06-sales-workflow/pos-transaction-script-filipino.json \
  fil \
  POS-DEMO-FILIPINO.mp4
```

---

## Tips & Best Practices

1. **Translation Quality**: Use professional translators for accurate narration
2. **Voice Selection**: Choose gender and tone appropriate for your target audience
3. **Timing**: Keep narration segments between 3-10 seconds for readability
4. **Testing**: Generate test videos before creating all language versions
5. **File Organization**: Use language codes in filenames for easy identification
6. **Backup**: Keep silent video files for regenerating with updated scripts
7. **Script Versioning**: Version control your narration scripts with git
8. **Audio Quality**: Use Google's Neural2 voices for better quality (when available)

---

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review Google Cloud TTS documentation: https://cloud.google.com/text-to-speech/docs
- Check FFmpeg documentation: https://ffmpeg.org/documentation.html

---

## License

This system is part of the InventoryPro project.

**Last Updated**: December 2, 2025
