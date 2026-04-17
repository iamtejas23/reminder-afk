import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PresetButton } from '@/components/afk/preset-button';
import { ProgressBar } from '@/components/afk/progress-bar';
import { SettingSwitch } from '@/components/afk/setting-switch';
import { DURATION_STEP_MINUTES, PRESET_DURATIONS } from '@/constants/afk';
import { Fonts } from '@/constants/theme';
import { useAfkTimer } from '@/hooks/use-afk-timer';

const STATUS_ACCENTS = {
  idle: '#8FA89C',
  running: '#3B8F78',
  paused: '#D48734',
  complete: '#E46E42',
} as const;

export default function HomeScreen() {
  const timer = useAfkTimer();
  const [draftDuration, setDraftDuration] = useState(() => String(timer.durationMinutes));

  useEffect(() => {
    setDraftDuration(String(timer.durationMinutes));
  }, [timer.durationMinutes]);

  function commitDuration() {
    const parsedValue = Number.parseInt(draftDuration, 10);
    timer.setDurationMinutes(Number.isNaN(parsedValue) ? timer.durationMinutes : parsedValue);
  }

  if (!timer.isReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingEyebrow}>reminder-afk</Text>
          <Text style={styles.loadingTitle}>Restoring your last AFK session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', default: undefined })}>
        <View style={styles.orbLarge} />
        <View style={styles.orbSmall} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.eyebrow}>reminder-afk</Text>
            <Text style={styles.title}>Stay AFK without losing the thread.</Text>
            <Text style={styles.subtitle}>
              Background-safe reminders, a calm countdown, and a gentle robotic nudge back into
              focus.
            </Text>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroHeaderRow}>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: STATUS_ACCENTS[timer.status] },
                ]}>
                <Text style={styles.statusPillText}>{timer.statusLabel}</Text>
              </View>
              <Text style={styles.heroMeta}>Completed sessions: {timer.sessionCount}</Text>
            </View>

            <Text style={styles.countdown}>{timer.countdownLabel}</Text>
            <ProgressBar progress={timer.progress} label={`${timer.progressPercent}% complete`} />

            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Remaining</Text>
                <Text style={styles.metricValue}>{timer.remainingSummary}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Duration</Text>
                <Text style={styles.metricValue}>{timer.durationMinutes} min</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Next nudge</Text>
                <Text style={styles.metricValue}>{timer.nextReminderSummary}</Text>
              </View>
            </View>

            <Text style={styles.heroMessage}>{timer.statusMessage}</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionEyebrow}>Break Length</Text>
            <Text style={styles.sectionTitle}>Pick a timer between 5 and 120 minutes.</Text>

            <View style={styles.durationEditor}>
              <Pressable
                accessibilityRole="button"
                disabled={!timer.canEditDuration}
                onPress={() => timer.nudgeDuration(-DURATION_STEP_MINUTES)}
                style={[
                  styles.nudgeButton,
                  !timer.canEditDuration && styles.controlDisabled,
                ]}>
                <Text style={styles.nudgeButtonText}>-{DURATION_STEP_MINUTES}</Text>
              </Pressable>

              <View
                style={[
                  styles.durationInputWrap,
                  !timer.canEditDuration && styles.inputWrapDisabled,
                ]}>
                <Text style={styles.durationInputLabel}>Minutes</Text>
                <TextInput
                  value={draftDuration}
                  onChangeText={setDraftDuration}
                  onBlur={commitDuration}
                  onSubmitEditing={commitDuration}
                  editable={timer.canEditDuration}
                  keyboardType="number-pad"
                  maxLength={3}
                  selectTextOnFocus={timer.canEditDuration}
                  selectionColor="#E46E42"
                  style={styles.durationInput}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={!timer.canEditDuration}
                onPress={() => timer.nudgeDuration(DURATION_STEP_MINUTES)}
                style={[
                  styles.nudgeButton,
                  !timer.canEditDuration && styles.controlDisabled,
                ]}>
                <Text style={styles.nudgeButtonText}>+{DURATION_STEP_MINUTES}</Text>
              </Pressable>
            </View>

            <Text style={styles.helperText}>
              The last duration is saved automatically. Presets are quick shortcuts for common
              break lengths.
            </Text>

            <View style={styles.presetRow}>
              {PRESET_DURATIONS.map((preset) => (
                <PresetButton
                  key={preset}
                  active={preset === timer.durationMinutes}
                  disabled={!timer.canEditDuration}
                  label={`${preset}m`}
                  onPress={() => timer.setDurationMinutes(preset)}
                />
              ))}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionEyebrow}>Reminder Settings</Text>
            <Text style={styles.sectionTitle}>Control how the app nudges you back.</Text>

            <SettingSwitch
              description="Uses Expo Speech with a slightly slower, lower-pitch voice while the app is open."
              label="Voice prompts"
              value={timer.voiceEnabled}
              onValueChange={timer.setVoiceEnabled}
            />
            <SettingSwitch
              description="Foreground buzzes now, plus Android notification channel vibration for scheduled reminders."
              label="Vibration"
              value={timer.vibrationEnabled}
              onValueChange={timer.setVibrationEnabled}
            />

            {timer.permissionMessage ? (
              <View style={styles.permissionNote}>
                <Text style={styles.permissionNoteText}>{timer.permissionMessage}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionEyebrow}>Session Controls</Text>
            <Text style={styles.sectionTitle}>Start, pause, or clear the current AFK run.</Text>

            <View style={styles.controlRow}>
              <Pressable
                accessibilityRole="button"
                onPress={timer.start}
                style={[styles.actionButton, styles.primaryButton]}>
                <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
                  {timer.status === 'paused' ? 'Resume' : 'Start'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={!timer.canPause}
                onPress={timer.pause}
                style={[
                  styles.actionButton,
                  styles.secondaryButton,
                  !timer.canPause && styles.controlDisabled,
                ]}>
                <Text style={styles.actionButtonText}>Pause</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={!timer.canReset}
                onPress={timer.reset}
                style={[
                  styles.actionButton,
                  styles.ghostButton,
                  !timer.canReset && styles.controlDisabled,
                ]}>
                <Text style={styles.actionButtonText}>Reset</Text>
              </Pressable>
            </View>

            <Text style={styles.helperText}>
              Smart reminders are scheduled at roughly 82.5%, 95%, and 100% of the selected
              duration, with local notifications continuing in the background.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#112A24',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 8,
    gap: 18,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingEyebrow: {
    color: '#A8D8C6',
    fontFamily: Fonts.mono,
    fontSize: 14,
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  loadingTitle: {
    color: '#F6EFE5',
    fontFamily: Fonts.rounded,
    fontSize: 30,
    lineHeight: 36,
  },
  orbLarge: {
    position: 'absolute',
    top: -40,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(59, 143, 120, 0.28)',
  },
  orbSmall: {
    position: 'absolute',
    bottom: 120,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(228, 110, 66, 0.2)',
  },
  header: {
    gap: 8,
    marginTop: 10,
  },
  eyebrow: {
    color: '#A8D8C6',
    fontFamily: Fonts.mono,
    fontSize: 13,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F6EFE5',
    fontFamily: Fonts.rounded,
    fontSize: 36,
    lineHeight: 40,
  },
  subtitle: {
    color: '#D0D9D4',
    fontSize: 16,
    lineHeight: 24,
  },
  heroCard: {
    backgroundColor: 'rgba(246, 239, 229, 0.96)',
    borderRadius: 28,
    gap: 18,
    padding: 22,
    shadowColor: '#04120F',
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  heroHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusPillText: {
    color: '#F6EFE5',
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroMeta: {
    color: '#45554E',
    fontSize: 13,
    fontWeight: '600',
  },
  countdown: {
    color: '#112A24',
    fontFamily: Fonts.mono,
    fontSize: 54,
    letterSpacing: -2,
    textAlign: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    backgroundColor: '#EFE4D3',
    borderRadius: 20,
    flex: 1,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  metricLabel: {
    color: '#6A756F',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 17,
  },
  heroMessage: {
    color: '#31413A',
    fontSize: 15,
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: 'rgba(246, 239, 229, 0.92)',
    borderRadius: 24,
    gap: 14,
    padding: 20,
  },
  sectionEyebrow: {
    color: '#6E7B74',
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 24,
    lineHeight: 28,
  },
  durationEditor: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  nudgeButton: {
    alignItems: 'center',
    backgroundColor: '#16362E',
    borderRadius: 18,
    height: 58,
    justifyContent: 'center',
    width: 62,
  },
  nudgeButtonText: {
    color: '#F6EFE5',
    fontFamily: Fonts.mono,
    fontSize: 18,
  },
  durationInputWrap: {
    backgroundColor: '#EFE4D3',
    borderRadius: 22,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapDisabled: {
    opacity: 0.55,
  },
  durationInputLabel: {
    color: '#6A756F',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  durationInput: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 34,
    padding: 0,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  helperText: {
    color: '#41524A',
    fontSize: 14,
    lineHeight: 21,
  },
  permissionNote: {
    backgroundColor: '#F4D5C8',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  permissionNoteText: {
    color: '#7D3C22',
    fontSize: 14,
    lineHeight: 20,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 14,
  },
  primaryButton: {
    backgroundColor: '#E46E42',
  },
  primaryButtonText: {
    color: '#FFF7EF',
  },
  secondaryButton: {
    backgroundColor: '#D6E7DF',
  },
  ghostButton: {
    backgroundColor: 'transparent',
    borderColor: '#9CAEA6',
    borderWidth: 1,
  },
  actionButtonText: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 18,
  },
  controlDisabled: {
    opacity: 0.45,
  },
});
