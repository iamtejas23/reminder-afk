import AsyncStorage from '@react-native-async-storage/async-storage';

import { createDefaultRosterShifts, ROSTER_STORAGE_KEY } from '@/constants/roster';
import { getShiftKindPreset } from '@/constants/shift-style';
import { formatDateKey, parseDateKey } from '@/lib/roster-dates';
import { normalizeShiftDateRange } from '@/lib/roster-shift-dates';
import { ALL_WEEKDAYS, isWeekdayValue, normalizeWeekdays } from '@/lib/roster-weekdays';
import { inferShiftKindFromName, inferShiftKindFromStartTime } from '@/lib/shift-style';
import type { LegacyRosterShift, RosterData, RosterShift, ShiftKind, Weekday } from '@/types/roster';

const SHIFT_KINDS: ShiftKind[] = ['morning', 'afternoon', 'evening', 'night', 'custom'];

function isShiftKind(value: unknown): value is ShiftKind {
  return typeof value === 'string' && SHIFT_KINDS.includes(value as ShiftKind);
}

function getDefaultRoster(): RosterData {
  return {
    shifts: createDefaultRosterShifts(),
    remindersEnabled: true,
  };
}

function isWeekday(value: number): value is Weekday {
  return value >= 0 && value <= 6 && Number.isInteger(value);
}

function nextDateForWeekday(weekday: Weekday, from = new Date()) {
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i < 14; i += 1) {
    if (cursor.getDay() === weekday) {
      return formatDateKey(cursor);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return formatDateKey(from);
}

function migrateLegacyShift(shift: LegacyRosterShift, index: number): RosterShift {
  const defaults = createDefaultRosterShifts();
  const fallback = defaults[index % defaults.length];

  let date = shift.date;
  if (!date || !parseDateKey(date)) {
    if (Array.isArray(shift.days) && shift.days.length > 0) {
      const weekday = shift.days.find(isWeekday) ?? 1;
      date = nextDateForWeekday(weekday);
    } else {
      date = fallback.date;
    }
  }

  const legacyDays = Array.isArray(shift.days)
    ? shift.days.filter(isWeekdayValue)
    : undefined;

  return normalizeShift(
    {
      ...shift,
      date,
      weekdays: legacyDays ?? shift.weekdays,
    },
    index
  );
}

function normalizeShift(shift: Partial<RosterShift>, index: number): RosterShift {
  const defaults = createDefaultRosterShifts();
  const fallback = defaults[index % defaults.length];
  const date =
    typeof shift.date === 'string' && parseDateKey(shift.date) ? shift.date : fallback.date;

  const startTime = typeof shift.startTime === 'string' ? shift.startTime : fallback.startTime;
  const name = typeof shift.name === 'string' && shift.name.trim() ? shift.name.trim() : fallback.name;
  const kind =
    isShiftKind(shift.kind)
      ? shift.kind
      : inferShiftKindFromName(name) ??
        inferShiftKindFromStartTime(startTime) ??
        fallback.kind;
  const preset = getShiftKindPreset(kind);
  const range = normalizeShiftDateRange(
    date,
    typeof shift.endDate === 'string' ? shift.endDate : date
  );

  return {
    id: typeof shift.id === 'string' ? shift.id : `shift-${Date.now()}-${index}`,
    name,
    date: range.date,
    endDate: range.endDate,
    startTime,
    endTime: typeof shift.endTime === 'string' ? shift.endTime : fallback.endTime,
    kind,
    emoji:
      typeof shift.emoji === 'string' && shift.emoji.trim() ? shift.emoji.trim() : preset.emoji,
    notes: typeof shift.notes === 'string' ? shift.notes.trim() : '',
    enabled: typeof shift.enabled === 'boolean' ? shift.enabled : fallback.enabled,
    notifyAtStart: typeof shift.notifyAtStart === 'boolean' ? shift.notifyAtStart : true,
    notifyMinutesBefore:
      typeof shift.notifyMinutesBefore === 'number' && shift.notifyMinutesBefore >= 0
        ? Math.min(120, Math.floor(shift.notifyMinutesBefore))
        : fallback.notifyMinutesBefore,
    color: typeof shift.color === 'string' ? shift.color : preset.color,
    weekdays: normalizeWeekdays(
      Array.isArray(shift.weekdays) ? shift.weekdays.filter(isWeekdayValue) : undefined
    ),
  };
}

export function normalizeRosterFromPartial(parsed: Partial<RosterData>): RosterData {
  const defaults = getDefaultRoster();
  const shifts =
    Array.isArray(parsed.shifts) && parsed.shifts.length > 0
      ? parsed.shifts.map((shift, index) =>
          migrateLegacyShift(shift as LegacyRosterShift, index)
        )
      : defaults.shifts;

  return {
    shifts,
    remindersEnabled:
      typeof parsed.remindersEnabled === 'boolean'
        ? parsed.remindersEnabled
        : defaults.remindersEnabled,
  };
}

export async function loadRosterData(): Promise<RosterData> {
  const defaults = getDefaultRoster();

  try {
    const raw = await AsyncStorage.getItem(ROSTER_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw) as Partial<RosterData>;
    return normalizeRosterFromPartial(parsed);
  } catch {
    return defaults;
  }
}

export async function saveRosterData(data: RosterData): Promise<void> {
  await AsyncStorage.setItem(
    ROSTER_STORAGE_KEY,
    JSON.stringify({
      remindersEnabled: data.remindersEnabled,
      shifts: data.shifts.map((shift, index) => normalizeShift(shift, index)),
    })
  );
}

export function createEmptyShift(existingCount: number, date: string): RosterShift {
  return normalizeShift(
    {
      id: `shift-${Date.now()}`,
      name: `Shift ${existingCount + 1}`,
      date,
      endDate: date,
      weekdays: ALL_WEEKDAYS,
      kind: 'custom',
      emoji: '✨',
      notes: '',
      enabled: true,
    },
    existingCount
  );
}
