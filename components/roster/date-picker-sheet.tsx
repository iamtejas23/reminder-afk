import { AppIcon as Ionicons } from '@/components/ui/app-icon';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { MonthCalendar } from '@/components/roster/month-calendar';
import { formatDateKey, formatDayHeading, parseDateKey } from '@/lib/roster-dates';
import { Fonts } from '@/constants/theme';

type DatePickerSheetProps = {
  onClose: () => void;
  onConfirm: (dateKey: string) => void;
  title: string;
  value: string;
  visible: boolean;
};

type DatePickerBodyProps = {
  onClose: () => void;
  onConfirm: (dateKey: string) => void;
  title: string;
  value: string;
};

function DatePickerBody({ onClose, onConfirm, title, value }: DatePickerBodyProps) {
  const parsed = parseDateKey(value) ?? new Date();
  const [draftDateKey, setDraftDateKey] = useState(value);
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  function selectDate(dateKey: string) {
    setDraftDateKey(dateKey);
    const next = parseDateKey(dateKey);
    if (next) {
      setViewYear(next.getFullYear());
      setViewMonth(next.getMonth());
    }
  }

  function goPrevMonth() {
    const date = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  }

  function goNextMonth() {
    const date = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  }

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={22} color="#112A24" />
        </Pressable>
      </View>

      <Text style={styles.selectedLabel}>{formatDayHeading(draftDateKey)}</Text>

      <MonthCalendar
        year={viewYear}
        month={viewMonth}
        selectedDateKey={draftDateKey}
        shiftCountByDate={{}}
        primaryEmojiByDate={{}}
        showShiftMarkers={false}
        onPrevMonth={goPrevMonth}
        onNextMonth={goNextMonth}
        onSelectDate={selectDate}
      />

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onConfirm(draftDateKey)}
          style={styles.primaryButton}>
          <Ionicons name="checkmark" size={18} color="#F6EFE5" />
          <Text style={styles.primaryButtonText}>Use this date</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => selectDate(formatDateKey(new Date()))}
        style={styles.todayButton}>
        <Ionicons name="today-outline" size={16} color="#112A24" />
        <Text style={styles.todayButtonText}>Jump to today</Text>
      </Pressable>
    </View>
  );
}

export function DatePickerSheet({
  onClose,
  onConfirm,
  title,
  value,
  visible,
}: DatePickerSheetProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        {visible ? (
          <DatePickerBody
            key={value}
            title={title}
            value={value}
            onClose={onClose}
            onConfirm={onConfirm}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(4, 18, 15, 0.6)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sheet: {
    backgroundColor: '#F6EFE5',
    borderRadius: 24,
    gap: 12,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 20,
    flex: 1,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#E4EDE8',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  selectedLabel: {
    color: '#6A756F',
    fontFamily: Fonts.mono,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#E4EDE8',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#112A24',
    borderRadius: 14,
    flex: 1.4,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#F6EFE5',
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
  todayButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 4,
    paddingTop: 2,
  },
  todayButtonText: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 15,
  },
});
