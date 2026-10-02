import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

import {
  createFullRosterBackup,
  createMonthRosterBackup,
  serializeRosterBackup,
} from '@/lib/roster-backup';
import type { RosterData } from '@/types/roster';

export async function copyTextToClipboard(text: string) {
  await Clipboard.setStringAsync(text);
}

export async function readClipboardText() {
  return Clipboard.getStringAsync();
}

export function buildMonthBackupText(data: RosterData, year: number, month: number) {
  return serializeRosterBackup(createMonthRosterBackup(data, year, month));
}

export function buildFullBackupText(data: RosterData) {
  return serializeRosterBackup(createFullRosterBackup(data));
}

export async function shareRosterBackupText(title: string, text: string) {
  await Share.share({
    message: text,
    title,
  });
}
