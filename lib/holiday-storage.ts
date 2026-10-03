import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Holiday } from '@/types/holiday';

const HOLIDAYS_STORAGE_KEY = '@reminder-afk/holidays:v1';

export async function loadHolidays(): Promise<Holiday[]> {
  const raw = await AsyncStorage.getItem(HOLIDAYS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is Holiday =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.date === 'string'
    );
  } catch {
    return [];
  }
}

export async function saveHolidays(holidays: Holiday[]): Promise<void> {
  await AsyncStorage.setItem(HOLIDAYS_STORAGE_KEY, JSON.stringify(holidays));
}
