import * as Speech from 'expo-speech';

type AvailableVoice = Awaited<ReturnType<typeof Speech.getAvailableVoicesAsync>>[number];

const BASE_SPEECH_OPTIONS: NonNullable<Parameters<typeof Speech.speak>[1]> = {
  language: 'en-US',
  pitch: 0.78,
  rate: 0.86,
};

let cachedVoiceId: string | undefined;
let voiceLookupPromise: Promise<string | undefined> | null = null;

function scoreVoice(voice: AvailableVoice) {
  let score = 0;
  const normalizedName = voice.name.toLowerCase();

  if (voice.language === 'en-US') {
    score += 4;
  } else if (voice.language.startsWith('en')) {
    score += 2;
  }

  if (normalizedName.includes('compact') || normalizedName.includes('default')) {
    score += 2;
  }

  if (normalizedName.includes('google') || normalizedName.includes('siri')) {
    score += 1;
  }

  if (normalizedName.includes('enhanced')) {
    score -= 1;
  }

  return score;
}

async function resolveVoiceId(): Promise<string | undefined> {
  if (cachedVoiceId !== undefined) {
    return cachedVoiceId;
  }

  if (!voiceLookupPromise) {
    voiceLookupPromise = Speech.getAvailableVoicesAsync()
      .then((voices) => {
        const sortedVoices = [...voices].sort((leftVoice, rightVoice) => {
          return scoreVoice(rightVoice) - scoreVoice(leftVoice);
        });

        cachedVoiceId = sortedVoices[0]?.identifier;
        return cachedVoiceId;
      })
      .catch(() => undefined)
      .finally(() => {
        voiceLookupPromise = null;
      });
  }

  return voiceLookupPromise;
}

export async function speakReminder(text: string): Promise<void> {
  const voiceId = await resolveVoiceId();

  await Speech.stop().catch(() => undefined);
  Speech.speak(text, {
    ...BASE_SPEECH_OPTIONS,
    ...(voiceId ? { voice: voiceId } : {}),
  });
}

export async function stopReminderSpeech(): Promise<void> {
  await Speech.stop().catch(() => undefined);
}
