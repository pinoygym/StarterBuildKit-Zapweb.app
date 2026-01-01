import { TextToSpeechClient } from '@google-cloud/text-to-speech';

async function testTTS() {
  console.log('\n🧪 Testing Google Cloud Text-to-Speech...\n');

  // Check if credentials are set
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS not set!');
    console.log('\nPlease set the environment variable:');
    console.log('  Windows: setx GOOGLE_APPLICATION_CREDENTIALS "C:\\path\\to\\credentials.json"');
    console.log('  Or add to .env file: GOOGLE_APPLICATION_CREDENTIALS=./credentials.json\n');
    process.exit(1);
  }

  console.log(`✅ Credentials file: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}\n`);

  try {
    // Initialize client
    const client = new TextToSpeechClient();
    console.log('🔗 Connecting to Google Cloud...');

    // Test request
    const request = {
      input: { text: 'Hello! This is a test of the text to speech API.' },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-J',
        ssmlGender: 'MALE' as const,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
      },
    };

    console.log('🎙️  Generating test audio...\n');

    const [response] = await client.synthesizeSpeech(request);

    if (response.audioContent) {
      const audioSize = Buffer.from(response.audioContent).length;
      console.log('✅ SUCCESS! Text-to-Speech is working!');
      console.log(`📊 Generated audio: ${(audioSize / 1024).toFixed(2)} KB\n`);
      console.log('🎉 You can now use: npm run demo:generate-tts\n');
    } else {
      console.error('❌ No audio content received\n');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Error testing TTS:');
    console.error(error.message);

    if (error.message.includes('credentials')) {
      console.log('\n💡 Credential issues detected. Please check:');
      console.log('1. The JSON file exists at the specified path');
      console.log('2. The file contains valid credentials');
      console.log('3. The Text-to-Speech API is enabled in your project\n');
    }

    process.exit(1);
  }
}

testTTS();
