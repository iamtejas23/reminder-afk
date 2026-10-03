import { AppIcon as Ionicons } from '@/components/ui/app-icon';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import {
  buildMonthBackupText,
  copyTextToClipboard,
  shareRosterBackupText,
} from '@/lib/roster-backup-share';
import { formatMonthYear } from '@/lib/roster-dates';
import type { RosterData } from '@/types/roster';

type RosterMonthBackupBarProps = {
  data: RosterData;
  month: number;
  onOpenRestore: () => void;
  shiftCount: number;
  year: number;
};

export function RosterMonthBackupBar({
  data,
  month,
  onOpenRestore,
  shiftCount,
  year,
}: RosterMonthBackupBarProps) {
  const monthLabel = formatMonthYear(year, month);

  function getBackupText() {
    return buildMonthBackupText(data, year, month);
  }

  async function copyMonthBackup() {
    if (shiftCount === 0) {
      Alert.alert('Nothing to copy', `No shifts in ${monthLabel} to back up yet.`);
      return;
    }

    try {
      await copyTextToClipboard(getBackupText());
      Alert.alert(
        'Month backup copied',
        `Save this text in Notes, email, or cloud storage. After reinstall, open Restore and paste it back for ${monthLabel}.`
      );
    } catch {
      Alert.alert('Could not copy backup', 'Try sharing the backup or copy it again.');
    }
  }

  async function shareMonthBackup() {
    if (shiftCount === 0) {
      Alert.alert('Nothing to share', `No shifts in ${monthLabel} to back up yet.`);
      return;
    }

    try {
      await shareRosterBackupText(`Roster ${monthLabel}`, getBackupText());
    } catch {
      Alert.alert('Could not share backup', 'Try copying the backup instead.');
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.copyRow}>
        <Ionicons name="cloud-upload-outline" size={20} color="#112A24" />
        <View style={styles.copyText}>
          <Text style={styles.title}>Month backup</Text>
          <Text style={styles.subtitle}>
            Copy or share {monthLabel} shifts. Keeps templates accurate across reinstall or a new
            phone when you store the backup outside the app.
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => void copyMonthBackup()} style={styles.action}>
          <Ionicons name="copy-outline" size={17} color="#112A24" />
          <Text style={styles.actionText}>Copy month</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void shareMonthBackup()} style={styles.action}>
          <Ionicons name="share-outline" size={17} color="#112A24" />
          <Text style={styles.actionText}>Share</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onOpenRestore} style={styles.actionPrimary}>
          <Ionicons name="download-outline" size={17} color="#F6EFE5" />
          <Text style={styles.actionPrimaryText}>Restore</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(246, 239, 229, 0.92)',
    borderRadius: 18,
    gap: 12,
    padding: 14,
  },
  copyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  copyText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 17,
  },
  subtitle: {
    color: '#6A756F',
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  action: {
    alignItems: 'center',
    backgroundColor: '#E4EDE8',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionText: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 14,
  },
  actionPrimary: {
    alignItems: 'center',
    backgroundColor: '#16362E',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionPrimaryText: {
    color: '#F6EFE5',
    fontFamily: Fonts.rounded,
    fontSize: 14,
  },
});
