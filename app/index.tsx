import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PresetButton } from '@/components/afk/preset-button';
import { SettingSwitch } from '@/components/afk/setting-switch';
import { DURATION_STEP_MINUTES, PRESET_DURATIONS } from '@/constants/afk';
import { Fonts } from '@/constants/theme';
import { useAfkTimer } from '@/hooks/use-afk-timer';

// ─── Circular progress ring (two-halves clip technique) ───────────────────────
function CircularRing({
  progress,
  size = 220,
  strokeWidth = 16,
  trackColor = '#D6E7DF',
  fillColor = '#E46E42',
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  fillColor?: string;
}) {
  const p = Math.max(0, Math.min(1, progress));
  const half = size / 2;
  const deg = p * 360;
  const rightDeg = Math.min(deg, 180);
  const leftDeg = Math.max(0, deg - 180);

  return (
    <View style={{ width: size, height: size }}>
      {/* Track */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: half,
          borderWidth: strokeWidth,
          borderColor: trackColor,
        }}
      />
      {/* Right half clip */}
      <View
        style={{
          position: 'absolute',
          width: half,
          height: size,
          right: 0,
          overflow: 'hidden',
        }}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: half,
            borderWidth: strokeWidth,
            borderColor: fillColor,
            position: 'absolute',
            right: 0,
            transform: [{ rotate: `${rightDeg - 180}deg` }],
          }}
        />
      </View>
      {/* Left half clip (only once > 50%) */}
      {p > 0.5 && (
        <View
          style={{
            position: 'absolute',
            width: half,
            height: size,
            left: 0,
            overflow: 'hidden',
          }}>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: half,
              borderWidth: strokeWidth,
              borderColor: fillColor,
              position: 'absolute',
              left: 0,
              transform: [{ rotate: `${leftDeg - 180}deg` }],
            }}
          />
        </View>
      )}
    </View>
  );
}

// ─── Animated pulse ring (glow around timer when running) ─────────────────────
function PulseRing({ active, size }: { active: boolean; size: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 900, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 900, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
      opacity.value = withTiming(0.35, { duration: 400 });
    } else {
      scale.value = withTiming(1, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        animStyle,
        {
          position: 'absolute',
          width: size + 24,
          height: size + 24,
          borderRadius: (size + 24) / 2,
          backgroundColor: '#E46E42',
        },
      ]}
    />
  );
}

// ─── Status accent colours ────────────────────────────────────────────────────
const STATUS_ACCENTS = {
  idle: '#8FA89C',
  running: '#3B8F78',
  paused: '#D48734',
  complete: '#E46E42',
} as const;

const RING_FILL = {
  idle: '#C8D9D3',
  running: '#E46E42',
  paused: '#D48734',
  complete: '#3B8F78',
} as const;

const OPENING_SCREEN_MS = 3000;
const openingLogo = require('../assets/images/splash-icon.png');

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const timer = useAfkTimer();
  const [draftDuration, setDraftDuration] = useState(() => String(timer.durationMinutes));
  const [openingDelayComplete, setOpeningDelayComplete] = useState(false);

  useEffect(() => {
    setDraftDuration(String(timer.durationMinutes));
  }, [timer.durationMinutes]);

  useEffect(() => {
    const id = setTimeout(() => setOpeningDelayComplete(true), OPENING_SCREEN_MS);
    return () => clearTimeout(id);
  }, []);

  function commitDuration() {
    const v = Number.parseInt(draftDuration, 10);
    timer.setDurationMinutes(Number.isNaN(v) ? timer.durationMinutes : v);
  }

  // ─── Splash ───────────────────────────────────────────────────────────────
  if (!timer.isReady || !openingDelayComplete) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.openingScreen}>
          <View style={styles.orbLarge} />
          <View style={styles.orbSmall} />
          <View style={styles.openingContent}>
            <Image contentFit="contain" source={openingLogo} style={styles.openingLogo} />
            <Text style={styles.openingEyebrow}>reminder-afk</Text>
            <Text style={styles.openingTitle}>Pause well.{'\n'}Return sharp.</Text>
            <Text style={styles.openingSubtitle}>
              {timer.isReady ? 'Loading your AFK desk companion...' : 'Preparing your AFK timer...'}
            </Text>
          </View>
          <Text style={styles.openingCredit}>built by Tejas Mane</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ringSize = 220;
  const isRunning = timer.status === 'running';
  const ringFill = RING_FILL[timer.status];

  // ─── Main UI ──────────────────────────────────────────────────────────────
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

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Ionicons name="timer-outline" size={22} color="#A8D8C6" />
              <Text style={styles.eyebrow}>reminder-afk</Text>
            </View>
            <Text style={styles.title}>Stay AFK without{'\n'}losing the thread.</Text>
          </View>

          {/* ── Timer Ring Card ── */}
          <View style={styles.timerCard}>
            {/* Status + session row */}
            <View style={styles.heroHeaderRow}>
              <View style={[styles.statusPill, { backgroundColor: STATUS_ACCENTS[timer.status] }]}>
                <Ionicons
                  name={
                    timer.status === 'running'
                      ? 'radio-button-on'
                      : timer.status === 'paused'
                        ? 'pause-circle'
                        : timer.status === 'complete'
                          ? 'checkmark-circle'
                          : 'ellipse-outline'
                  }
                  size={12}
                  color="#F6EFE5"
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.statusPillText}>{timer.statusLabel}</Text>
              </View>
              <View style={styles.sessionBadge}>
                <Ionicons name="trophy-outline" size={13} color="#45554E" />
                <Text style={styles.heroMeta}>{timer.sessionCount} sessions</Text>
              </View>
            </View>

            {/* Circular ring */}
            <View style={styles.ringWrap}>
              <PulseRing active={isRunning} size={ringSize} />
              <CircularRing
                progress={timer.progress}
                size={ringSize}
                strokeWidth={18}
                trackColor="#D6E7DF"
                fillColor={ringFill}
              />
              {/* Center content */}
              <View style={styles.ringCenter} pointerEvents="none">
                <Text style={styles.countdown}>{timer.countdownLabel}</Text>
                <Text style={styles.progressPct}>{timer.progressPercent}%</Text>
              </View>
            </View>

            {/* Metric cards */}
            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Ionicons name="time-outline" size={14} color="#6A756F" />
                <Text style={styles.metricLabel}>Remaining</Text>
                <Text style={styles.metricValue}>{timer.remainingSummary}</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="hourglass-outline" size={14} color="#6A756F" />
                <Text style={styles.metricLabel}>Duration</Text>
                <Text style={styles.metricValue}>{timer.durationMinutes}m</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="notifications-outline" size={14} color="#6A756F" />
                <Text style={styles.metricLabel}>Next nudge</Text>
                <Text style={styles.metricValue}>{timer.nextReminderSummary}</Text>
              </View>
            </View>

            <Text style={styles.heroMessage}>{timer.statusMessage}</Text>
          </View>

          {/* ── Session Controls ── */}
          <View style={styles.controlsCard}>
            <Text style={styles.sectionEyebrow}>Session Controls</Text>

            <View style={styles.controlRow}>
              <Pressable
                accessibilityRole="button"
                onPress={timer.start}
                style={[styles.primaryButton, timer.status === 'running' && styles.buttonDisabledOp]}>
                <Ionicons
                  name={timer.status === 'paused' ? 'play-forward' : 'play'}
                  size={20}
                  color="#FFF7EF"
                />
                <Text style={styles.primaryButtonText}>
                  {timer.status === 'paused' ? 'Resume' : 'Start'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={!timer.canPause}
                onPress={timer.pause}
                style={[styles.secondaryButton, !timer.canPause && styles.buttonDisabledOp]}>
                <Ionicons name="pause" size={20} color="#112A24" />
                <Text style={styles.secondaryButtonText}>Pause</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={!timer.canReset}
                onPress={timer.reset}
                style={[styles.ghostButton, !timer.canReset && styles.buttonDisabledOp]}>
                <Ionicons name="refresh" size={18} color="#112A24" />
                <Text style={styles.ghostButtonText}>Reset</Text>
              </Pressable>
            </View>

            <Text style={styles.helperText}>
              Reminders at ~82%, ~95%, and 100% of the selected duration — delivered as system
              notifications even when the screen is off or the app is closed.
            </Text>
          </View>

          {/* ── Break Length ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="alarm-outline" size={18} color="#6E7B74" />
              <Text style={styles.sectionEyebrow}>Break Length</Text>
            </View>
            <Text style={styles.sectionTitle}>5 – 120 minutes</Text>

            <View style={styles.durationEditor}>
              <Pressable
                accessibilityRole="button"
                disabled={!timer.canEditDuration}
                onPress={() => timer.nudgeDuration(-DURATION_STEP_MINUTES)}
                style={[styles.nudgeButton, !timer.canEditDuration && styles.buttonDisabledOp]}>
                <Ionicons name="remove" size={22} color="#F6EFE5" />
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
                style={[styles.nudgeButton, !timer.canEditDuration && styles.buttonDisabledOp]}>
                <Ionicons name="add" size={22} color="#F6EFE5" />
              </Pressable>
            </View>

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

          {/* ── Reminder Settings ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="settings-outline" size={18} color="#6E7B74" />
              <Text style={styles.sectionEyebrow}>Reminder Settings</Text>
            </View>
            <Text style={styles.sectionTitle}>Control how the app nudges you back.</Text>

            <SettingSwitch
              description="Spoken reminder audio via notification — works when screen is off or app is closed."
              label="Voice prompts"
              value={timer.voiceEnabled}
              onValueChange={timer.setVoiceEnabled}
            />
            <View style={styles.divider} />
            <SettingSwitch
              description="Vibration on reminder notifications and in-app stage triggers."
              label="Vibration"
              value={timer.vibrationEnabled}
              onValueChange={timer.setVibrationEnabled}
            />

            <View style={styles.testVoiceRow}>
              <View style={styles.testVoiceCopy}>
                <View style={styles.testVoiceIconRow}>
                  <Ionicons name="mic-outline" size={16} color="#112A24" />
                  <Text style={styles.testVoiceLabel}>Test voice now</Text>
                </View>
                <Text style={styles.testVoiceHint}>
                  Plays the first spoken reminder immediately to verify sound.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={timer.testVoice}
                style={styles.testVoiceButton}>
                <Ionicons name="volume-high-outline" size={16} color="#F6EFE5" />
                <Text style={styles.testVoiceButtonText}>Test</Text>
              </Pressable>
            </View>

            {timer.permissionMessage ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openSettings()}
                style={styles.permissionNote}>
                <View style={styles.permissionNoteTop}>
                  <Ionicons name="notifications-off-outline" size={18} color="#7D3C22" />
                  <Text style={styles.permissionNoteTitle}>Notifications disabled</Text>
                </View>
                <Text style={styles.permissionNoteText}>
                  Background and lock-screen reminders won't fire without notification access.
                </Text>
                <View style={styles.permissionNoteCta}>
                  <Ionicons name="settings-outline" size={14} color="#7D3C22" />
                  <Text style={styles.permissionNoteCtaText}>Tap here → Open Settings → Enable Notifications</Text>
                </View>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.footerCredit}>built by Tejas Mane</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#112A24',
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 36,
    paddingTop: 8,
    gap: 16,
  },

  // Splash
  openingScreen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
  openingContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  openingLogo: {
    height: 160,
    marginBottom: 22,
    width: 160,
  },
  openingEyebrow: {
    color: '#A8D8C6',
    fontFamily: Fonts.mono,
    fontSize: 13,
    letterSpacing: 1.8,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  openingTitle: {
    color: '#F6EFE5',
    fontFamily: Fonts.rounded,
    fontSize: 34,
    lineHeight: 40,
    marginBottom: 10,
    textAlign: 'center',
  },
  openingSubtitle: {
    color: '#D0D9D4',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  openingCredit: {
    color: '#8FA89C',
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1.2,
    textAlign: 'center',
  },

  // Orbs
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

  // Header
  header: { gap: 8, marginTop: 10 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    fontSize: 34,
    lineHeight: 40,
  },

  // Timer card
  timerCard: {
    backgroundColor: 'rgba(246, 239, 229, 0.97)',
    borderRadius: 28,
    gap: 18,
    padding: 22,
    shadowColor: '#04120F',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    alignItems: 'center',
  },
  heroHeaderRow: {
    alignSelf: 'stretch',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPillText: {
    color: '#F6EFE5',
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMeta: {
    color: '#45554E',
    fontSize: 13,
    fontWeight: '600',
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdown: {
    color: '#112A24',
    fontFamily: Fonts.mono,
    fontSize: 52,
    letterSpacing: -2,
  },
  progressPct: {
    color: '#6A756F',
    fontFamily: Fonts.mono,
    fontSize: 14,
    marginTop: 2,
  },
  metricRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    backgroundColor: '#EFE4D3',
    borderRadius: 20,
    flex: 1,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  metricLabel: {
    color: '#6A756F',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 15,
  },
  heroMessage: {
    alignSelf: 'stretch',
    color: '#31413A',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  // Controls card
  controlsCard: {
    backgroundColor: 'rgba(246, 239, 229, 0.95)',
    borderRadius: 24,
    gap: 14,
    padding: 20,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#E46E42',
    borderRadius: 18,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: '#FFF7EF',
    fontFamily: Fonts.rounded,
    fontSize: 17,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#D6E7DF',
    borderRadius: 18,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 17,
  },
  ghostButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: '#9CAEA6',
    borderRadius: 18,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 14,
  },
  ghostButtonText: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 17,
  },
  buttonDisabledOp: { opacity: 0.42 },

  // Section cards
  sectionCard: {
    backgroundColor: 'rgba(246, 239, 229, 0.92)',
    borderRadius: 24,
    gap: 14,
    padding: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    fontSize: 22,
    lineHeight: 28,
  },

  // Duration editor
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
    width: 58,
  },
  durationInputWrap: {
    backgroundColor: '#EFE4D3',
    borderRadius: 22,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapDisabled: { opacity: 0.55 },
  durationInputLabel: {
    color: '#6A756F',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
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
    fontSize: 13,
    lineHeight: 20,
  },

  // Settings
  divider: {
    height: 1,
    backgroundColor: '#D6C9B8',
    marginVertical: 2,
  },
  permissionNote: {
    backgroundColor: '#F4D5C8',
    borderColor: '#E8A898',
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  permissionNoteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  permissionNoteTitle: {
    color: '#7D3C22',
    fontFamily: Fonts.rounded,
    fontSize: 15,
    fontWeight: '700',
  },
  permissionNoteText: {
    color: '#7D3C22',
    fontSize: 13,
    lineHeight: 19,
  },
  permissionNoteCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  permissionNoteCtaText: {
    color: '#7D3C22',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  testVoiceRow: {
    alignItems: 'center',
    backgroundColor: '#EFE4D3',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  testVoiceCopy: {
    flex: 1,
    gap: 4,
  },
  testVoiceIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  testVoiceLabel: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
  testVoiceHint: {
    color: '#41524A',
    fontSize: 12,
    lineHeight: 18,
  },
  testVoiceButton: {
    alignItems: 'center',
    backgroundColor: '#16362E',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 80,
    paddingHorizontal: 14,
  },
  testVoiceButtonText: {
    color: '#F6EFE5',
    fontFamily: Fonts.rounded,
    fontSize: 15,
  },

  // Footer
  footerCredit: {
    color: '#5A7269',
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1.2,
    textAlign: 'center',
    paddingTop: 4,
  },
});
