import { AppIcon as Ionicons } from '@/components/ui/app-icon';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MonthCalendar } from '@/components/roster/month-calendar';
import { ShiftDateCard } from '@/components/roster/shift-date-card';
import { ShiftEditorModal } from '@/components/roster/shift-editor-modal';
import { RosterBackupModal } from '@/components/roster/roster-backup-modal';
import { RosterMonthBackupBar } from '@/components/roster/roster-month-backup-bar';
import { ShiftTemplatePanel } from '@/components/roster/shift-template-panel';
import { ScreenBackground } from '@/components/ui/screen-background';
import { AppColors } from '@/constants/app-ui';
import { useRoster } from '@/hooks/use-roster';
import { useHolidays } from '@/hooks/use-holidays';
import { useTabBarMetrics } from '@/hooks/use-tab-bar-metrics';
import {
  compareDateKeys,
  formatDateKey,
  formatDayHeading,
  formatMonthYear,
  parseDateKey,
} from '@/lib/roster-dates';
import {
  eachShiftOccurrenceDateKeys,
  shiftOccursOnDate,
  shiftOverlapsMonth,
} from '@/lib/roster-weekdays';
import { resolveShiftEmoji } from '@/lib/shift-style';
import { Fonts } from '@/constants/theme';
import type { RosterShift } from '@/types/roster';

export default function RosterScreen() {
  const roster = useRoster();
  const holidayStore = useHolidays();
  const { scrollBottomPadding } = useTabBarMetrics();
  const [editingId, setEditingId] = useState<string | null>(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(today));
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);

  const editingShift = useMemo(
    () => roster.data?.shifts.find((shift) => shift.id === editingId) ?? null,
    [editingId, roster.data?.shifts]
  );

  const shiftCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const shift of roster.data?.shifts ?? []) {
      for (const dateKey of eachShiftOccurrenceDateKeys(shift)) {
        counts[dateKey] = (counts[dateKey] ?? 0) + 1;
      }
    }
    return counts;
  }, [roster.data?.shifts]);

  const primaryEmojiByDate = useMemo(() => {
    const map: Record<string, string> = {};
    for (const shift of roster.data?.shifts ?? []) {
      for (const dateKey of eachShiftOccurrenceDateKeys(shift)) {
        if (!map[dateKey]) {
          map[dateKey] = resolveShiftEmoji(shift);
        }
      }
    }
    return map;
  }, [roster.data?.shifts]);

  const holidayNamesByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const holiday of holidayStore.holidays ?? []) {
      map[holiday.date] = [...(map[holiday.date] ?? []), holiday.name];
    }
    return map;
  }, [holidayStore.holidays]);

  const holidayIconsByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const holiday of holidayStore.holidays ?? []) {
      map[holiday.date] = [...(map[holiday.date] ?? []), holiday.icon ?? ''];
    }
    return map;
  }, [holidayStore.holidays]);

  const monthShifts = useMemo(() => {
    return (roster.data?.shifts ?? [])
      .filter((shift) => shiftOverlapsMonth(shift, viewYear, viewMonth))
      .sort((a, b) => compareDateKeys(a.date, b.date));
  }, [roster.data?.shifts, viewMonth, viewYear]);

  const selectedDayShifts = useMemo(
    () =>
      (roster.data?.shifts ?? [])
        .filter((shift) => shiftOccursOnDate(shift, selectedDateKey))
        .sort((a, b) => compareDateKeys(a.date, b.date)),
    [roster.data?.shifts, selectedDateKey]
  );


  function patchEditingShift(patch: Partial<RosterShift>) {
    if (!editingId) {
      return;
    }
    void roster.updateShift(editingId, patch);
  }

  function goPrevMonth() {
    const date = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
    setSelectedDateKey(formatDateKey(date));
  }

  function goNextMonth() {
    const date = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
    setSelectedDateKey(formatDateKey(date));
  }

  async function restoreFromBackup(text: string): Promise<boolean | string> {
    const result = await roster.importRosterBackup(text);
    if (!result.ok) {
      Alert.alert('Restore failed', result.message);
      return result.message;
    }

    setRestoreModalVisible(false);
    Alert.alert('Roster restored', result.message);
    return true;
  }

  function selectDate(dateKey: string) {
    setSelectedDateKey(dateKey);
    const parsed = parseDateKey(dateKey);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }

  if (!roster.isReady) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="light" />
        <View style={styles.loading}>
          <ActivityIndicator color={AppColors.accent} />
        </View>
      </SafeAreaView>
    );
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
              <Ionicons name="calendar" size={22} color={AppColors.mint} />
              <Text style={styles.eyebrow}>Shift roster</Text>
            </View>
            <Text style={styles.title}>Plan by date{'\n'}and month.</Text>
            <Text style={styles.subtitle}>
              Pick a date range, then choose which days repeat (weekdays, Sat–Sun, or any custom
              mix).
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryMonth}>{formatMonthYear(viewYear, viewMonth)}</Text>
            <Text style={styles.summaryMeta}>
              {monthShifts.length} shift{monthShifts.length === 1 ? '' : 's'} ·{' '}
              {roster.data?.remindersEnabled ? 'Alerts on' : 'Alerts off'}
            </Text>
          </View>

          <MonthCalendar
            year={viewYear}
            month={viewMonth}
            selectedDateKey={selectedDateKey}
            shiftCountByDate={shiftCountByDate}
            primaryEmojiByDate={primaryEmojiByDate}
            holidayNamesByDate={holidayNamesByDate}
            holidayIconsByDate={holidayIconsByDate}
            onPrevMonth={goPrevMonth}
            onNextMonth={goNextMonth}
            onSelectDate={selectDate}
          />

          {roster.data ? (
            <RosterMonthBackupBar
              data={roster.data}
              month={viewMonth}
              shiftCount={monthShifts.length}
              year={viewYear}
              onOpenRestore={() => setRestoreModalVisible(true)}
            />
          ) : null}

          <ShiftTemplatePanel
            onApplyAll={(startDateKey, weekOffDays) =>
              void roster.applyAllShiftTemplates(startDateKey, weekOffDays)
            }
            onApplyOne={(templateId, startDateKey, weekOffDays) =>
              void roster.applyShiftTemplate(templateId, startDateKey, weekOffDays)
            }
          />

          {roster.syncMessage ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void roster.resyncNotifications()}
              style={styles.banner}>
              <Ionicons name="information-circle-outline" size={18} color="#7D3C22" />
              <Text style={styles.bannerText}>{roster.syncMessage}</Text>
            </Pressable>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{formatDayHeading(selectedDateKey)}</Text>
            {(holidayStore.holidays ?? [])
              .filter((holiday) => holiday.date === selectedDateKey)
              .map((holiday) => (
              <View key={holiday.id} style={styles.holidayBanner}>
                {holiday.icon ? (
                  <Text style={styles.holidayBannerIcon}>{holiday.icon}</Text>
                ) : (
                  <Ionicons name="sunny" size={18} color="#B94E2B" />
                )}
                <Text style={styles.holidayBannerText}>{holiday.name}</Text>
                <Text style={styles.holidayLabel}>HOLIDAY</Text>
              </View>
            ))}
            {selectedDayShifts.length === 0 ? (
              <View style={styles.emptyDay}>
                <Ionicons name="sunny-outline" size={22} color="#9AB3A9" />
                <Text style={styles.emptyDayText}>No shifts on this date yet.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {selectedDayShifts.map((shift) => (
                  <ShiftDateCard
                    key={shift.id}
                    shift={shift}
                    showDate={false}
                    onEdit={() => setEditingId(shift.id)}
                    onToggleEnabled={(enabled) => void roster.updateShift(shift.id, { enabled })}
                  />
                ))}
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={() => void roster.addShift(selectedDateKey)}
              style={styles.addButton}>
              <Ionicons name="add-circle" size={20} color="#F5F2E9" />
              <Text style={styles.addButtonText}>Add shift on this day</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Month schedule</Text>
            {monthShifts.length === 0 ? (
              <Text style={styles.emptyMonth}>No shifts scheduled this month.</Text>
            ) : (
              <View style={styles.list}>
                {monthShifts.map((shift) => (
                  <ShiftDateCard
                    key={shift.id}
                    shift={shift}
                    showDate
                    onEdit={() => setEditingId(shift.id)}
                    onToggleEnabled={(enabled) => void roster.updateShift(shift.id, { enabled })}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </ScreenBackground>

      <RosterBackupModal
        hint={`Restores this month’s shifts when you paste a month backup for ${formatMonthYear(viewYear, viewMonth)}.`}
        title="Restore roster backup"
        visible={restoreModalVisible}
        onClose={() => setRestoreModalVisible(false)}
        onImport={restoreFromBackup}
      />

      {editingShift ? (
        <ShiftEditorModal
          visible={Boolean(editingShift)}
          shift={editingShift}
          onClose={() => setEditingId(null)}
          onSave={patchEditingShift}
          onDelete={() => {
            void roster.removeShift(editingShift.id);
            setEditingId(null);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.canvas,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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
  subtitle: {
    color: '#D0D9D4',
    fontSize: 15,
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: 'rgba(246, 239, 229, 0.18)',
    borderColor: AppColors.cardBorder,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryMonth: {
    color: AppColors.cream,
    fontFamily: Fonts.rounded,
    fontSize: 18,
  },
  summaryMeta: {
    color: AppColors.muted,
    fontSize: 14,
  },
  banner: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(246, 239, 229, 0.92)',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },
  bannerText: {
    color: '#7D3C22',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  holidayBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(228, 110, 66, 0.16)',
    borderColor: 'rgba(228, 110, 66, 0.35)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  holidayBannerText: {
    color: AppColors.cream,
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 15,
  },
  holidayBannerIcon: {
    fontSize: 18,
  },
  holidayLabel: {
    color: AppColors.accent,
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: AppColors.cream,
    fontFamily: Fonts.rounded,
    fontSize: 20,
  },
  list: {
    gap: 10,
  },
  emptyDay: {
    alignItems: 'center',
    backgroundColor: AppColors.card,
    borderRadius: 18,
    gap: 8,
    paddingVertical: 22,
  },
  emptyDayText: {
    color: '#6A756F',
    fontSize: 15,
  },
  emptyMonth: {
    color: AppColors.muted,
    fontSize: 15,
    paddingVertical: 8,
  },
  monthGroup: {
    gap: 8,
  },
  monthGroupDate: {
    color: AppColors.mint,
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#16362E',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  addButtonText: {
    color: '#F5F2E9',
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
});
