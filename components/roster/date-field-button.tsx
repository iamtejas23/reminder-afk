import { AppIcon as Ionicons } from '@/components/ui/app-icon';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDayHeading } from '@/lib/roster-dates';
import { Fonts } from '@/constants/theme';

type DateFieldButtonProps = {
  dateKey: string;
  label: string;
  onPress: () => void;
};

export function DateFieldButton({ dateKey, label, onPress }: DateFieldButtonProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.field}>
      <View style={styles.iconWrap}>
        <Ionicons name="calendar" size={20} color="#112A24" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.heading}>{formatDayHeading(dateKey)}</Text>
        <Text style={styles.dateKey}>{dateKey}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#6A756F" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E7DF',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#E4EDE8',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: '#6A756F',
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heading: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 17,
  },
  dateKey: {
    color: '#8FA89C',
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
});
