import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath.path);

const inputVideo = process.argv[2];
const outputVideo = process.argv[3];

if (!inputVideo || !outputVideo) {
  console.error('Usage: tsx extract-silent-video.ts <input.mp4> <output.mp4>');
  process.exit(1);
}

console.log(`🎬 Extracting silent video from: ${inputVideo}`);

ffmpeg(inputVideo)
  .noAudio()
  .output(outputVideo)
  .on('end', () => {
    console.log(`✅ Silent video extracted to: ${outputVideo}`);
  })
  .on('error', (err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  })
  .run();
