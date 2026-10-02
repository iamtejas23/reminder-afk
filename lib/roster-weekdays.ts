import { WEEKDAY_HEADERS } from '@/constants/roster';
import { formatDateKey, parseDateKey } from '@/lib/roster-dates';
import { eachDateKeyInRange } from '@/lib/roster-shift-dates';
import type { RosterShift, Weekday } from '@/types/roster';

export const ALL_WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export const WEEKDAY_PRESET_WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5];
export const WEEKDAY_PRESET_WEEKEND: Weekday[] = [0, 6];

export function isWeekdayValue(value: number): value is Weekday {
  return value >= 0 && value <= 6 && Number.isInteger(value);
}

export function normalizeWeekdays(days: Weekday[] | undefined): Weekday[] {
  if (!days || days.length === 0) {
    return ALL_WEEKDAYS;
  }

  const unique = [...new Set(days.filter(isWeekdayValue))].sort((a, b) => a - b);
  return unique.length > 0 ? unique : ALL_WEEKDAYS;
}

export function eachShiftOccurrenceDateKeys(shift: RosterShift): string[] {
  const rangeKeys = eachDateKeyInRange(shift.date, shift.endDate);
  const weekdays = normalizeWeekdays(shift.weekdays);

  if (weekdays.length === ALL_WEEKDAYS.length) {
    return rangeKeys;
  }

  return rangeKeys.filter((dateKey) => {
    const date = parseDateKey(dateKey);
    if (!date) {
      return false;
    }

    return weekdays.includes(date.getDay() as Weekday);
  });
}

export function formatWeekdaysSummary(weekdays: Weekday[]) {
  const normalized = normalizeWeekdays(weekdays);

  if (normalized.length === ALL_WEEKDAYS.length) {
    return 'Every day';
  }

  const isWeekdaysOnly =
    normalized.length === WEEKDAY_PRESET_WEEKDAYS.length &&
    WEEKDAY_PRESET_WEEKDAYS.every((day) => normalized.includes(day));
  if (isWeekdaysOnly) {
    return 'Mon–Fri (weekdays)';
  }

  const isWeekendOnly =
    normalized.length === WEEKDAY_PRESET_WEEKEND.length &&
    WEEKDAY_PRESET_WEEKEND.every((day) => normalized.includes(day));
  if (isWeekendOnly) {
    return 'Sat–Sun (weekend)';
  }

  return normalized.map((day) => WEEKDAY_HEADERS[day]).join(', ');
}

export function shiftOccursOnDate(shift: RosterShift, dateKey: string) {
  return eachShiftOccurrenceDateKeys(shift).includes(dateKey);
}

export function countDaysInShiftRange(shift: RosterShift) {
  return eachShiftOccurrenceDateKeys(shift).length;
}

export function shiftOverlapsMonth(shift: RosterShift, year: number, month: number) {
  const monthStart = formatDateKey(new Date(year, month, 1));
  const monthEnd = formatDateKey(new Date(year, month + 1, 0));

  return eachShiftOccurrenceDateKeys(shift).some(
    (dateKey) =>
      compareDateKeys(dateKey, monthStart) >= 0 && compareDateKeys(dateKey, monthEnd) <= 0
  );
}

function compareDateKeys(a: string, b: string) {
  return a.localeCompare(b);
}

export function toggleWeekdayInList(weekdays: Weekday[], day: Weekday): Weekday[] {
  const normalized = normalizeWeekdays(weekdays);
  const hasDay = normalized.includes(day);
  const next = hasDay ? normalized.filter((value) => value !== day) : [...normalized, day].sort();

  return next.length > 0 ? next : normalized;
}
