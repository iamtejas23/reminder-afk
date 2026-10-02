import { normalizeRosterFromPartial } from '@/lib/roster-storage';
import { shiftOverlapsMonth } from '@/lib/roster-weekdays';
import type { RosterData, RosterShift } from '@/types/roster';

export const ROSTER_BACKUP_FORMAT = 'reminder-afk-roster';
export const ROSTER_BACKUP_VERSION = 1;
export const ROSTER_BACKUP_PREFIX = 'REMINDER-AFK-ROSTER:v1';

export type RosterBackupScope = 'month' | 'full';

export type RosterBackupPayload = {
  format: typeof ROSTER_BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  scope: RosterBackupScope;
  year?: number;
  month?: number;
  remindersEnabled: boolean;
  shifts: RosterShift[];
};

export type RosterBackupImportResult =
  | { ok: true; message: string; next: RosterData; restoredCount: number }
  | { ok: false; message: string };

function shiftsTouchingMonth(shifts: RosterShift[], year: number, month: number) {
  return shifts.filter((shift) => shiftOverlapsMonth(shift, year, month));
}

export function createMonthRosterBackup(
  data: RosterData,
  year: number,
  month: number
): RosterBackupPayload {
  const shifts = shiftsTouchingMonth(data.shifts, year, month);

  return {
    format: ROSTER_BACKUP_FORMAT,
    version: ROSTER_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    scope: 'month',
    year,
    month,
    remindersEnabled: data.remindersEnabled,
    shifts,
  };
}

export function createFullRosterBackup(data: RosterData): RosterBackupPayload {
  return {
    format: ROSTER_BACKUP_FORMAT,
    version: ROSTER_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    scope: 'full',
    remindersEnabled: data.remindersEnabled,
    shifts: data.shifts,
  };
}

export function serializeRosterBackup(payload: RosterBackupPayload) {
  const json = JSON.stringify(payload, null, 2);
  return `${ROSTER_BACKUP_PREFIX}\n${json}`;
}

function extractJsonFromBackupText(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith(ROSTER_BACKUP_PREFIX)) {
    const jsonPart = trimmed.slice(ROSTER_BACKUP_PREFIX.length).trim();
    return jsonPart.startsWith('{') ? jsonPart : null;
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return null;
}

export function parseRosterBackupText(raw: string): RosterBackupPayload | null {
  const jsonText = extractJsonFromBackupText(raw);
  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText) as Partial<RosterBackupPayload>;
    if (parsed.format !== ROSTER_BACKUP_FORMAT) {
      return null;
    }

    if (typeof parsed.version !== 'number' || parsed.version > ROSTER_BACKUP_VERSION) {
      return null;
    }

    if (parsed.scope !== 'month' && parsed.scope !== 'full') {
      return null;
    }

    if (!Array.isArray(parsed.shifts)) {
      return null;
    }

    const normalized = normalizeRosterFromPartial({
      remindersEnabled: parsed.remindersEnabled,
      shifts: parsed.shifts,
    });

    return {
      format: ROSTER_BACKUP_FORMAT,
      version: ROSTER_BACKUP_VERSION,
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
      scope: parsed.scope,
      year: typeof parsed.year === 'number' ? parsed.year : undefined,
      month: typeof parsed.month === 'number' ? parsed.month : undefined,
      remindersEnabled: normalized.remindersEnabled,
      shifts: normalized.shifts,
    };
  } catch {
    return null;
  }
}

export function mergeRosterBackupImport(
  current: RosterData,
  backup: RosterBackupPayload
): RosterData {
  const importedIds = new Set(backup.shifts.map((shift) => shift.id));

  if (backup.scope === 'full') {
    return {
      remindersEnabled: backup.remindersEnabled,
      shifts: backup.shifts,
    };
  }

  const year = backup.year;
  const month = backup.month;
  if (year === undefined || month === undefined) {
    return {
      remindersEnabled: backup.remindersEnabled,
      shifts: [...current.shifts.filter((shift) => !importedIds.has(shift.id)), ...backup.shifts],
    };
  }

  const remaining = current.shifts.filter((shift) => {
    if (importedIds.has(shift.id)) {
      return false;
    }

    return !shiftOverlapsMonth(shift, year, month);
  });

  return {
    remindersEnabled: backup.remindersEnabled,
    shifts: [...remaining, ...backup.shifts],
  };
}

export function importRosterBackupText(
  current: RosterData,
  raw: string
): RosterBackupImportResult {
  const backup = parseRosterBackupText(raw);
  if (!backup) {
    return {
      ok: false,
      message: 'Could not read backup. Paste the full copied block starting with REMINDER-AFK-ROSTER.',
    };
  }

  if (backup.shifts.length === 0) {
    return {
      ok: false,
      message: 'Backup has no shifts to restore.',
    };
  }

  const next = mergeRosterBackupImport(current, backup);
  const scopeLabel =
    backup.scope === 'month' && backup.year !== undefined && backup.month !== undefined
      ? `month ${backup.year}-${String(backup.month + 1).padStart(2, '0')}`
      : 'full roster';

  return {
    ok: true,
    message: `Restored ${backup.shifts.length} shift${backup.shifts.length === 1 ? '' : 's'} (${scopeLabel}).`,
    next,
    restoredCount: backup.shifts.length,
  };
}
