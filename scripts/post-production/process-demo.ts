import { generateTTS } from './generate-tts';
import { burnSubtitles } from './burn-subtitles';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

interface ProcessDemoOptions {
  demoName: string; // e.g., '01-authentication'
  generateAudio?: boolean;
  burnSubs?: boolean;
}

export async function processDemo(options: ProcessDemoOptions) {
  const { demoName, generateAudio = false, burnSubs = true } = options;

  console.log('\n════════════════════════════════════════════════════════════');
  console.log(`🎬 Post-Processing Demo: ${demoName}`);
  console.log('════════════════════════════════════════════════════════════\n');

  const basePath = `demo-recordings/${demoName}`;

  // Find the video file
  const videoFile = findVideoFile(basePath);
  if (!videoFile) {
    throw new Error(`No video file found in ${basePath}`);
  }

  // Script and subtitles are in the basePath directory
  const demoShortName = demoName.split('/').pop() || demoName;

  // Map demo names to their script names
  const scriptNameMap: Record<string, string> = {
    '01-authentication': 'login',
    '02-dashboard': 'overview',
    '03-products': 'product-creation',
    '06-sales-workflow': 'pos-transaction',
  };

  const scriptBaseName = scriptNameMap[demoShortName] || demoShortName;
  const scriptFile = join(basePath, `${scriptBaseName}-script.json`);
  const subtitlesFile = join(basePath, `${scriptBaseName}-subtitles.srt`);

  console.log(`📹 Video: ${videoFile}`);
  console.log(`📝 Script: ${scriptFile}`);
  console.log(`📄 Subtitles: ${subtitlesFile}\n`);

  // Step 1: Generate TTS audio (if requested and credentials available)
  if (generateAudio) {
    const audioFile = join(basePath, `${demoName.split('/').pop()}-audio.mp3`);
    await generateTTS(scriptFile, audioFile);
  } else {
    console.log('⏭️  Skipping TTS generation (set generateAudio: true to enable)\n');
  }

  // Step 2: Burn subtitles into video
  if (burnSubs) {
    if (!existsSync(subtitlesFile)) {
      console.warn(`⚠️  Subtitles file not found: ${subtitlesFile}`);
      console.warn('Skipping subtitle burning\n');
    } else {
      const outputFile = join(basePath, `${demoName.split('/').pop()}-final.mp4`);
      await burnSubtitles({
        videoPath: videoFile,
        subtitlesPath: subtitlesFile,
        outputPath: outputFile,
        fontSize: 20,
        fontColor: 'white',
        backgroundColor: 'black@0.5',
        position: 'bottom',
      });
    }
  } else {
    console.log('⏭️  Skipping subtitle burning\n');
  }

  console.log('════════════════════════════════════════════════════════════');
  console.log('✅ Post-processing completed!');
  console.log('════════════════════════════════════════════════════════════\n');
}

function findVideoFile(basePath: string): string | null {
  try {
    // First, try to find video.webm directly in basePath
    const directVideo = join(basePath, 'video.webm');
    if (existsSync(directVideo)) {
      return directVideo;
    }

    // Look for video.webm in subdirectories
    const entries = readdirSync(basePath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const videoPath = join(basePath, entry.name, 'video.webm');
        if (existsSync(videoPath)) {
          return videoPath;
        }
      }
    }

    // Look in parent directory for folders starting with the demo name
    const parentDir = 'demo-recordings';
    const demoShortName = basePath.split('/').pop();
    const parentEntries = readdirSync(parentDir, { withFileTypes: true });

    for (const entry of parentEntries) {
      if (entry.isDirectory() && entry.name.startsWith(demoShortName || '')) {
        const videoPath = join(parentDir, entry.name, 'video.webm');
        if (existsSync(videoPath)) {
          return videoPath;
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Run if executed directly
if (require.main === module) {
  const demoName = process.argv[2] || '01-authentication';

  processDemo({
    demoName,
    generateAudio: false, // Set to true when Google Cloud credentials are available
    burnSubs: true,
  })
    .then(() => {
      console.log('✅ Demo processing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Demo processing failed:', error);
      process.exit(1);
    });
}
