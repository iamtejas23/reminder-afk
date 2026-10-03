import { Platform } from 'react-native';

import {
  ROSTER_NOTIFICATION_PREFIX,
  ROSTER_NOTIFICATION_SOURCE,
} from '@/constants/roster';
import { shiftDateTimeMs } from '@/lib/roster-dates';
import { eachShiftOccurrenceDateKeys } from '@/lib/roster-weekdays';
import { eachDateKeyInRange } from '@/lib/roster-shift-dates';
import { resolveShiftEmoji } from '@/lib/shift-style';
import { getExpoNotificationsModule, supportsNativeExpoNotifications } from '@/lib/expo-notifications-client';
import { requestAfkNotificationPermissionsAsync } from '@/lib/afk-notifications';
import type { RosterShift } from '@/types/roster';

const ROSTER_CHANNEL_ID = 'roster-shift-reminders';
const WEEK_OFF_TITLE = 'No clocking in today 😌';
const WEEK_OFF_BODY = 'It’s your day off. Take it slow and enjoy your day!';

async function ensureRosterChannelAsync() {
  const Notifications = getExpoNotificationsModule();
  if (!Notifications || Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(ROSTER_CHANNEL_ID, {
    name: 'Shift roster',
    description: 'Shift-start and rostered day-off reminders',
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
  const activeShifts = shifts.filter((shift) => shift.enabled);
  const workingDates = new Set(
    activeShifts.flatMap((shift) => eachShiftOccurrenceDateKeys(shift))
  );

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

  // Week-off reminders are based on dates covered by the roster. A day only
  // counts as a week off when no enabled shift is scheduled for that date.
  if (activeShifts.length > 0) {
    const firstDate = activeShifts.map((shift) => shift.date).sort()[0];
    const endDates = activeShifts.map((shift) => shift.endDate).sort();
    const lastDate = endDates[endDates.length - 1];
    if (firstDate && lastDate) {
      for (const dateKey of eachDateKeyInRange(firstDate, lastDate)) {
        if (workingDates.has(dateKey)) {
          continue;
        }

        const triggerMs = shiftDateTimeMs(dateKey, '09:00');
        if (triggerMs === null || triggerMs <= now) {
          continue;
        }

        await Notifications.scheduleNotificationAsync({
          identifier: `${ROSTER_NOTIFICATION_PREFIX}week-off-${dateKey}`,
          content: {
            title: WEEK_OFF_TITLE,
            body: WEEK_OFF_BODY,
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
            data: { source: ROSTER_NOTIFICATION_SOURCE, type: 'week-off', date: dateKey },
            ...(Platform.OS === 'android' ? { channelId: ROSTER_CHANNEL_ID } : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(triggerMs),
          },
        });
      }
    }
  }

  return 'scheduled';
}
