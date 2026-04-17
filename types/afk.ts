export type AfkTimerStatus = 'idle' | 'running' | 'paused' | 'complete';
export type ReminderStageKey = 'almost' | 'final' | 'complete';
export type NotificationPermissionState = 'unknown' | 'granted' | 'denied' | 'unsupported';

export type ReminderStage = {
  key: ReminderStageKey;
  progress: number;
  title: string;
  message: string;
};

export type AfkPreferences = {
  durationMinutes: number;
  sessionCount: number;
  voiceEnabled: boolean;
  vibrationEnabled: boolean;
};

export type AfkSession = {
  durationMinutes: number;
  elapsedBeforePauseMs: number;
  scheduledNotificationIds: string[];
  sessionId: string | null;
  startedAt: number | null;
  status: Extract<AfkTimerStatus, 'running' | 'paused' | 'complete'>;
};

export type ReminderNotificationData = {
  message: string;
  sessionId: string;
  source: string;
  stageKey: ReminderStageKey;
};

export type AfkTimerState = AfkPreferences & {
  elapsedBeforePauseMs: number;
  errorMessage: string | null;
  isReady: boolean;
  permissionState: NotificationPermissionState;
  scheduledNotificationIds: string[];
  sessionId: string | null;
  startedAt: number | null;
  status: AfkTimerStatus;
};
