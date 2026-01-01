export interface TTSLanguageConfig {
  code: string;
  name: string;
  voiceName: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  languageCode: string;
}

export const TTS_LANGUAGES: Record<string, TTSLanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    voiceName: 'en-US-Neural2-J',
    ssmlGender: 'MALE',
    languageCode: 'en-US',
  },
  ceb: {
    code: 'ceb',
    name: 'Cebuano',
    voiceName: 'fil-PH-Standard-A', // Filipino voice (closest to Cebuano)
    ssmlGender: 'FEMALE',
    languageCode: 'fil-PH',
  },
  fil: {
    code: 'fil',
    name: 'Filipino/Tagalog',
    voiceName: 'fil-PH-Standard-A',
    ssmlGender: 'FEMALE',
    languageCode: 'fil-PH',
  },
};

export function getLanguageConfig(languageCode: string): TTSLanguageConfig {
  return TTS_LANGUAGES[languageCode] || TTS_LANGUAGES.en;
}

export function listAvailableLanguages(): TTSLanguageConfig[] {
  return Object.values(TTS_LANGUAGES);
}
