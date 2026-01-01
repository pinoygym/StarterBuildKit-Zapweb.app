import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

export interface BurnSubtitlesOptions {
  videoPath: string;
  subtitlesPath: string;
  outputPath: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  position?: 'bottom' | 'top';
}

export async function burnSubtitles(options: BurnSubtitlesOptions): Promise<string> {
  const {
    videoPath,
    subtitlesPath,
    outputPath,
    fontSize = 24,
    fontColor = 'white',
    backgroundColor = 'black@0.5',
    position = 'bottom',
  } = options;

  console.log('\n🔥 Burning subtitles into video...\n');

  // Validate inputs
  if (!existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  if (!existsSync(subtitlesPath)) {
    throw new Error(`Subtitles file not found: ${subtitlesPath}`);
  }

  console.log(`📹 Video: ${videoPath}`);
  console.log(`📝 Subtitles: ${subtitlesPath}`);
  console.log(`💾 Output: ${outputPath}\n`);

  return new Promise((resolve, reject) => {
    // Calculate vertical position
    const yPosition = position === 'bottom' ? 'h-th-50' : '50';

    // Subtitle filter with styling
    const subtitleFilter = `subtitles=${subtitlesPath.replace(/\\/g, '/')}:force_style='FontSize=${fontSize},PrimaryColour=&H${colorToHex(fontColor)},BackColour=&H${colorToHex(backgroundColor)},Alignment=2,MarginV=50'`;

    ffmpeg(videoPath)
      .outputOptions([
        '-vf', subtitleFilter,
        '-c:v', 'libx264', // H.264 codec for MP4
        '-crf', '23', // Quality (lower = better, 18-28 recommended)
        '-preset', 'medium', // Encoding speed
        '-c:a', 'aac', // Audio codec
        '-b:a', '128k', // Audio bitrate
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('🎬 Starting ffmpeg...');
        console.log(`Command: ${commandLine}\n`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`\r⏳ Progress: ${progress.percent.toFixed(1)}% | Time: ${progress.timemark}`);
        }
      })
      .on('end', () => {
        console.log('\n\n✅ Subtitles burned successfully!');
        console.log(`📦 Output file: ${outputPath}\n`);
        resolve(outputPath);
      })
      .on('error', (err, stdout, stderr) => {
        console.error('\n❌ Error burning subtitles:');
        console.error(err.message);
        if (stderr) {
          console.error('\nffmpeg stderr:');
          console.error(stderr);
        }
        reject(err);
      })
      .run();
  });
}

function colorToHex(color: string): string {
  // Simple color conversion (expand as needed)
  const colors: Record<string, string> = {
    'white': 'FFFFFF',
    'black': '000000',
    'black@0.5': '80000000', // With alpha
    'yellow': 'FFFF00',
    'red': 'FF0000',
    'blue': '0000FF',
  };

  return colors[color] || 'FFFFFF';
}

// Run if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error('Usage: tsx burn-subtitles.ts <video.webm> <subtitles.srt> <output.mp4>');
    console.error('Example: tsx burn-subtitles.ts demo-recordings/.../video.webm demo-recordings/01-authentication/login-subtitles.srt demo-recordings/01-authentication/login-final.mp4');
    process.exit(1);
  }

  const [videoPath, subtitlesPath, outputPath] = args;

  burnSubtitles({
    videoPath,
    subtitlesPath,
    outputPath,
  })
    .then(() => {
      console.log('✅ Subtitle burning completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Subtitle burning failed:', error);
      process.exit(1);
    });
}
