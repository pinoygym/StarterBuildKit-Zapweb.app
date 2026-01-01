import 'dotenv/config';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { getLanguageConfig, TTSLanguageConfig } from './tts-languages';

interface NarrationCue {
  timestamp: number;
  text: string;
  duration: number;
  action?: string;
}

interface NarrationScript {
  videoTitle: string;
  totalDuration: number;
  cues: NarrationCue[];
}

export async function generateTTS(
  scriptPath: string,
  outputPath: string,
  languageCode: string = 'en'
) {
  console.log('\n🎙️ Generating Text-to-Speech audio...\n');

  // Get language configuration
  const langConfig = getLanguageConfig(languageCode);
  console.log(`🌐 Language: ${langConfig.name} (${langConfig.code})`);
  console.log(`🎤 Voice: ${langConfig.voiceName}\n`);

  // Check if Google Cloud credentials are set
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn('⚠️  GOOGLE_APPLICATION_CREDENTIALS not set.');
    console.warn('📝 Using fallback: Creating silent audio placeholder\n');
    return createSilentAudioPlaceholder(scriptPath, outputPath);
  }

  try {
    // Initialize Google Cloud TTS client
    const client = new TextToSpeechClient();

    // Read narration script
    if (!existsSync(scriptPath)) {
      throw new Error(`Script file not found: ${scriptPath}`);
    }

    const scriptContent = readFileSync(scriptPath, 'utf-8');
    const script: NarrationScript = JSON.parse(scriptContent);

    console.log(`📄 Script: ${script.videoTitle}`);
    console.log(`🎬 Total duration: ${(script.totalDuration / 1000).toFixed(1)}s`);
    console.log(`📝 Narration cues: ${script.cues.length}\n`);

    // Generate audio for each cue
    const audioSegments: Buffer[] = [];
    let totalGenerated = 0;

    for (const cue of script.cues) {
      console.log(`⏱️  [${formatTimestamp(cue.timestamp)}] Generating: "${cue.text.substring(0, 50)}..."`);

      // Prepare TTS request with selected language
      const request = {
        input: { text: cue.text },
        voice: {
          languageCode: langConfig.languageCode,
          name: langConfig.voiceName,
          ssmlGender: langConfig.ssmlGender as any,
        },
        audioConfig: {
          audioEncoding: 'MP3' as any,
          speakingRate: 0.95, // Slightly slower for clarity
          pitch: 0,
          volumeGainDb: 0,
        },
      };

      // Generate audio
      const [response] = await client.synthesizeSpeech(request);

      if (response.audioContent) {
        audioSegments.push(Buffer.from(response.audioContent));
        totalGenerated++;
        console.log(`✅ Generated segment ${totalGenerated}/${script.cues.length}`);
      }
    }

    // Save all audio segments and merge them with FFmpeg
    if (audioSegments.length > 0) {
      const tempDir = join(dirname(outputPath), '.temp-audio');
      const { mkdirSync, existsSync } = await import('fs');

      // Create temp directory for individual segments
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }

      // Save individual segments
      const segmentPaths: string[] = [];
      for (let i = 0; i < audioSegments.length; i++) {
        const segmentPath = join(tempDir, `segment-${String(i).padStart(3, '0')}.mp3`);
        writeFileSync(segmentPath, audioSegments[i]);
        segmentPaths.push(segmentPath);
      }

      // Create concat file for FFmpeg
      const concatListPath = join(tempDir, 'concat-list.txt');
      let concatContent = '';

      for (let i = 0; i < script.cues.length; i++) {
        const cue = script.cues[i];
        const nextCue = script.cues[i + 1];

        // Add audio segment
        concatContent += `file '${segmentPaths[i].replace(/\\/g, '/')}'\n`;

        // Add silence between segments based on timestamp difference
        if (nextCue) {
          const silenceDuration = (nextCue.timestamp - cue.timestamp - cue.duration) / 1000;
          if (silenceDuration > 0.1) {
            concatContent += `file 'anullsrc=d=${silenceDuration}'\n`;
          }
        }
      }

      writeFileSync(concatListPath, concatContent);

      // Merge all segments using FFmpeg
      console.log(`\n🔗 Merging ${audioSegments.length} audio segments...`);

      const ffmpeg = await import('fluent-ffmpeg');
      const ffmpegPath = await import('@ffmpeg-installer/ffmpeg');
      ffmpeg.default.setFfmpegPath(ffmpegPath.default.path);

      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg.default();

        // Add all audio segments as inputs
        segmentPaths.forEach(path => {
          command.input(path);
        });

        // Concatenate with filter
        const filterString = segmentPaths.map((_, i) => `[${i}:a]`).join('') +
          `concat=n=${segmentPaths.length}:v=0:a=1[out]`;

        command
          .complexFilter(filterString)
          .outputOptions(['-map', '[out]'])
          .output(outputPath)
          .on('end', () => {
            console.log(`✅ TTS audio saved to: ${outputPath}`);
            console.log(`📊 Merged ${audioSegments.length} audio segments\n`);

            // Clean up temp files
            const { rmSync } = require('fs');
            rmSync(tempDir, { recursive: true, force: true });

            resolve();
          })
          .on('error', (err) => {
            console.error('❌ Error merging audio:', err);
            reject(err);
          })
          .run();
      });
    }

    return outputPath;
  } catch (error: any) {
    console.error('❌ Error generating TTS:', error.message);
    console.warn('📝 Creating silent audio placeholder instead\n');
    return createSilentAudioPlaceholder(scriptPath, outputPath);
  }
}

function createSilentAudioPlaceholder(scriptPath: string, outputPath: string): string {
  console.log('🔇 Creating silent audio placeholder...');

  const scriptContent = readFileSync(scriptPath, 'utf-8');
  const script: NarrationScript = JSON.parse(scriptContent);

  // Create a simple text file with narration info
  const placeholderPath = outputPath.replace('.mp3', '.txt');
  const placeholderContent = `
AUDIO PLACEHOLDER
=================

Video: ${script.videoTitle}
Duration: ${(script.totalDuration / 1000).toFixed(1)}s
Cues: ${script.cues.length}

Narration Script:
${script.cues.map((cue, i) => `
[${formatTimestamp(cue.timestamp)}] Cue ${i + 1}
${cue.text}
`).join('\n')}

To generate actual audio:
1. Set up Google Cloud Text-to-Speech credentials
2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable
3. Run: npm run demo:generate-tts
`;

  writeFileSync(placeholderPath, placeholderContent);
  console.log(`✅ Placeholder saved to: ${placeholderPath}\n`);

  return placeholderPath;
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Run if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: tsx generate-tts.ts <script.json> <output.mp3> [language]');
    console.error('Example: tsx generate-tts.ts demo-recordings/01-authentication/login-script.json demo-recordings/01-authentication/login-audio.mp3 en');
    console.error('Languages: en (English), ceb (Cebuano), fil (Filipino)');
    process.exit(1);
  }

  const [scriptPath, outputPath, languageCode = 'en'] = args;

  generateTTS(scriptPath, outputPath, languageCode)
    .then(() => {
      console.log('✅ TTS generation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ TTS generation failed:', error);
      process.exit(1);
    });
}
