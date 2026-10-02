import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingSwitch } from '@/components/afk/setting-switch';
import { ScreenBackground } from '@/components/ui/screen-background';
import { AppColors } from '@/constants/app-ui';
import { useRoster } from '@/hooks/use-roster';
import { useTabBarMetrics } from '@/hooks/use-tab-bar-metrics';
import { REMINDER_STAGES } from '@/constants/afk';
import { loadAfkPreferences, saveAfkPreferences } from '@/lib/afk-storage';
import { requestAfkNotificationPermissionsAsync } from '@/lib/afk-notifications';
import { speakReminder } from '@/lib/afk-speech';
import { RosterBackupModal } from '@/components/roster/roster-backup-modal';
import {
  buildFullBackupText,
  copyTextToClipboard,
  shareRosterBackupText,
} from '@/lib/roster-backup-share';
import { Fonts } from '@/constants/theme';

const appVersion = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const roster = useRoster();
  const { scrollBottomPadding } = useTabBarMetrics();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [permissionHint, setPermissionHint] = useState<string | null>(null);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadAfkPreferences().then((prefs) => {
        setVoiceEnabled(prefs.voiceEnabled);
        setVibrationEnabled(prefs.vibrationEnabled);
      });
    }, [])
  );

  async function updatePreference(
    key: 'voiceEnabled' | 'vibrationEnabled',
    value: boolean
  ) {
    const prefs = await loadAfkPreferences();
    const next = { ...prefs, [key]: value };
    await saveAfkPreferences(next);
    if (key === 'voiceEnabled') {
      setVoiceEnabled(value);
    } else {
      setVibrationEnabled(value);
    }
  }

  async function copyFullRosterBackup() {
    if (!roster.data) {
      return;
    }

    const shiftCount = roster.data.shifts.length;
    if (shiftCount === 0) {
      Alert.alert('Nothing to copy', 'Add shifts on the Roster tab first.');
      return;
    }

    await copyTextToClipboard(buildFullBackupText(roster.data));
    Alert.alert(
      'Full roster copied',
      'Save this text somewhere safe (Notes, email, Google Drive). After reinstall, use Restore roster below and paste it back.'
    );
  }

  async function shareFullRosterBackup() {
    if (!roster.data || roster.data.shifts.length === 0) {
      Alert.alert('Nothing to share', 'Add shifts on the Roster tab first.');
      return;
    }

    await shareRosterBackupText('reminder-afk roster', buildFullBackupText(roster.data));
  }

  async function restoreFromBackup(text: string) {
    const result = await roster.importRosterBackup(text);
    if (!result.ok) {
      Alert.alert('Restore failed', result.message);
      return;
    }

    setRestoreModalVisible(false);
    Alert.alert('Roster restored', result.message);
  }

  async function requestNotifications() {
    const state = await requestAfkNotificationPermissionsAsync();
    if (state === 'granted') {
      setPermissionHint('Notifications are enabled for AFK and roster reminders.');
      void roster.resyncNotifications();
    } else if (state === 'unsupported') {
      setPermissionHint('Use a development build or release APK for notification access on this device.');
    } else {
      setPermissionHint('Permission denied. Open system settings to enable notifications.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScreenBackground>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPadding }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Ionicons name="options" size={22} color={AppColors.mint} />
              <Text style={styles.eyebrow}>Settings</Text>
            </View>
            <Text style={styles.title}>Tune reminders{'\n'}and preferences.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>AFK timer</Text>
            <SettingSwitch
              description="Spoken reminder audio for break stages."
              label="Voice prompts"
              value={voiceEnabled}
              onValueChange={(value) => void updatePreference('voiceEnabled', value)}
            />
            <View style={styles.divider} />
            <SettingSwitch
              description="Vibration on AFK stage triggers and notifications."
              label="Vibration"
              value={vibrationEnabled}
              onValueChange={(value) => void updatePreference('vibrationEnabled', value)}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => void speakReminder(REMINDER_STAGES[0].message)}
              style={styles.secondaryAction}>
              <Ionicons name="volume-high-outline" size={18} color="#112A24" />
              <Text style={styles.secondaryActionText}>Test voice prompt</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Shift roster</Text>
            <SettingSwitch
              description="Weekly local alerts before each enabled shift."
              label="Shift reminders"
              value={roster.data?.remindersEnabled ?? true}
              onValueChange={(value) => void roster.setRemindersEnabled(value)}
            />
            <Pressable accessibilityRole="button" onPress={() => void roster.resyncNotifications()} style={styles.secondaryAction}>
              <Ionicons name="refresh-circle-outline" size={18} color="#112A24" />
              <Text style={styles.secondaryActionText}>Resync roster notifications</Text>
            </Pressable>
            <Text style={styles.sectionHint}>
              Backups live outside the app so they survive uninstall. Copy or share after big changes;
              restore on a new install or device.
            </Text>
            <Pressable accessibilityRole="button" onPress={() => void copyFullRosterBackup()} style={styles.secondaryAction}>
              <Ionicons name="copy-outline" size={18} color="#112A24" />
              <Text style={styles.secondaryActionText}>Copy full roster backup</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => void shareFullRosterBackup()} style={styles.secondaryAction}>
              <Ionicons name="share-outline" size={18} color="#112A24" />
              <Text style={styles.secondaryActionText}>Share full roster backup</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setRestoreModalVisible(true)} style={styles.primaryAction}>
              <Ionicons name="download-outline" size={18} color="#F6EFE5" />
              <Text style={styles.primaryActionText}>Restore roster from backup</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>System</Text>
            <Pressable accessibilityRole="button" onPress={() => void requestNotifications()} style={styles.secondaryAction}>
              <Ionicons name="notifications-outline" size={18} color="#112A24" />
              <Text style={styles.secondaryActionText}>Request notification permission</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => Linking.openSettings()} style={styles.secondaryAction}>
              <Ionicons name="settings-outline" size={18} color="#112A24" />
              <Text style={styles.secondaryActionText}>Open device settings</Text>
            </Pressable>
            {permissionHint ? <Text style={styles.hint}>{permissionHint}</Text> : null}
          </View>

          <View style={styles.aboutCard}>
            <Ionicons name="leaf-outline" size={20} color={AppColors.mint} />
            <View style={styles.aboutCopy}>
              <Text style={styles.aboutTitle}>reminder-afk</Text>
              <Text style={styles.aboutMeta}>Version {appVersion}</Text>
              <Text style={styles.aboutMeta}>Built by Tejas Mane</Text>
            </View>
          </View>
        </ScrollView>
      </ScreenBackground>

      <RosterBackupModal
        hint="Full backup replaces the entire roster. Month backups merge only that calendar month."
        title="Restore roster backup"
        visible={restoreModalVisible}
        onClose={() => setRestoreModalVisible(false)}
        onImport={(text) => void restoreFromBackup(text)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.canvas,
  },
  scroll: {
    gap: 16,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  header: {
    gap: 8,
    marginTop: 8,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  eyebrow: {
    color: AppColors.mint,
    fontFamily: Fonts.mono,
    fontSize: 13,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    color: AppColors.cream,
    fontFamily: Fonts.rounded,
    fontSize: 32,
    lineHeight: 38,
  },
  card: {
    backgroundColor: AppColors.card,
    borderRadius: 22,
    gap: 8,
    padding: 18,
  },
  cardTitle: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 20,
    marginBottom: 4,
  },
  divider: {
    backgroundColor: '#E4EDE8',
    height: 1,
    marginVertical: 4,
  },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: '#E4EDE8',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryActionText: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 15,
  },
  hint: {
    color: '#6A756F',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  sectionHint: {
    color: '#6A756F',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: '#112A24',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryActionText: {
    color: '#F6EFE5',
    fontFamily: Fonts.rounded,
    fontSize: 15,
  },
  aboutCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 239, 229, 0.18)',
    borderColor: AppColors.cardBorder,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  aboutCopy: {
    gap: 2,
  },
  aboutTitle: {
    color: AppColors.cream,
    fontFamily: Fonts.rounded,
    fontSize: 18,
  },
  aboutMeta: {
    color: AppColors.muted,
    fontSize: 13,
  },
});
