export type ShiftKind = 'morning' | 'afternoon' | 'evening' | 'night' | 'custom';

export type RosterShift = {
  id: string;
  name: string;
  /** First day of the shift (local `YYYY-MM-DD`). */
  date: string;
  /** Last day inclusive; same as `date` for a single day. */
  endDate: string;
  /** Days of week inside the range (0=Sun … 6=Sat). All seven = every day. */
  weekdays: Weekday[];
  startTime: string;
  endTime: string;
  kind: ShiftKind;
  emoji: string;
  notes: string;
  enabled: boolean;
  notifyAtStart: boolean;
  notifyMinutesBefore: number;
  color: string;
};

export type RosterData = {
  shifts: RosterShift[];
  remindersEnabled: boolean;
};

/** @deprecated Legacy weekday type — only used when migrating old roster data. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type LegacyRosterShift = Partial<RosterShift> & {
  days?: Weekday[];
};
