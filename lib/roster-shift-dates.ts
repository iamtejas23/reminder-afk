import {
  compareDateKeys,
  formatDateKey,
  formatShortDate,
  parseDateKey,
} from '@/lib/roster-dates';

export const MAX_SHIFT_RANGE_DAYS = 62;

export function normalizeShiftDateRange(date: string, endDate?: string) {
  const start = parseDateKey(date);
  const end = parseDateKey(endDate ?? date) ?? start;
  if (!start) {
    return { date, endDate: date };
  }

  if (!end || compareDateKeys(formatDateKey(start), formatDateKey(end)) > 0) {
    return { date: formatDateKey(start), endDate: formatDateKey(start) };
  }

  return { date: formatDateKey(start), endDate: formatDateKey(end) };
}

export function eachDateKeyInRange(
  date: string,
  endDate: string,
  maxDays = MAX_SHIFT_RANGE_DAYS
): string[] {
  const { date: startKey, endDate: endKey } = normalizeShiftDateRange(date, endDate);
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  if (!start || !end) {
    return [];
  }

  const keys: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  while (compareDateKeys(formatDateKey(cursor), endKey) <= 0 && keys.length < maxDays) {
    keys.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

export function formatShiftDateRange(shift: { date: string; endDate: string }) {
  const { date, endDate } = normalizeShiftDateRange(shift.date, shift.endDate);
  if (date === endDate) {
    return formatShortDate(date);
  }

  return `${formatShortDate(date)} → ${formatShortDate(endDate)}`;
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = parseDateKey(dateKey);
  if (!date) {
    return dateKey;
  }

  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}
