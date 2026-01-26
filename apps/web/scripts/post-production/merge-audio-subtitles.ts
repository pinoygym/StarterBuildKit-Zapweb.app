import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { existsSync } from 'fs';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

export interface MergeAudioSubtitlesOptions {
  videoPath: string;
  audioPath: string;
  subtitlesPath: string;
  outputPath: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
}

export async function mergeAudioAndSubtitles(options: MergeAudioSubtitlesOptions): Promise<string> {
  const {
    videoPath,
    audioPath,
    subtitlesPath,
    outputPath,
    fontSize = 20,
    fontColor = 'white',
    backgroundColor = 'black@0.5',
  } = options;

  console.log('\n🎬 Merging audio and burning subtitles...\n');

  // Validate inputs
  if (!existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  if (!existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }

  if (!existsSync(subtitlesPath)) {
    throw new Error(`Subtitles file not found: ${subtitlesPath}`);
  }

  console.log(`📹 Video: ${videoPath}`);
  console.log(`🎵 Audio: ${audioPath}`);
  console.log(`📝 Subtitles: ${subtitlesPath}`);
  console.log(`💾 Output: ${outputPath}\n`);

  return new Promise((resolve, reject) => {
    // Subtitle filter with styling
    const subtitleFilter = `subtitles=${subtitlesPath.replace(/\\/g, '/')}:force_style='FontSize=${fontSize},PrimaryColour=&HFFFFFF,BackColour=&H80000000,Alignment=2,MarginV=50'`;

    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        '-vf', subtitleFilter,
        '-c:v', 'libx264',
        '-crf', '23',
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest', // Use shortest input duration
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
        console.log('\n\n✅ Audio merged and subtitles burned successfully!');
        console.log(`📦 Output file: ${outputPath}\n`);
        resolve(outputPath);
      })
      .on('error', (err, stdout, stderr) => {
        console.error('\n❌ Error processing video:');
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

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.log('Usage: tsx merge-audio-subtitles.ts <video> <audio> <subtitles> <output>');
    console.log('Example: tsx merge-audio-subtitles.ts video.webm audio.mp3 subs.srt output.mp4');
    process.exit(1);
  }

  const [videoPath, audioPath, subtitlesPath, outputPath] = args;

  mergeAudioAndSubtitles({
    videoPath,
    audioPath,
    subtitlesPath,
    outputPath,
  })
    .then(() => {
      console.log('✅ Processing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Processing failed:', error);
      process.exit(1);
    });
}
