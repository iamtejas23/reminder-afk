import { AppIcon as Ionicons } from '@/components/ui/app-icon';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WEEKDAY_HEADERS } from '@/constants/roster';
import { AppColors } from '@/constants/app-ui';
import {
  buildMonthGrid,
  formatDateKey,
  formatDayHeading,
  formatMonthYear,
} from '@/lib/roster-dates';
import { Fonts } from '@/constants/theme';

type MonthCalendarProps = {
  month: number;
  holidayIconsByDate?: Record<string, string[]>;
  holidayNamesByDate?: Record<string, string[]>;
  onNextMonth: () => void;
  onPrevMonth: () => void;
  onSelectDate: (dateKey: string) => void;
  primaryEmojiByDate: Record<string, string>;
  selectedDateKey: string;
  shiftCountByDate: Record<string, number>;
  showShiftMarkers?: boolean;
  year: number;
};

export function MonthCalendar({
  month,
  holidayIconsByDate = {},
  holidayNamesByDate = {},
  onNextMonth,
  onPrevMonth,
  onSelectDate,
  primaryEmojiByDate,
  selectedDateKey,
  shiftCountByDate,
  showShiftMarkers = true,
  year,
}: MonthCalendarProps) {
  const todayKey = formatDateKey(new Date());
  const cells = buildMonthGrid(year, month);

  return (
    <View style={styles.card}>
      <View style={styles.monthHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={onPrevMonth}
          style={styles.monthNav}>
          <Ionicons name="chevron-back" size={20} color="#112A24" />
        </Pressable>
        <Text style={styles.monthTitle}>{formatMonthYear(year, month)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={onNextMonth}
          style={styles.monthNav}>
          <Ionicons name="chevron-forward" size={20} color="#112A24" />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_HEADERS.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, index) => {
          const isSelected = cell.dateKey === selectedDateKey;
          const isToday = cell.dateKey === todayKey;
          const shiftCount = shiftCountByDate[cell.dateKey] ?? 0;
          const emoji = primaryEmojiByDate[cell.dateKey];
          const holidayNames = holidayNamesByDate[cell.dateKey] ?? [];
          const holidayIcons = holidayIconsByDate[cell.dateKey] ?? [];

          return (
            <Pressable
              key={`${cell.dateKey}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`${formatDayHeading(cell.dateKey)}${
                shiftCount > 0 ? `, ${shiftCount} shift${shiftCount === 1 ? '' : 's'}` : ', no shifts'
              }${holidayNames.length ? `, holiday: ${holidayNames.join(', ')}` : ''}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelectDate(cell.dateKey)}
              style={[
                styles.dayCell,
                !cell.inMonth && styles.dayCellOutside,
                isSelected && styles.dayCellSelected,
                isToday && !isSelected && styles.dayCellToday,
              ]}>
              <Text
                style={[
                  styles.dayNumber,
                  !cell.inMonth && styles.dayNumberOutside,
                  isSelected && styles.dayNumberSelected,
                ]}>
                {cell.day}
              </Text>
              {(showShiftMarkers && shiftCount > 0) || holidayNames.length > 0 ? (
                <View style={styles.markerRow}>
                  {showShiftMarkers && shiftCount > 0 ? (
                    <Text style={[styles.dayEmoji, isSelected && styles.dayEmojiSelected]}>
                      {emoji ?? '•'}
                    </Text>
                  ) : null}
                  {showShiftMarkers && shiftCount > 1 ? (
                    <Text style={[styles.moreCount, isSelected && styles.dayEmojiSelected]}>
                      +{shiftCount - 1}
                    </Text>
                  ) : null}
                  {holidayNames.length > 0 ? (
                    holidayIcons[0] ? (
                      <Text style={styles.holidayEmoji}>{holidayIcons[0]}</Text>
                    ) : (
                      <View style={styles.holidayDot} />
                    )
                  ) : null}
                </View>
              ) : (
                <View style={styles.dotSpacer} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.card,
    borderRadius: 22,
    gap: 10,
    padding: 16,
  },
  monthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthNav: {
    alignItems: 'center',
    backgroundColor: '#E4EDE8',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  monthTitle: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 20,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  weekdayLabel: {
    color: '#8FA89C',
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 0.4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    alignItems: 'center',
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    marginVertical: 2,
    width: `${100 / 7}%`,
  },
  dayCellOutside: {
    opacity: 0.45,
  },
  dayCellSelected: {
    backgroundColor: AppColors.accent,
  },
  dayCellToday: {
    borderColor: AppColors.accentGreen,
    borderWidth: 1,
  },
  dayNumber: {
    color: '#112A24',
    fontFamily: Fonts.mono,
    fontSize: 15,
    fontWeight: '600',
  },
  dayNumberOutside: {
    color: '#9AA89F',
  },
  dayNumberSelected: {
    color: '#F6EFE5',
  },
  markerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    marginTop: 1,
  },
  dayEmoji: {
    fontSize: 12,
  },
  dayEmojiSelected: {
    opacity: 0.95,
  },
  moreCount: {
    color: '#6A756F',
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
  },
  holidayDot: {
    backgroundColor: '#E46E42',
    borderRadius: 3,
    height: 5,
    width: 5,
  },
  holidayEmoji: {
    fontSize: 11,
    lineHeight: 14,
  },
  dotSpacer: {
    height: 14,
  },
});
