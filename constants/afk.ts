import type { ReminderStage } from '@/types/afk';

export const DEFAULT_DURATION_MINUTES = 30;
export const MIN_DURATION_MINUTES = 5;
export const MAX_DURATION_MINUTES = 120;
export const DURATION_STEP_MINUTES = 5;
export const MS_PER_MINUTE = 60_000;
export const COUNTDOWN_TICK_MS = 1_000;

export const PRESET_DURATIONS = [15, 25, 30, 45] as const;

export const STORAGE_KEYS = {
  preferences: '@reminder-afk/preferences',
  session: '@reminder-afk/session',
} as const;

export const REMINDER_SOURCE = 'reminder-afk';

export const ANDROID_NOTIFICATION_CHANNELS = {
  quiet: 'afk-reminders-quiet',
  vibrate: 'afk-reminders-vibrate',
} as const;

export const REMINDER_STAGES: ReminderStage[] = [
  {
    key: 'almost',
    progress: 0.825,
    title: 'AFK reminder',
    message: 'Hey, your break is almost over',
  },
  {
    key: 'final',
    progress: 0.95,
    title: 'Final reminder',
    message: 'One minute left. Get ready',
  },
  {
    key: 'complete',
    progress: 1,
    title: 'AFK complete',
    message: 'AFK complete. Back to work!',
  },
];
