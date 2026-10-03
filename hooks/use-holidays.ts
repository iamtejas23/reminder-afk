import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { loadHolidays, saveHolidays } from '@/lib/holiday-storage';
import type { Holiday } from '@/types/holiday';

export function useHolidays() {
  const [holidays, setHolidays] = useState<Holiday[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadHolidays()
        .then((saved) => {
          if (active) setHolidays(saved);
        })
        .catch(() => {
          if (active) {
            setHolidays([]);
            setError('Could not load holidays saved on this device.');
          }
        });
      return () => {
        active = false;
      };
    }, [])
  );

  const persist = useCallback(async (next: Holiday[]) => {
    try {
      await saveHolidays(next);
      setHolidays(next);
      setError(null);
      return true;
    } catch {
      setError('Could not save your holiday. Please try again.');
      return false;
    }
  }, []);

  const saveHoliday = useCallback(
    async (holiday: Holiday) => {
      if (!holidays) return false;
      const exists = holidays.some((item) => item.id === holiday.id);
      const next = exists
        ? holidays.map((item) => (item.id === holiday.id ? holiday : item))
        : [...holidays, holiday];
      return persist(next);
    },
    [holidays, persist]
  );

  const removeHoliday = useCallback(
    async (id: string) => {
      if (!holidays) return false;
      return persist(holidays.filter((holiday) => holiday.id !== id));
    },
    [holidays, persist]
  );

  return { error, holidays, isReady: holidays !== null, removeHoliday, saveHoliday };
}
