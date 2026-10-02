import { Platform } from 'react-native';

import {
  ROSTER_NOTIFICATION_PREFIX,
  ROSTER_NOTIFICATION_SOURCE,
} from '@/constants/roster';
import { shiftDateTimeMs } from '@/lib/roster-dates';
import { eachShiftOccurrenceDateKeys } from '@/lib/roster-weekdays';
import { resolveShiftEmoji } from '@/lib/shift-style';
import { getExpoNotificationsModule, supportsNativeExpoNotifications } from '@/lib/expo-notifications-client';
import { requestAfkNotificationPermissionsAsync } from '@/lib/afk-notifications';
import type { RosterShift } from '@/types/roster';

const ROSTER_CHANNEL_ID = 'roster-shift-reminders';

async function ensureRosterChannelAsync() {
  const Notifications = getExpoNotificationsModule();
  if (!Notifications || Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(ROSTER_CHANNEL_ID, {
    name: 'Shift roster',
    description: 'Reminders before your scheduled shifts start',
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
    vibrationPattern: [0, 220, 120, 220],
    lightColor: '#E46E42',
    showBadge: false,
  });
}

async function cancelRosterNotificationsAsync() {
  const Notifications = getExpoNotificationsModule();
  if (!Notifications) {
    return;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.identifier.startsWith(ROSTER_NOTIFICATION_PREFIX))
      .map((item) =>
        Notifications.cancelScheduledNotificationAsync(item.identifier).catch(() => undefined)
      )
  );
}

export async function syncRosterNotificationsAsync(
  shifts: RosterShift[],
  remindersEnabled: boolean
): Promise<'scheduled' | 'unsupported' | 'denied'> {
  if (!supportsNativeExpoNotifications()) {
    return 'unsupported';
  }

  const Notifications = getExpoNotificationsModule();
  if (!Notifications) {
    return 'unsupported';
  }

  await cancelRosterNotificationsAsync();

  if (!remindersEnabled) {
    return 'scheduled';
  }

  const permission = await requestAfkNotificationPermissionsAsync();
  if (permission !== 'granted') {
    return 'denied';
  }

  await ensureRosterChannelAsync();

  const now = Date.now();

  for (const shift of shifts) {
    if (!shift.enabled || !shift.notifyAtStart) {
      continue;
    }

    const occurrenceDates = eachShiftOccurrenceDateKeys(shift);
    const leadCopy =
      shift.notifyMinutesBefore === 0
        ? 'starts now'
        : `starts in ${shift.notifyMinutesBefore} min`;

    for (const occurrenceDate of occurrenceDates) {
      const triggerMs = shiftDateTimeMs(
        occurrenceDate,
        shift.startTime,
        shift.notifyMinutesBefore
      );
      if (triggerMs === null || triggerMs <= now) {
        continue;
      }

      const identifier = `${ROSTER_NOTIFICATION_PREFIX}${shift.id}-${occurrenceDate}`;
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: `${resolveShiftEmoji(shift)} ${shift.name}`,
          body: `${occurrenceDate} · ${shift.startTime} – ${shift.endTime} · ${leadCopy}`,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            shiftId: shift.id,
            source: ROSTER_NOTIFICATION_SOURCE,
          },
          ...(Platform.OS === 'android' ? { channelId: ROSTER_CHANNEL_ID } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(triggerMs),
        },
      });
    }
  }

  return 'scheduled';
}
