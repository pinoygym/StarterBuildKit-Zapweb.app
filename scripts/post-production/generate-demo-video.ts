import 'dotenv/config';
import { generateTTS } from './generate-tts';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname, basename } from 'path';

interface DemoVideoOptions {
  videoPath: string;
  scriptPath: string;
  language?: string;
  outputName?: string;
}

/**
 * Generates a complete demo video with audio and subtitles in the specified language
 */
export async function generateDemoVideo(options: DemoVideoOptions) {
  const {
    videoPath,
    scriptPath,
    language = 'en',
    outputName,
  } = options;

  console.log('\n🎬 Generating Demo Video...\n');
  console.log(`📹 Video: ${videoPath}`);
  console.log(`📝 Script: ${scriptPath}`);
  console.log(`🌐 Language: ${language}\n`);

  // Verify video exists
  if (!existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  // Verify script exists
  if (!existsSync(scriptPath)) {
    throw new Error(`Script file not found: ${scriptPath}`);
  }

  const dir = dirname(videoPath);
  const baseName = basename(videoPath, '.mp4');

  // Generate language-specific file names
  const languageSuffix = language === 'en' ? '' : `-${language}`;
  const audioPath = join(dir, `${baseName}-audio${languageSuffix}.mp3`);
  const subtitlePath = join(dir, `${baseName}-subtitles${languageSuffix}.srt`);
  const finalOutputPath = outputName
    ? join(dir, outputName)
    : join(dir, `${baseName}-final${languageSuffix}.mp4`);

  try {
    // Step 1: Generate TTS audio
    console.log('🎙️ Step 1: Generating TTS audio...\n');
    await generateTTS(scriptPath, audioPath, language);

    // Step 2: Generate subtitles
    console.log('\n📝 Step 2: Generating subtitles...\n');
    await generateSubtitles(scriptPath, subtitlePath, language);

    // Step 3: Merge audio with video
    console.log('\n🔊 Step 3: Merging audio with video...\n');
    const videoWithAudioPath = join(dir, `${baseName}-with-audio${languageSuffix}.mp4`);
    await mergeAudioWithVideo(videoPath, audioPath, videoWithAudioPath);

    // Step 4: Burn subtitles
    console.log('\n📺 Step 4: Burning subtitles into video...\n');
    await burnSubtitles(videoWithAudioPath, subtitlePath, finalOutputPath);

    console.log('\n✅ Demo video generation complete!\n');
    console.log(`📦 Output: ${finalOutputPath}\n`);

    return finalOutputPath;

  } catch (error: any) {
    console.error('❌ Error generating demo video:', error.message);
    throw error;
  }
}

async function generateSubtitles(scriptPath: string, outputPath: string, language: string) {
  const { readFileSync, writeFileSync } = await import('fs');

  const scriptContent = readFileSync(scriptPath, 'utf-8');
  const script = JSON.parse(scriptContent);

  let srtContent = '';

  script.cues.forEach((cue: any, index: number) => {
    const startTime = formatSRTTimestamp(cue.timestamp);
    const endTime = formatSRTTimestamp(cue.timestamp + cue.duration);

    srtContent += `${index + 1}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${cue.text}\n\n`;
  });

  writeFileSync(outputPath, srtContent);
  console.log(`✅ Subtitles saved to: ${outputPath}`);
}

function formatSRTTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

async function mergeAudioWithVideo(videoPath: string, audioPath: string, outputPath: string) {
  const ffmpeg = await import('fluent-ffmpeg');
  const ffmpegPath = await import('@ffmpeg-installer/ffmpeg');
  ffmpeg.default.setFfmpegPath(ffmpegPath.default.path);

  return new Promise<void>((resolve, reject) => {
    ffmpeg.default()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        '-c:v copy',           // Copy video codec (no re-encoding)
        '-c:a aac',            // Encode audio to AAC
        '-b:a 192k',           // Audio bitrate
        '-map 0:v:0',          // Map video from first input
        '-map 1:a:0',          // Map audio from second input
        '-shortest',           // Match shortest stream duration
      ])
      .output(outputPath)
      .on('end', () => {
        console.log(`✅ Audio merged successfully: ${outputPath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ Error merging audio:', err);
        reject(err);
      })
      .run();
  });
}

async function burnSubtitles(videoPath: string, subtitlePath: string, outputPath: string) {
  const ffmpeg = await import('fluent-ffmpeg');
  const ffmpegPath = await import('@ffmpeg-installer/ffmpeg');
  ffmpeg.default.setFfmpegPath(ffmpegPath.default.path);

  // Escape Windows path for FFmpeg filter
  const escapedSubtitlePath = subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:');

  return new Promise<void>((resolve, reject) => {
    ffmpeg.default()
      .input(videoPath)
      .outputOptions([
        '-vf', `subtitles='${escapedSubtitlePath}':force_style='FontName=Arial,FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3,Outline=2,Shadow=0,MarginV=20'`,
        '-c:a copy',           // Copy audio codec
      ])
      .output(outputPath)
      .on('end', () => {
        console.log(`✅ Subtitles burned successfully: ${outputPath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ Error burning subtitles:', err);
        reject(err);
      })
      .run();
  });
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: tsx generate-demo-video.ts <video.mp4> <script.json> [language] [outputName]');
    console.error('');
    console.error('Example:');
    console.error('  tsx generate-demo-video.ts demo-recordings/06-sales-workflow/pos-recording.mp4 demo-recordings/06-sales-workflow/pos-transaction-script-cebuano.json ceb pos-demo-cebuano.mp4');
    console.error('');
    console.error('Languages:');
    console.error('  en  - English (default)');
    console.error('  ceb - Cebuano');
    console.error('  fil - Filipino/Tagalog');
    process.exit(1);
  }

  const [videoPath, scriptPath, language = 'en', outputName] = args;

  generateDemoVideo({ videoPath, scriptPath, language, outputName })
    .then((outputPath) => {
      console.log('✅ Demo video generation completed successfully!');
      console.log(`📦 Output file: ${outputPath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Demo video generation failed:', error);
      process.exit(1);
    });
}
