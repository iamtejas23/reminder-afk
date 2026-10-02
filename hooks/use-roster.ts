import { useCallback, useEffect, useState } from 'react';

import type { ShiftTemplateId } from '@/constants/shift-templates';
import {
  buildRotatingAllTemplateShifts,
  buildShiftFromTemplate,
  getTemplateRangeEndDateKey,
} from '@/lib/generate-shift-template';
import { removeShiftsTouchingDateRange } from '@/lib/roster-shift-overlap';
import { importRosterBackupText, type RosterBackupImportResult } from '@/lib/roster-backup';
import { createEmptyShift, loadRosterData, saveRosterData } from '@/lib/roster-storage';
import type { Weekday } from '@/types/roster';
import { syncRosterNotificationsAsync } from '@/lib/roster-notifications';
import type { RosterData, RosterShift } from '@/types/roster';

type SyncStatus = 'idle' | 'syncing' | 'unsupported' | 'denied' | 'ready';

export function useRoster() {
  const [data, setData] = useState<RosterData | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const applySyncResult = useCallback((result: 'scheduled' | 'unsupported' | 'denied') => {
    if (result === 'unsupported') {
      setSyncStatus('unsupported');
      setSyncMessage(
        'Shift reminders need a dev build or release APK on Android Expo Go. Your roster is still saved locally.'
      );
    } else if (result === 'denied') {
      setSyncStatus('denied');
      setSyncMessage('Turn on notifications in system settings to receive shift reminders.');
    } else {
      setSyncStatus('ready');
      setSyncMessage(null);
    }
  }, []);

  const persist = useCallback(
    async (next: RosterData) => {
      setData(next);
      await saveRosterData(next);
      setSyncStatus('syncing');
      const result = await syncRosterNotificationsAsync(next.shifts, next.remindersEnabled);
      applySyncResult(result);
    },
    [applySyncResult]
  );

  useEffect(() => {
    let active = true;

    void (async () => {
      const loaded = await loadRosterData();
      if (!active) {
        return;
      }

      setData(loaded);
      setSyncStatus('syncing');
      const result = await syncRosterNotificationsAsync(loaded.shifts, loaded.remindersEnabled);
      if (!active) {
        return;
      }
      applySyncResult(result);
    })();

    return () => {
      active = false;
    };
  }, [applySyncResult]);

  const updateShift = useCallback(
    async (shiftId: string, patch: Partial<RosterShift>) => {
      if (!data) {
        return;
      }
      const next: RosterData = {
        ...data,
        shifts: data.shifts.map((shift) =>
          shift.id === shiftId ? { ...shift, ...patch } : shift
        ),
      };
      await persist(next);
    },
    [data, persist]
  );

  const addShift = useCallback(
    async (date: string) => {
      if (!data) {
        return;
      }
      const next: RosterData = {
        ...data,
        shifts: [...data.shifts, createEmptyShift(data.shifts.length, date)],
      };
      await persist(next);
    },
    [data, persist]
  );

  const removeShift = useCallback(
    async (shiftId: string) => {
      if (!data) {
        return;
      }
      const next: RosterData = {
        ...data,
        shifts: data.shifts.filter((shift) => shift.id !== shiftId),
      };
      await persist(next);
    },
    [data, persist]
  );

  const setRemindersEnabled = useCallback(
    async (enabled: boolean) => {
      if (!data) {
        return;
      }
      await persist({ ...data, remindersEnabled: enabled });
    },
    [data, persist]
  );

  const resyncNotifications = useCallback(async () => {
    if (!data) {
      return;
    }
    await persist(data);
  }, [data, persist]);

  const applyShiftTemplate = useCallback(
    async (templateId: ShiftTemplateId, startDateKey: string, weekOffDays: Weekday[]) => {
      if (!data) {
        return;
      }
      const shift = buildShiftFromTemplate({ startDateKey, templateId, weekOffDays });
      const endDateKey = getTemplateRangeEndDateKey(startDateKey);
      const kept = removeShiftsTouchingDateRange(data.shifts, startDateKey, endDateKey);
      await persist({ ...data, shifts: [...kept, shift] });
    },
    [data, persist]
  );

  const applyAllShiftTemplates = useCallback(
    async (startDateKey: string, weekOffDays: Weekday[]) => {
      if (!data) {
        return;
      }
      const endDateKey = getTemplateRangeEndDateKey(startDateKey);
      const kept = removeShiftsTouchingDateRange(data.shifts, startDateKey, endDateKey);
      const shifts = buildRotatingAllTemplateShifts(startDateKey, weekOffDays);
      await persist({ ...data, shifts: [...kept, ...shifts] });
    },
    [data, persist]
  );

  const importRosterBackup = useCallback(
    async (raw: string): Promise<RosterBackupImportResult> => {
      if (!data) {
        return { ok: false, message: 'Roster is still loading. Try again in a moment.' };
      }

      const result = importRosterBackupText(data, raw);
      if (!result.ok) {
        return result;
      }

      await persist(result.next);
      return { ok: true, message: result.message, next: result.next, restoredCount: result.restoredCount };
    },
    [data, persist]
  );

  return {
    addShift,
    applyAllShiftTemplates,
    applyShiftTemplate,
    data,
    importRosterBackup,
    isReady: data !== null,
    removeShift,
    resyncNotifications,
    setRemindersEnabled,
    syncMessage,
    syncStatus,
    updateShift,
  };
}
