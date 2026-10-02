const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseDateKey(dateKey: string): Date | null {
  const match = DATE_KEY_RE.exec(dateKey);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10) - 1;
  const day = Number.parseInt(match[3], 10);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatMonthYear(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function formatDayHeading(dateKey: string) {
  const date = parseDateKey(dateKey);
  if (!date) {
    return dateKey;
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDate(dateKey: string) {
  const date = parseDateKey(dateKey);
  if (!date) {
    return dateKey;
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export type MonthGridCell = {
  dateKey: string;
  day: number;
  inMonth: boolean;
};

export function buildMonthGrid(year: number, month: number): MonthGridCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: MonthGridCell[] = [];

  for (let i = 0; i < startWeekday; i += 1) {
    const date = new Date(year, month, -startWeekday + i + 1);
    cells.push({
      dateKey: formatDateKey(date),
      day: date.getDate(),
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      dateKey: formatDateKey(new Date(year, month, day)),
      day,
      inMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    const lastDate = parseDateKey(last.dateKey);
    const next = lastDate ? new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1) : new Date();
    cells.push({
      dateKey: formatDateKey(next),
      day: next.getDate(),
      inMonth: false,
    });
  }

  return cells;
}

export function isSameMonth(dateKey: string, year: number, month: number) {
  const date = parseDateKey(dateKey);
  if (!date) {
    return false;
  }

  return date.getFullYear() === year && date.getMonth() === month;
}

export function compareDateKeys(a: string, b: string) {
  return a.localeCompare(b);
}

export function shiftDateTimeMs(dateKey: string, time: string, minutesBefore = 0) {
  const date = parseDateKey(dateKey);
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!date || !timeMatch) {
    return null;
  }

  const hour = Number.parseInt(timeMatch[1], 10);
  const minute = Number.parseInt(timeMatch[2], 10);
  const trigger = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
    0,
    0
  );
  trigger.setMinutes(trigger.getMinutes() - minutesBefore);
  return trigger.getTime();
}
