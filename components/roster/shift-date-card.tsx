import { AppIcon as Ionicons } from '@/components/ui/app-icon';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { getShiftKindPreset } from '@/constants/shift-style';
import { formatShiftDateRange } from '@/lib/roster-shift-dates';
import { countDaysInShiftRange, formatWeekdaysSummary } from '@/lib/roster-weekdays';
import { resolveShiftEmoji } from '@/lib/shift-style';
import { Fonts } from '@/constants/theme';
import type { RosterShift } from '@/types/roster';

type ShiftDateCardProps = {
  onEdit: () => void;
  onToggleEnabled: (enabled: boolean) => void;
  shift: RosterShift;
  showDate?: boolean;
};

export function ShiftDateCard({
  onEdit,
  onToggleEnabled,
  shift,
  showDate = true,
}: ShiftDateCardProps) {
  const emoji = resolveShiftEmoji(shift);
  const kindLabel = getShiftKindPreset(shift.kind).label;
  const dayCount = countDaysInShiftRange(shift);
  const isRange = dayCount > 1;

  return (
    <View style={[styles.card, !shift.enabled && styles.cardMuted]}>
      <View style={styles.headerRow}>
        <View style={[styles.emojiBadge, { backgroundColor: `${shift.color}22` }]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <View style={styles.titleWrap}>
          {showDate ? (
            <Text style={styles.dateLabel}>
              {formatShiftDateRange(shift)}
              {isRange ? ` · ${dayCount} days` : ''}
            </Text>
          ) : null}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{shift.name}</Text>
            <View style={[styles.kindPill, { backgroundColor: shift.color }]}>
              <Text style={styles.kindPillText}>{kindLabel}</Text>
            </View>
          </View>
          <Text style={styles.timeRange}>
            {shift.startTime} – {shift.endTime}
          </Text>
          <Text style={styles.weekdays}>{formatWeekdaysSummary(shift.weekdays)}</Text>
          {shift.notes ? <Text style={styles.notes}>{shift.notes}</Text> : null}
        </View>
        <Switch
          value={shift.enabled}
          onValueChange={onToggleEnabled}
          trackColor={{ false: '#D0BFAB', true: '#76B7A2' }}
          thumbColor={shift.enabled ? '#16362E' : '#F7F0E6'}
          ios_backgroundColor="#D0BFAB"
        />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.metaRow}>
          <Ionicons name="notifications-outline" size={14} color="#6A756F" />
          <Text style={styles.metaText}>
            {shift.notifyAtStart
              ? shift.notifyMinutesBefore === 0
                ? 'Alert at start'
                : `${shift.notifyMinutesBefore}m before`
              : 'No alert'}
          </Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onEdit} style={styles.editButton}>
          <Ionicons name="create-outline" size={16} color="#112A24" />
          <Text style={styles.editButtonText}>Edit</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(246, 239, 229, 0.97)',
    borderRadius: 18,
    gap: 12,
    padding: 16,
  },
  cardMuted: {
    opacity: 0.72,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  emojiBadge: {
    alignItems: 'center',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  emoji: {
    fontSize: 28,
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  dateLabel: {
    color: '#6A756F',
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 19,
  },
  kindPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  kindPillText: {
    color: '#F6EFE5',
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timeRange: {
    color: '#6A756F',
    fontFamily: Fonts.mono,
    fontSize: 14,
  },
  weekdays: {
    color: '#485A52',
    fontSize: 13,
  },
  notes: {
    color: '#485A52',
    fontSize: 14,
    lineHeight: 20,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  metaText: {
    color: '#6A756F',
    fontSize: 13,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: '#E4EDE8',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editButtonText: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 14,
  },
});
