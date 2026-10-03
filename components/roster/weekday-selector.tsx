import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WEEKDAY_HEADERS, WEEKDAYS } from '@/constants/roster';
import {
  ALL_WEEKDAYS,
  WEEKDAY_PRESET_WEEKDAYS,
  WEEKDAY_PRESET_WEEKEND,
  formatWeekdaysSummary,
  normalizeWeekdays,
  toggleWeekdayInList,
} from '@/lib/roster-weekdays';
import { Fonts } from '@/constants/theme';
import type { Weekday } from '@/types/roster';

type WeekdaySelectorProps = {
  accentColor: string;
  onChange: (weekdays: Weekday[]) => void;
  showPresets?: boolean;
  summaryPrefix?: string;
  weekdays: Weekday[];
};

export function WeekdaySelector({
  accentColor,
  onChange,
  showPresets = true,
  summaryPrefix,
  weekdays,
}: WeekdaySelectorProps) {
  const selected = normalizeWeekdays(weekdays);
  const summary = summaryPrefix
    ? `${summaryPrefix} ${formatWeekdaysSummary(selected)}`
    : formatWeekdaysSummary(selected);

  const presets = showPresets
    ? [
        { label: 'Every day', days: ALL_WEEKDAYS },
        { label: 'Mon–Fri', days: WEEKDAY_PRESET_WEEKDAYS },
        { label: 'Sat–Sun', days: WEEKDAY_PRESET_WEEKEND },
      ]
    : [{ label: 'Sat–Sun off', days: WEEKDAY_PRESET_WEEKEND }];

  return (
    <View style={styles.wrap}>
      <Text style={styles.summary}>{summary}</Text>

      <View style={styles.presetRow}>
        {presets.map((preset) => (
          <Pressable
            key={preset.label}
            accessibilityRole="button"
            accessibilityState={{
              selected:
                selected.length === preset.days.length &&
                preset.days.every((day) => selected.includes(day)),
            }}
            accessibilityLabel={`Repeat ${preset.label}`}
            onPress={() => onChange(preset.days)}
            style={styles.presetChip}>
            <Text style={styles.presetChipText}>{preset.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.dayRow}>
        {WEEKDAYS.map((day) => {
          const active = selected.includes(day);
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${WEEKDAY_HEADERS[day]}${active ? ', selected' : ', not selected'}`}
              onPress={() => onChange(toggleWeekdayInList(selected, day))}
              style={[styles.dayChip, active && { backgroundColor: accentColor }]}>
              <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                {WEEKDAY_HEADERS[day]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  summary: {
    color: '#6A756F',
    fontSize: 14,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#E4EDE8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetChipText: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 13,
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E7DF',
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  dayChipText: {
    color: '#112A24',
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  dayChipTextActive: {
    color: '#F6EFE5',
  },
});
