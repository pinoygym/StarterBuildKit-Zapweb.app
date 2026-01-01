import * as EdgeTTS from 'edge-tts-node';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

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

export async function generateFreeTTS(scriptPath: string, outputPath: string) {
  console.log('\n🎙️ Generating Text-to-Speech audio (Microsoft Edge TTS - FREE)...\n');

  try {
    // Read narration script
    if (!existsSync(scriptPath)) {
      throw new Error(`Script file not found: ${scriptPath}`);
    }

    const scriptContent = readFileSync(scriptPath, 'utf-8');
    const script: NarrationScript = JSON.parse(scriptContent);

    console.log(`📄 Script: ${script.videoTitle}`);
    console.log(`🎬 Total duration: ${(script.totalDuration / 1000).toFixed(1)}s`);
    console.log(`📝 Narration cues: ${script.cues.length}\n`);

    // Available voices (high quality):
    // en-US-GuyNeural (Male - Professional)
    // en-US-AriaNeural (Female - Clear)
    // en-US-JennyNeural (Female - Friendly)
    // en-US-ChristopherNeural (Male - Deep)
    // en-US-EricNeural (Male - Young)

    const voice = 'en-US-GuyNeural'; // Professional male voice

    console.log(`🎤 Voice: ${voice}`);
    console.log('🔄 Generating audio segments...\n');

    // Combine all narration text with pauses
    let fullText = '';
    for (let i = 0; i < script.cues.length; i++) {
      const cue = script.cues[i];

      // Add the text
      fullText += cue.text;

      // Add pause between cues (except last one)
      if (i < script.cues.length - 1) {
        // Calculate pause duration based on timestamp difference
        const nextCue = script.cues[i + 1];
        const pauseMs = nextCue.timestamp - (cue.timestamp + cue.duration);

        if (pauseMs > 100) {
          // Add SSML break tag for pauses
          const pauseSeconds = Math.min(pauseMs / 1000, 3); // Max 3 second pause
          fullText += ` <break time="${pauseSeconds}s"/> `;
        } else {
          fullText += ' ';
        }
      }
    }

    console.log('📝 Full narration text prepared');
    console.log(`📊 Text length: ${fullText.length} characters\n`);

    // Generate audio
    console.log('🎙️  Synthesizing speech...');

    await (EdgeTTS as any).ttsToFile(outputPath, fullText, voice, {
      rate: '0%', // Normal speed
      pitch: '+0Hz', // Normal pitch
    });

    console.log(`\n✅ TTS audio saved to: ${outputPath}`);
    console.log(`🎉 Audio generation completed!\n`);

    return outputPath;
  } catch (error: any) {
    console.error('❌ Error generating TTS:', error.message);
    throw error;
  }
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
    console.error('Usage: tsx generate-tts-free.ts <script.json> <output.mp3>');
    console.error('Example: tsx generate-tts-free.ts demo-recordings/01-authentication/login-script.json demo-recordings/01-authentication/login-audio.mp3');
    process.exit(1);
  }

  const [scriptPath, outputPath] = args;

  generateFreeTTS(scriptPath, outputPath)
    .then(() => {
      console.log('✅ TTS generation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ TTS generation failed:', error);
      process.exit(1);
    });
}
