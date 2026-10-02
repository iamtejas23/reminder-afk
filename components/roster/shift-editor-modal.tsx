import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { DateFieldButton } from '@/components/roster/date-field-button';
import { DatePickerSheet } from '@/components/roster/date-picker-sheet';

import { NOTIFY_BEFORE_OPTIONS, SHIFT_PALETTE } from '@/constants/roster';
import {
  SHIFT_EMOJI_OPTIONS,
  SHIFT_KIND_ORDER,
  getShiftKindPreset,
} from '@/constants/shift-style';
import { SettingSwitch } from '@/components/afk/setting-switch';
import { compareDateKeys, formatDayHeading } from '@/lib/roster-dates';
import {
  MAX_SHIFT_RANGE_DAYS,
  addDaysToDateKey,
  normalizeShiftDateRange,
} from '@/lib/roster-shift-dates';
import { countDaysInShiftRange } from '@/lib/roster-weekdays';
import { WeekdaySelector } from '@/components/roster/weekday-selector';
import { applyShiftKindPreset, applyStartTimeAutoStyle, resolveShiftEmoji } from '@/lib/shift-style';
import { Fonts } from '@/constants/theme';
import type { RosterShift, ShiftKind } from '@/types/roster';

type ShiftEditorModalProps = {
  onClose: () => void;
  onDelete?: () => void;
  onSave: (patch: Partial<RosterShift>) => void;
  shift: RosterShift;
  visible: boolean;
};

export function ShiftEditorModal({
  onClose,
  onDelete,
  onSave,
  shift,
  visible,
}: ShiftEditorModalProps) {
  const [datePickerTarget, setDatePickerTarget] = useState<'from' | 'until' | null>(null);
  const displayEmoji = resolveShiftEmoji(shift);
  const rangeDays = countDaysInShiftRange(shift);
  const range = normalizeShiftDateRange(shift.date, shift.endDate);

  function applyKind(kind: ShiftKind) {
    onSave(applyShiftKindPreset(kind, shift));
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.heroRow}>
              <View style={[styles.heroEmojiWrap, { backgroundColor: `${shift.color}22` }]}>
                <Text style={styles.heroEmoji}>{displayEmoji}</Text>
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.title}>Customize shift</Text>
                <Text style={styles.heroHint}>Pick a type, emoji, color, and times — all yours.</Text>
              </View>
            </View>

            <Text style={styles.label}>Shift type</Text>
            <View style={styles.kindRow}>
              {SHIFT_KIND_ORDER.map((kind) => {
                const preset = getShiftKindPreset(kind);
                const active = shift.kind === kind;
                return (
                  <Pressable
                    key={kind}
                    accessibilityRole="button"
                    onPress={() => applyKind(kind)}
                    style={[styles.kindChip, active && styles.kindChipActive]}>
                    <Text style={styles.kindChipEmoji}>{preset.emoji}</Text>
                    <Text style={[styles.kindChipText, active && styles.kindChipTextActive]}>
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Emoji</Text>
            <View style={styles.emojiRow}>
              {SHIFT_EMOJI_OPTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  accessibilityRole="button"
                  onPress={() => onSave({ emoji, kind: 'custom' })}
                  style={[styles.emojiChip, shift.emoji === emoji && styles.emojiChipActive]}>
                  <Text style={styles.emojiChipText}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={shift.emoji}
              onChangeText={(emoji) => onSave({ emoji, kind: 'custom' })}
              placeholder="Or type any emoji"
              placeholderTextColor="#9AA89F"
              style={styles.input}
            />

            <Text style={styles.label}>Dates (tap to open calendar)</Text>
            <DateFieldButton
              label="From"
              dateKey={shift.date}
              onPress={() => setDatePickerTarget('from')}
            />
            <DateFieldButton
              label="Until (repeat daily)"
              dateKey={shift.endDate}
              onPress={() => setDatePickerTarget('until')}
            />
            <Text style={styles.dateHint}>
              {range.date === range.endDate
                ? 'Single day only'
                : `${formatDayHeading(range.endDate)} · ${rangeDays} day${rangeDays === 1 ? '' : 's'} total`}
            </Text>

            <Text style={styles.label}>Quick range</Text>
            <View style={styles.optionRow}>
              {[
                { label: '1 day', days: 0 },
                { label: '1 week', days: 6 },
                { label: '2 weeks', days: 13 },
                { label: '1 month', days: 29 },
              ].map((option) => (
                <Pressable
                  key={option.label}
                  accessibilityRole="button"
                  onPress={() =>
                    onSave({
                      endDate: addDaysToDateKey(shift.date, option.days),
                    })
                  }
                  style={styles.optionChip}>
                  <Text style={styles.optionChipText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.rangeCapHint}>
              Up to {MAX_SHIFT_RANGE_DAYS} days per shift for reminders.
            </Text>

            <Text style={styles.label}>Repeat on these days</Text>
            <WeekdaySelector
              accentColor={shift.color}
              weekdays={shift.weekdays}
              onChange={(weekdays) => onSave({ weekdays })}
            />

            <Text style={styles.label}>Shift name</Text>
            <TextInput
              value={shift.name}
              onChangeText={(name) => onSave({ name })}
              placeholder="Morning shift"
              placeholderTextColor="#9AA89F"
              style={styles.input}
            />

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              value={shift.notes}
              onChangeText={(notes) => onSave({ notes })}
              placeholder="Ward B, station desk, relief at 14:00..."
              placeholderTextColor="#9AA89F"
              multiline
              style={[styles.input, styles.notesInput]}
            />

            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.label}>Start</Text>
                <TextInput
                  value={shift.startTime}
                  onChangeText={(startTime) =>
                    onSave({
                      startTime,
                      ...applyStartTimeAutoStyle(startTime, shift),
                    })
                  }
                  placeholder="09:00"
                  placeholderTextColor="#9AA89F"
                  style={styles.input}
                />
              </View>
              <View style={styles.timeField}>
                <Text style={styles.label}>End</Text>
                <TextInput
                  value={shift.endTime}
                  onChangeText={(endTime) => onSave({ endTime })}
                  placeholder="17:00"
                  placeholderTextColor="#9AA89F"
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.label}>Accent color</Text>
            <View style={styles.paletteRow}>
              {SHIFT_PALETTE.map((color) => (
                <Pressable
                  key={color}
                  accessibilityRole="button"
                  onPress={() => onSave({ color })}
                  style={[
                    styles.paletteSwatch,
                    { backgroundColor: color },
                    shift.color === color && styles.paletteSwatchActive,
                  ]}
                />
              ))}
            </View>

            <SettingSwitch
              label="Shift reminder"
              description="Local notification before this shift starts."
              value={shift.notifyAtStart}
              onValueChange={(notifyAtStart) => onSave({ notifyAtStart })}
            />

            <Text style={styles.label}>Notify before start</Text>
            <View style={styles.optionRow}>
              {NOTIFY_BEFORE_OPTIONS.map((minutes) => (
                <Pressable
                  key={minutes}
                  accessibilityRole="button"
                  disabled={!shift.notifyAtStart}
                  onPress={() => onSave({ notifyMinutesBefore: minutes })}
                  style={[
                    styles.optionChip,
                    shift.notifyMinutesBefore === minutes && styles.optionChipActive,
                    !shift.notifyAtStart && styles.optionChipDisabled,
                  ]}>
                  <Text
                    style={[
                      styles.optionChipText,
                      shift.notifyMinutesBefore === minutes && styles.optionChipTextActive,
                    ]}>
                    {minutes === 0 ? 'At start' : `${minutes}m`}
                  </Text>
                </Pressable>
              ))}
            </View>

            {onDelete ? (
              <Pressable accessibilityRole="button" onPress={onDelete} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={16} color="#7D3C22" />
                <Text style={styles.deleteButtonText}>Remove shift</Text>
              </Pressable>
            ) : null}

            <Pressable accessibilityRole="button" onPress={onClose} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>

      <DatePickerSheet
        visible={datePickerTarget !== null}
        title={datePickerTarget === 'from' ? 'Choose start date' : 'Choose end date'}
        value={datePickerTarget === 'from' ? shift.date : shift.endDate}
        onClose={() => setDatePickerTarget(null)}
        onConfirm={(dateKey) => {
          if (datePickerTarget === 'from') {
            const patch: Partial<RosterShift> = { date: dateKey };
            if (compareDateKeys(dateKey, shift.endDate) > 0) {
              patch.endDate = dateKey;
            }
            onSave(patch);
          } else {
            onSave({ endDate: dateKey });
          }
          setDatePickerTarget(null);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(4, 18, 15, 0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F6EFE5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#D0D9D4',
    borderRadius: 999,
    height: 5,
    marginTop: 10,
    width: 44,
  },
  content: {
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  heroRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginBottom: 4,
  },
  heroEmojiWrap: {
    alignItems: 'center',
    borderRadius: 18,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  heroEmoji: {
    fontSize: 34,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 24,
  },
  heroHint: {
    color: '#6A756F',
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    color: '#6A756F',
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  kindRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kindChip: {
    alignItems: 'center',
    backgroundColor: '#E4EDE8',
    borderRadius: 14,
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  kindChipActive: {
    backgroundColor: '#112A24',
  },
  kindChipEmoji: {
    fontSize: 22,
  },
  kindChipText: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 12,
    marginTop: 4,
  },
  kindChipTextActive: {
    color: '#F6EFE5',
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiChip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E7DF',
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  emojiChipActive: {
    borderColor: '#112A24',
    borderWidth: 2,
  },
  emojiChipText: {
    fontSize: 22,
  },
  dateHint: {
    color: '#6A756F',
    fontSize: 14,
    marginTop: -4,
  },
  rangeCapHint: {
    color: '#8FA89C',
    fontSize: 12,
    marginTop: -4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E7DF',
    borderRadius: 14,
    borderWidth: 1,
    color: '#112A24',
    fontFamily: Fonts.mono,
    fontSize: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesInput: {
    fontFamily: Fonts.rounded,
    fontSize: 15,
    minHeight: 84,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeField: {
    flex: 1,
    gap: 6,
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paletteSwatch: {
    borderRadius: 999,
    height: 32,
    width: 32,
  },
  paletteSwatchActive: {
    borderColor: '#112A24',
    borderWidth: 3,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    backgroundColor: '#E4EDE8',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionChipActive: {
    backgroundColor: '#112A24',
  },
  optionChipDisabled: {
    opacity: 0.45,
  },
  optionChipText: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 14,
  },
  optionChipTextActive: {
    color: '#F6EFE5',
  },
  deleteButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 10,
  },
  deleteButtonText: {
    color: '#7D3C22',
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
  doneButton: {
    alignItems: 'center',
    backgroundColor: '#112A24',
    borderRadius: 16,
    marginTop: 8,
    paddingVertical: 14,
  },
  doneButtonText: {
    color: '#F6EFE5',
    fontFamily: Fonts.rounded,
    fontSize: 17,
  },
});
