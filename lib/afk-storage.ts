import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_DURATION_MINUTES,
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  STORAGE_KEYS,
} from '@/constants/afk';
import type { AfkPreferences, AfkSession } from '@/types/afk';

const DEFAULT_PREFERENCES: AfkPreferences = {
  durationMinutes: DEFAULT_DURATION_MINUTES,
  sessionCount: 0,
  voiceEnabled: true,
  vibrationEnabled: true,
};

function clampDurationMinutes(durationMinutes: number) {
  return Math.min(MAX_DURATION_MINUTES, Math.max(MIN_DURATION_MINUTES, Math.round(durationMinutes)));
}

export async function loadAfkPreferences(): Promise<AfkPreferences> {
  try {
    const rawValue = await AsyncStorage.getItem(STORAGE_KEYS.preferences);
    if (!rawValue) {
      return DEFAULT_PREFERENCES;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<AfkPreferences>;

    return {
      durationMinutes: clampDurationMinutes(
        typeof parsedValue.durationMinutes === 'number'
          ? parsedValue.durationMinutes
          : DEFAULT_PREFERENCES.durationMinutes
      ),
      sessionCount:
        typeof parsedValue.sessionCount === 'number' && parsedValue.sessionCount >= 0
          ? Math.floor(parsedValue.sessionCount)
          : DEFAULT_PREFERENCES.sessionCount,
      voiceEnabled:
        typeof parsedValue.voiceEnabled === 'boolean'
          ? parsedValue.voiceEnabled
          : DEFAULT_PREFERENCES.voiceEnabled,
      vibrationEnabled:
        typeof parsedValue.vibrationEnabled === 'boolean'
          ? parsedValue.vibrationEnabled
          : DEFAULT_PREFERENCES.vibrationEnabled,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function saveAfkPreferences(preferences: AfkPreferences): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.preferences,
    JSON.stringify({
      ...preferences,
      durationMinutes: clampDurationMinutes(preferences.durationMinutes),
      sessionCount: Math.max(0, Math.floor(preferences.sessionCount)),
    })
  );
}

export async function loadAfkSession(): Promise<AfkSession | null> {
  try {
    const rawValue = await AsyncStorage.getItem(STORAGE_KEYS.session);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<AfkSession>;
    if (
      parsedValue.status !== 'running' &&
      parsedValue.status !== 'paused' &&
      parsedValue.status !== 'complete'
    ) {
      return null;
    }

    return {
      durationMinutes: clampDurationMinutes(
        typeof parsedValue.durationMinutes === 'number'
          ? parsedValue.durationMinutes
          : DEFAULT_DURATION_MINUTES
      ),
      elapsedBeforePauseMs:
        typeof parsedValue.elapsedBeforePauseMs === 'number' && parsedValue.elapsedBeforePauseMs >= 0
          ? parsedValue.elapsedBeforePauseMs
          : 0,
      scheduledNotificationIds: Array.isArray(parsedValue.scheduledNotificationIds)
        ? parsedValue.scheduledNotificationIds.filter(
            (notificationId): notificationId is string => typeof notificationId === 'string'
          )
        : [],
      sessionId: typeof parsedValue.sessionId === 'string' ? parsedValue.sessionId : null,
      startedAt: typeof parsedValue.startedAt === 'number' ? parsedValue.startedAt : null,
      status: parsedValue.status,
    };
  } catch {
    return null;
  }
}

export async function saveAfkSession(session: AfkSession): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.session,
    JSON.stringify({
      ...session,
      durationMinutes: clampDurationMinutes(session.durationMinutes),
      elapsedBeforePauseMs: Math.max(0, session.elapsedBeforePauseMs),
    })
  );
}

export async function clearAfkSession(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.session);
}
