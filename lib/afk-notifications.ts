import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import {
  ANDROID_NOTIFICATION_CHANNELS,
  MS_PER_MINUTE,
  REMINDER_SOUND_FILES,
  REMINDER_SOURCE,
  REMINDER_STAGES,
} from '@/constants/afk';
import type {
  NotificationPermissionState,
  ReminderNotificationData,
  ReminderStageKey,
} from '@/types/afk';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type ScheduleReminderNotificationsArgs = {
  durationMinutes: number;
  elapsedMs: number;
  sessionId: string;
  vibrationEnabled: boolean;
  voiceEnabled: boolean;
};

type TestReminderNotificationArgs = {
  stageKey?: ReminderStageKey;
  vibrationEnabled: boolean;
};

function isReminderStageKey(value: unknown): value is ReminderStageKey {
  return value === 'almost' || value === 'final' || value === 'complete';
}

function getReminderStage(stageKey: ReminderStageKey) {
  return REMINDER_STAGES.find((stage) => stage.key === stageKey) ?? REMINDER_STAGES[0];
}

function getSilentChannelId(vibrationEnabled: boolean) {
  return vibrationEnabled
    ? ANDROID_NOTIFICATION_CHANNELS.silentVibrate
    : ANDROID_NOTIFICATION_CHANNELS.silentQuiet;
}

function getVoiceChannelId(stageKey: ReminderStageKey, vibrationEnabled: boolean) {
  const prefix = vibrationEnabled
    ? ANDROID_NOTIFICATION_CHANNELS.voiceVibratePrefix
    : ANDROID_NOTIFICATION_CHANNELS.voiceQuietPrefix;

  return `${prefix}-${stageKey}`;
}

function getAndroidChannelId(
  stageKey: ReminderStageKey,
  options: Pick<ScheduleReminderNotificationsArgs, 'vibrationEnabled' | 'voiceEnabled'>
) {
  return options.voiceEnabled
    ? getVoiceChannelId(stageKey, options.vibrationEnabled)
    : getSilentChannelId(options.vibrationEnabled);
}

function getVibrationPattern(vibrationEnabled: boolean) {
  return vibrationEnabled ? [0, 250, 160, 250] : [0];
}

function createReminderContent(sessionId: string, stageKey: ReminderStageKey, voiceEnabled: boolean) {
  const stage = getReminderStage(stageKey);

  return {
    title: stage.title,
    body: stage.message,
    sound: voiceEnabled ? REMINDER_SOUND_FILES[stage.key] : false,
    priority: Notifications.AndroidNotificationPriority.MAX,
    data: {
      message: stage.message,
      sessionId,
      source: REMINDER_SOURCE,
      stageKey: stage.key,
    },
  } satisfies Notifications.NotificationContentInput;
}

export async function ensureNotificationChannelsAsync(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Promise.all([
    Notifications.setNotificationChannelAsync(getSilentChannelId(true), {
      name: 'AFK reminders',
      description: 'Reminder alerts without spoken audio, with vibration',
      importance: Notifications.AndroidImportance.HIGH,
      enableLights: true,
      enableVibrate: true,
      lightColor: '#E46E42',
      showBadge: false,
      sound: null,
      vibrationPattern: getVibrationPattern(true),
    }),
    Notifications.setNotificationChannelAsync(getSilentChannelId(false), {
      name: 'AFK reminders (quiet)',
      description: 'Reminder alerts without spoken audio or vibration',
      importance: Notifications.AndroidImportance.HIGH,
      enableLights: true,
      enableVibrate: false,
      lightColor: '#E46E42',
      showBadge: false,
      sound: null,
      vibrationPattern: getVibrationPattern(false),
    }),
    ...REMINDER_STAGES.flatMap((stage) =>
      [true, false].map((vibrationEnabled) =>
        Notifications.setNotificationChannelAsync(getVoiceChannelId(stage.key, vibrationEnabled), {
          name: vibrationEnabled ? `${stage.title} voice` : `${stage.title} voice (quiet)`,
          description: vibrationEnabled
            ? 'Spoken AFK reminder with vibration'
            : 'Spoken AFK reminder without vibration',
          importance: Notifications.AndroidImportance.HIGH,
          enableLights: true,
          enableVibrate: vibrationEnabled,
          lightColor: '#E46E42',
          showBadge: false,
          sound: REMINDER_SOUND_FILES[stage.key],
          audioAttributes: {
            contentType: Notifications.AndroidAudioContentType.SPEECH,
            usage: Notifications.AndroidAudioUsage.NOTIFICATION,
          },
          vibrationPattern: getVibrationPattern(vibrationEnabled),
        })
      )
    ),
  ]);
}

export async function requestAfkNotificationPermissionsAsync(): Promise<NotificationPermissionState> {
  if (Platform.OS === 'web') {
    return 'unsupported';
  }

  await ensureNotificationChannelsAsync();

  const currentPermissions = await Notifications.getPermissionsAsync();
  if (currentPermissions.granted) {
    return 'granted';
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  return requestedPermissions.granted ? 'granted' : 'denied';
}

export async function scheduleReminderNotifications({
  durationMinutes,
  elapsedMs,
  sessionId,
  vibrationEnabled,
  voiceEnabled,
}: ScheduleReminderNotificationsArgs): Promise<string[]> {
  if (Platform.OS === 'web') {
    return [];
  }

  const totalDurationMs = durationMinutes * MS_PER_MINUTE;
  const scheduledIds: string[] = [];
  const now = Date.now();

  for (const stage of REMINDER_STAGES) {
    const msUntilReminder = totalDurationMs * stage.progress - elapsedMs;
    if (msUntilReminder <= 0) {
      continue;
    }

    const identifier = `afk-${sessionId}-${stage.key}`;
    const triggerDate = new Date(now + Math.max(1_000, msUntilReminder));
    const channelId =
      Platform.OS === 'android'
        ? getAndroidChannelId(stage.key, {
            vibrationEnabled,
            voiceEnabled,
          })
        : undefined;

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: createReminderContent(sessionId, stage.key, voiceEnabled),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        ...(channelId ? { channelId } : {}),
      },
    });

    scheduledIds.push(identifier);
  }

  return scheduledIds;
}

export async function scheduleTestReminderNotification({
  stageKey = 'almost',
  vibrationEnabled,
}: TestReminderNotificationArgs): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  await ensureNotificationChannelsAsync();

  const identifier = `afk-test-${Date.now()}`;
  const sessionId = `voice-test-${Date.now()}`;
  const channelId =
    Platform.OS === 'android'
      ? getAndroidChannelId(stageKey, {
          vibrationEnabled,
          voiceEnabled: true,
        })
      : undefined;

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: createReminderContent(sessionId, stageKey, true),
    trigger: channelId ? { channelId } : null,
  });

  return identifier;
}

export async function cancelReminderNotifications(notificationIds: string[]): Promise<void> {
  await Promise.all(
    notificationIds.map((notificationId) =>
      Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => undefined)
    )
  );
}

export function getReminderNotificationData(
  notification: Notifications.Notification
): ReminderNotificationData | null {
  const data = notification.request.content.data;

  if (
    typeof data?.message !== 'string' ||
    typeof data?.sessionId !== 'string' ||
    typeof data?.source !== 'string' ||
    !isReminderStageKey(data?.stageKey)
  ) {
    return null;
  }

  return {
    message: data.message,
    sessionId: data.sessionId,
    source: data.source,
    stageKey: data.stageKey,
  };
}
