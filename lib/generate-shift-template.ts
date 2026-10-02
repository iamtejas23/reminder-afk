import { SHIFT_TEMPLATE_WEEKS, getShiftTemplate, type ShiftTemplateId } from '@/constants/shift-templates';
import { parseDateKey } from '@/lib/roster-dates';
import { addDaysToDateKey } from '@/lib/roster-shift-dates';
import { ALL_WEEKDAYS, isWeekdayValue } from '@/lib/roster-weekdays';
import type { RosterShift, Weekday } from '@/types/roster';

export type BuildShiftTemplateArgs = {
  startDateKey: string;
  templateId: ShiftTemplateId;
  weekOffDays: Weekday[];
};

export function normalizeWeekOffDays(weekOffDays: Weekday[]): Weekday[] {
  const unique = [...new Set(weekOffDays.filter(isWeekdayValue))].sort((a, b) => a - b);
  return unique;
}

export function getWorkingWeekdaysFromWeekOffs(weekOffDays: Weekday[]): Weekday[] {
  const offs = normalizeWeekOffDays(weekOffDays);
  const working = ALL_WEEKDAYS.filter((day) => !offs.includes(day));
  return working.length > 0 ? working : ALL_WEEKDAYS;
}

export function countWorkingDaysInTemplateRange(
  startDateKey: string,
  weekOffDays: Weekday[],
  weeks = SHIFT_TEMPLATE_WEEKS
) {
  const working = getWorkingWeekdaysFromWeekOffs(weekOffDays);
  const totalDays = weeks * 7;
  let count = 0;

  for (let offset = 0; offset < totalDays; offset += 1) {
    const dateKey = addDaysToDateKey(startDateKey, offset);
    const date = parseDateKey(dateKey);
    if (!date) {
      continue;
    }
    const weekday = date.getDay() as Weekday;
    if (working.includes(weekday)) {
      count += 1;
    }
  }

  return count;
}

export function buildShiftFromTemplate({
  startDateKey,
  templateId,
  weekOffDays,
}: BuildShiftTemplateArgs): RosterShift {
  const template = getShiftTemplate(templateId);
  const offs = normalizeWeekOffDays(weekOffDays);
  const workingWeekdays = getWorkingWeekdaysFromWeekOffs(offs);
  const endDateKey = addDaysToDateKey(startDateKey, SHIFT_TEMPLATE_WEEKS * 7 - 1);

  return {
    id: `template-${templateId}-${Date.now()}`,
    name: `${template.label} shift (2 weeks)`,
    date: startDateKey,
    endDate: endDateKey,
    weekdays: workingWeekdays,
    startTime: template.startTime,
    endTime: template.endTime,
    kind: template.kind,
    emoji: template.emoji,
    notes: `${template.description} · ${workingWeekdays.length} days on / ${offs.length} off per week`,
    enabled: true,
    notifyAtStart: true,
    notifyMinutesBefore: 15,
    color: template.color,
  };
}

const ROTATING_TEMPLATE_ORDER: ShiftTemplateId[] = ['morning', 'evening', 'night'];

export function listWorkDayKeysInTemplateRange(
  startDateKey: string,
  weekOffDays: Weekday[],
  weeks = SHIFT_TEMPLATE_WEEKS
) {
  const working = getWorkingWeekdaysFromWeekOffs(weekOffDays);
  const keys: string[] = [];
  const totalDays = weeks * 7;

  for (let offset = 0; offset < totalDays; offset += 1) {
    const dateKey = addDaysToDateKey(startDateKey, offset);
    const date = parseDateKey(dateKey);
    if (!date) {
      continue;
    }

    const weekday = date.getDay() as Weekday;
    if (working.includes(weekday)) {
      keys.push(dateKey);
    }
  }

  return keys;
}

export function getTemplateRangeEndDateKey(startDateKey: string) {
  return addDaysToDateKey(startDateKey, SHIFT_TEMPLATE_WEEKS * 7 - 1);
}

/** One shift per work day, rotating morning → evening → night from the start date. */
export function buildRotatingAllTemplateShifts(
  startDateKey: string,
  weekOffDays: Weekday[]
): RosterShift[] {
  const workDays = listWorkDayKeysInTemplateRange(startDateKey, weekOffDays);
  const batchId = Date.now();

  return workDays.map((dateKey, index) => {
    const templateId = ROTATING_TEMPLATE_ORDER[index % ROTATING_TEMPLATE_ORDER.length];
    const template = getShiftTemplate(templateId);
    const date = parseDateKey(dateKey);
    const weekday = (date?.getDay() ?? 0) as Weekday;

    return {
      id: `template-rotate-${batchId}-${index}`,
      name: `${template.label} shift`,
      date: dateKey,
      endDate: dateKey,
      weekdays: [weekday],
      startTime: template.startTime,
      endTime: template.endTime,
      kind: template.kind,
      emoji: template.emoji,
      notes: template.description,
      enabled: true,
      notifyAtStart: true,
      notifyMinutesBefore: 15,
      color: template.color,
    };
  });
}
