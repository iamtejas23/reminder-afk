import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import {
  ANDROID_NOTIFICATION_CHANNELS,
  MS_PER_MINUTE,
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
};

function isReminderStageKey(value: unknown): value is ReminderStageKey {
  return value === 'almost' || value === 'final' || value === 'complete';
}

export async function ensureNotificationChannelsAsync(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNELS.vibrate, {
    name: 'AFK reminders',
    description: 'Reminder alerts with vibration',
    importance: Notifications.AndroidImportance.HIGH,
    enableLights: true,
    enableVibrate: true,
    lightColor: '#E46E42',
    showBadge: false,
    vibrationPattern: [0, 250, 160, 250],
  });

  await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNELS.quiet, {
    name: 'AFK reminders (quiet)',
    description: 'Reminder alerts without vibration',
    importance: Notifications.AndroidImportance.HIGH,
    enableLights: true,
    enableVibrate: false,
    lightColor: '#E46E42',
    showBadge: false,
    vibrationPattern: [0],
  });
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
}: ScheduleReminderNotificationsArgs): Promise<string[]> {
  if (Platform.OS === 'web') {
    return [];
  }

  const channelId =
    Platform.OS === 'android'
      ? vibrationEnabled
        ? ANDROID_NOTIFICATION_CHANNELS.vibrate
        : ANDROID_NOTIFICATION_CHANNELS.quiet
      : undefined;

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

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: stage.title,
        body: stage.message,
        sound: 'default',
        data: {
          message: stage.message,
          sessionId,
          source: REMINDER_SOURCE,
          stageKey: stage.key,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId,
      },
    });

    scheduledIds.push(identifier);
  }

  return scheduledIds;
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
