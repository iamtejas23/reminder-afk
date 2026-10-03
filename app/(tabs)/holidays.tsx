import { AppIcon as Ionicons } from '@/components/ui/app-icon';
import { MonthCalendar } from '@/components/roster/month-calendar';
import { ScreenBackground } from '@/components/ui/screen-background';
import { AppColors } from '@/constants/app-ui';
import { Fonts } from '@/constants/theme';
import { useHolidays } from '@/hooks/use-holidays';
import { useTabBarMetrics } from '@/hooks/use-tab-bar-metrics';
import { formatDateKey, formatDayHeading } from '@/lib/roster-dates';
import type { Holiday } from '@/types/holiday';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FESTIVAL_ICONS = [
  { key: 'none', label: 'No icon', icon: '' },
  { key: 'ganesh', label: 'Ganesh Chaturthi', icon: '🐘' },
  { key: 'diwali', label: 'Diwali', icon: '🪔' },
  { key: 'holi', label: 'Holi', icon: '🎨' },
  { key: 'christmas', label: 'Christmas', icon: '🎄' },
  { key: 'independence', label: 'Independence Day', icon: '🇮🇳' },
  { key: 'republic', label: 'Republic Day', icon: '🏛️' },
  { key: 'raksha', label: 'Raksha Bandhan', icon: '🧵' },
  { key: 'eid', label: 'Eid', icon: '🌙' },
  { key: 'navratri', label: 'Navratri', icon: '🪷' },
  { key: 'dussehra', label: 'Dussehra', icon: '🏹' },
  { key: 'onam', label: 'Onam', icon: '🌼' },
  { key: 'pongal', label: 'Pongal', icon: '🍚' },
  { key: 'janmashtami', label: 'Janmashtami', icon: '🦚' },
  { key: 'baisakhi', label: 'Baisakhi', icon: '🌾' },
  { key: 'custom', label: 'Custom', icon: '' },
] as const;

export default function HolidaysScreen() {
  const store = useHolidays();
  const { scrollBottomPadding } = useTabBarMetrics();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(formatDateKey(today));
  const [name, setName] = useState('');
  const [festivalKey, setFestivalKey] = useState<string>('none');
  const [customIcon, setCustomIcon] = useState('✨');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const yearHolidays = useMemo(
    () =>
      (store.holidays ?? [])
        .filter((holiday) => holiday.date.startsWith(`${viewYear}-`))
        .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name)),
    [store.holidays, viewYear]
  );

  const holidayNamesByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const holiday of store.holidays ?? []) {
      map[holiday.date] = [...(map[holiday.date] ?? []), holiday.name];
    }
    return map;
  }, [store.holidays]);

  const holidayIconsByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const holiday of store.holidays ?? []) {
      map[holiday.date] = [...(map[holiday.date] ?? []), holiday.icon ?? ''];
    }
    return map;
  }, [store.holidays]);

  function showYear(year: number) {
    const date = new Date(year, 0, 1);
    setViewYear(year);
    setViewMonth(0);
    setSelectedDate(formatDateKey(date));
    setName('');
    setFestivalKey('none');
    setCustomIcon('✨');
    setEditingId(null);
    setFormError(null);
  }

  function changeMonth(delta: number) {
    const date = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
    setSelectedDate(formatDateKey(date));
    setName('');
    setFestivalKey('none');
    setCustomIcon('✨');
    setEditingId(null);
    setFormError(null);
  }

  function selectDate(dateKey: string) {
    setSelectedDate(dateKey);
    const date = new Date(`${dateKey}T12:00:00`);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
    setEditingId(null);
    setName('');
    setFestivalKey('none');
    setCustomIcon('✨');
    setFormError(null);
  }

  async function save() {
    const cleanName = name.trim();
    if (!cleanName) {
      setFormError('Add a name for this holiday.');
      return;
    }
    if (cleanName.length > 60) {
      setFormError('Keep the holiday name to 60 characters or fewer.');
      return;
    }
    if (
      yearHolidays.some(
        (holiday) =>
          holiday.id !== editingId &&
          holiday.date === selectedDate &&
          holiday.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase()
      )
    ) {
      setFormError('That holiday is already added for this date.');
      return;
    }

    const holiday: Holiday = {
      id: editingId ?? `holiday-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: cleanName,
      date: selectedDate,
      icon:
        festivalKey === 'none'
          ? undefined
          : festivalKey === 'custom'
            ? customIcon.trim()
            : FESTIVAL_ICONS.find((item) => item.key === festivalKey)?.icon,
    };
    if (await store.saveHoliday(holiday)) {
      setName('');
      setFestivalKey('none');
      setEditingId(null);
      setFormError(null);
    }
  }

  function editHoliday(holiday: Holiday) {
    setEditingId(holiday.id);
    setName(holiday.name);
    const savedIcon = holiday.icon ?? '';
    const matchingFestival = FESTIVAL_ICONS.find(
      (item) => item.key !== 'custom' && item.key !== 'none' && item.icon === savedIcon
    );
    setFestivalKey(matchingFestival?.key ?? (savedIcon ? 'custom' : 'none'));
    setCustomIcon(savedIcon || '✨');
    setSelectedDate(holiday.date);
    const date = new Date(`${holiday.date}T12:00:00`);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
    setFormError(null);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScreenBackground>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPadding }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.eyebrowRow}>
              <Ionicons name="sunny" size={20} color={AppColors.mint} />
              <Text style={styles.eyebrow}>Your calendar</Text>
            </View>
            <Text style={styles.title}>Holidays, marked.</Text>
            <Text style={styles.subtitle}>
              Add the days that matter to you. They’ll be marked on your roster calendar and stay
              saved on this device.
            </Text>
          </View>

          <View style={styles.yearCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Show ${viewYear - 1}`}
              onPress={() => showYear(viewYear - 1)}
              style={styles.yearArrow}>
              <Ionicons name="chevron-back" size={20} color={AppColors.cream} />
            </Pressable>
            <View style={styles.yearCenter}>
              <Text style={styles.year}>{viewYear}</Text>
              <Text style={styles.yearMeta}>
                {yearHolidays.length} saved holiday{yearHolidays.length === 1 ? '' : 's'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Show ${viewYear + 1}`}
              onPress={() => showYear(viewYear + 1)}
              style={styles.yearArrow}>
              <Ionicons name="chevron-forward" size={20} color={AppColors.cream} />
            </Pressable>
          </View>

          {!store.isReady ? (
            <View style={styles.loading}>
              <ActivityIndicator color={AppColors.mint} />
            </View>
          ) : (
            <>
              <MonthCalendar
                year={viewYear}
                month={viewMonth}
                selectedDateKey={selectedDate}
                shiftCountByDate={{}}
                primaryEmojiByDate={{}}
                holidayNamesByDate={holidayNamesByDate}
                holidayIconsByDate={holidayIconsByDate}
                showShiftMarkers={false}
                onPrevMonth={() => changeMonth(-1)}
                onNextMonth={() => changeMonth(1)}
                onSelectDate={selectDate}
              />

              <View style={styles.formCard}>
                <View style={styles.selectedDateRow}>
                  <Ionicons name="calendar-outline" size={18} color="#B94E2B" />
                  <Text style={styles.selectedDate}>{formatDayHeading(selectedDate)}</Text>
                </View>
                <Text style={styles.inputLabel}>{editingId ? 'Edit holiday' : 'Holiday name'}</Text>
                <TextInput
                  accessibilityLabel="Holiday name"
                  autoCapitalize="words"
                  maxLength={60}
                  onChangeText={(value) => {
                    setName(value);
                    setFormError(null);
                  }}
                  onSubmitEditing={() => void save()}
                  placeholder="e.g. Diwali, Family day"
                  placeholderTextColor="#89968F"
                  returnKeyType="done"
                  style={styles.input}
                  value={name}
                />
                <Text style={styles.inputLabel}>Festival icon (optional)</Text>
                <View
                  accessibilityLabel="Festival icon options"
                  accessibilityRole="radiogroup"
                  style={styles.iconGrid}>
                  {FESTIVAL_ICONS.map((item) => {
                    const selected = festivalKey === item.key;
                    return (
                      <Pressable
                        key={item.key}
                        accessibilityRole="radio"
                        accessibilityLabel={item.key === 'custom' ? 'Custom festive icon' : item.label}
                        accessibilityState={{ checked: selected }}
                        aria-checked={selected}
                        onPress={() => setFestivalKey(item.key)}
                        style={[styles.iconOption, selected && styles.iconOptionSelected]}>
                        {item.key === 'custom' ? (
                          <Ionicons
                            name="create-outline"
                            size={17}
                            color={selected ? AppColors.cream : '#52645B'}
                          />
                        ) : item.icon ? (
                          <Text style={styles.iconOptionEmoji}>{item.icon}</Text>
                        ) : (
                          <Ionicons name="close-circle-outline" size={17} color="#52645B" />
                        )}
                        <Text
                          numberOfLines={2}
                          style={[styles.iconOptionLabel, selected && styles.iconOptionLabelSelected]}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {festivalKey === 'custom' ? (
                  <View style={styles.customIconRow}>
                    <Text style={styles.customIconPreview}>{customIcon || '✨'}</Text>
                    <TextInput
                      accessibilityLabel="Custom festive emoji or symbol"
                      autoCapitalize="none"
                      maxLength={8}
                      onChangeText={setCustomIcon}
                      placeholder="Type or paste an emoji"
                      placeholderTextColor="#89968F"
                      style={[styles.input, styles.customIconInput]}
                      value={customIcon}
                    />
                  </View>
                ) : null}
                {formError || store.error ? (
                  <Text accessibilityRole="alert" style={styles.error}>
                    {formError ?? store.error}
                  </Text>
                ) : null}
                <View style={styles.formActions}>
                  {editingId ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        setEditingId(null);
                        setName('');
                        setFestivalKey('none');
                        setFormError(null);
                      }}
                      style={styles.cancelButton}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void save()}
                    style={styles.saveButton}>
                    <Ionicons name={editingId ? 'checkmark' : 'add'} size={19} color={AppColors.cream} />
                    <Text style={styles.saveText}>{editingId ? 'Save changes' : 'Add holiday'}</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>{viewYear} holidays</Text>
                {yearHolidays.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="sunny-outline" size={26} color="#9AB3A9" />
                    <Text style={styles.emptyTitle}>A fresh year</Text>
                    <Text style={styles.emptyText}>Choose a date above and add your first holiday.</Text>
                  </View>
                ) : (
                  <View style={styles.holidayList}>
                    {yearHolidays.map((holiday) => (
                      <View key={holiday.id} style={styles.holidayRow}>
                        <View style={styles.holidayIcon}>
                          {holiday.icon ? (
                            <Text style={styles.holidayIconEmoji}>{holiday.icon}</Text>
                          ) : (
                            <Ionicons name="sunny" size={19} color="#B94E2B" />
                          )}
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${holiday.name}${holiday.icon ? `, ${holiday.icon}` : ''}, ${formatDayHeading(holiday.date)}`}
                          onPress={() => editHoliday(holiday)}
                          style={styles.holidayDetails}>
                          <Text style={styles.holidayName}>{holiday.name}</Text>
                          <Text style={styles.holidayDate}>{formatDayHeading(holiday.date)}</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${holiday.name}`}
                          onPress={() => void store.removeHoliday(holiday.id)}
                          style={styles.deleteButton}>
                          <Ionicons name="trash-outline" size={19} color="#7D3C22" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: AppColors.canvas, flex: 1 },
  scroll: { gap: 16, paddingHorizontal: 18, paddingTop: 10 },
  header: { gap: 8, marginTop: 8 },
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  eyebrow: {
    color: AppColors.mint,
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: { color: AppColors.cream, fontFamily: Fonts.rounded, fontSize: 32, lineHeight: 38 },
  subtitle: { color: '#D0D9D4', fontSize: 15, lineHeight: 22 },
  yearCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 239, 229, 0.15)',
    borderColor: AppColors.cardBorder,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  yearArrow: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 239, 229, 0.12)',
    borderRadius: 99,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  yearCenter: { alignItems: 'center', gap: 2 },
  year: { color: AppColors.cream, fontFamily: Fonts.rounded, fontSize: 25 },
  yearMeta: { color: AppColors.muted, fontSize: 13 },
  loading: { alignItems: 'center', minHeight: 180, justifyContent: 'center' },
  formCard: { backgroundColor: AppColors.card, borderRadius: 20, gap: 10, padding: 16 },
  selectedDateRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  selectedDate: { color: '#40544B', flex: 1, fontFamily: Fonts.rounded, fontSize: 15 },
  inputLabel: { color: '#65736C', fontFamily: Fonts.mono, fontSize: 11, letterSpacing: 1.1 },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E7DF',
    borderRadius: 13,
    borderWidth: 1,
    color: '#102A27',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 13,
  },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E1DB',
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: '48%',
    flexDirection: 'row',
    flexGrow: 1,
    gap: 7,
    minHeight: 42,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  iconOptionSelected: { backgroundColor: AppColors.canvas, borderColor: AppColors.canvas },
  iconOptionEmoji: { fontSize: 17, textAlign: 'center', width: 20 },
  iconOptionLabel: { color: '#43564C', flex: 1, fontSize: 12, lineHeight: 15 },
  iconOptionLabelSelected: { color: AppColors.cream, fontFamily: Fonts.rounded },
  customIconRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  customIconPreview: { fontSize: 24, minWidth: 34, textAlign: 'center' },
  customIconInput: { flex: 1, minWidth: 0 },
  error: { color: '#9E3929', fontSize: 13, lineHeight: 18 },
  formActions: { alignItems: 'center', flexDirection: 'row', gap: 9, justifyContent: 'flex-end' },
  cancelButton: { borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12 },
  cancelText: { color: '#57675F', fontFamily: Fonts.rounded, fontSize: 15 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: AppColors.canvas,
    borderRadius: 13,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 16,
  },
  saveText: { color: AppColors.cream, fontFamily: Fonts.rounded, fontSize: 15 },
  listSection: { gap: 11 },
  sectionTitle: { color: AppColors.cream, fontFamily: Fonts.rounded, fontSize: 21 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 239, 229, 0.12)',
    borderColor: AppColors.cardBorder,
    borderRadius: 18,
    borderWidth: 1,
    gap: 7,
    padding: 22,
  },
  emptyTitle: { color: AppColors.cream, fontFamily: Fonts.rounded, fontSize: 17 },
  emptyText: { color: AppColors.muted, fontSize: 14, textAlign: 'center' },
  holidayList: { gap: 9 },
  holidayRow: {
    alignItems: 'center',
    backgroundColor: AppColors.card,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 11,
    padding: 12,
  },
  holidayIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(228, 110, 66, 0.15)',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  holidayIconEmoji: { fontSize: 22 },
  holidayDetails: { flex: 1, gap: 3, minWidth: 0 },
  holidayName: { color: '#102A27', fontFamily: Fonts.rounded, fontSize: 16 },
  holidayDate: { color: '#67756E', fontSize: 13 },
  deleteButton: {
    alignItems: 'center',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
