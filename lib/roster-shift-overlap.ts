import { compareDateKeys } from '@/lib/roster-dates';
import { eachShiftOccurrenceDateKeys } from '@/lib/roster-weekdays';
import type { RosterShift } from '@/types/roster';

export function shiftTouchesDateRange(shift: RosterShift, startDateKey: string, endDateKey: string) {
  return eachShiftOccurrenceDateKeys(shift).some(
    (dateKey) =>
      compareDateKeys(dateKey, startDateKey) >= 0 && compareDateKeys(dateKey, endDateKey) <= 0
  );
}

export function removeShiftsTouchingDateRange(
  shifts: RosterShift[],
  startDateKey: string,
  endDateKey: string
) {
  return shifts.filter((shift) => !shiftTouchesDateRange(shift, startDateKey, endDateKey));
}
