import { formatDateKey } from '@/lib/roster-dates';
import type { RosterShift, Weekday } from '@/types/roster';

export const ROSTER_STORAGE_KEY = '@reminder-afk/roster';

export const ROSTER_NOTIFICATION_PREFIX = 'roster-';
export const ROSTER_NOTIFICATION_SOURCE = 'reminder-afk-roster';

export const SHIFT_PALETTE = ['#E46E42', '#3B8F78', '#5B7FD6', '#D48734', '#9B6BCC', '#C45C8A'] as const;

export const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export const NOTIFY_BEFORE_OPTIONS = [0, 5, 15, 30] as const;

function defaultShiftDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return [
    formatDateKey(new Date(year, month, Math.min(5, new Date(year, month + 1, 0).getDate()))),
    formatDateKey(new Date(year, month, Math.min(12, new Date(year, month + 1, 0).getDate()))),
    formatDateKey(new Date(year, month, Math.min(20, new Date(year, month + 1, 0).getDate()))),
  ];
}

export function createDefaultRosterShifts(): RosterShift[] {
  const [d1, d2, d3] = defaultShiftDates();

  return [
    {
      id: 'shift-morning',
      name: 'Morning shift',
      date: d1,
      endDate: d1,
      weekdays: [1, 2, 3, 4, 5],
      startTime: '06:00',
      endTime: '14:00',
      kind: 'morning',
      emoji: '🌅',
      notes: '',
      enabled: true,
      notifyAtStart: true,
      notifyMinutesBefore: 15,
      color: SHIFT_PALETTE[1],
    },
    {
      id: 'shift-evening',
      name: 'Evening shift',
      date: d2,
      endDate: d2,
      weekdays: [1, 2, 3, 4, 5],
      startTime: '16:00',
      endTime: '22:00',
      kind: 'evening',
      emoji: '🌇',
      notes: '',
      enabled: true,
      notifyAtStart: true,
      notifyMinutesBefore: 15,
      color: SHIFT_PALETTE[3],
    },
    {
      id: 'shift-night',
      name: 'Night shift',
      date: d3,
      endDate: d3,
      weekdays: [0, 6],
      startTime: '22:00',
      endTime: '06:00',
      kind: 'night',
      emoji: '🌙',
      notes: '',
      enabled: false,
      notifyAtStart: true,
      notifyMinutesBefore: 30,
      color: SHIFT_PALETTE[2],
    },
  ];
}
