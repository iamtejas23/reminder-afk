import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DateFieldButton } from '@/components/roster/date-field-button';
import { DatePickerSheet } from '@/components/roster/date-picker-sheet';
import { WeekdaySelector } from '@/components/roster/weekday-selector';
import {
  SHIFT_TEMPLATES,
  SHIFT_TEMPLATE_WEEKS,
  type ShiftTemplateId,
} from '@/constants/shift-templates';
import { AppColors } from '@/constants/app-ui';
import { formatDateKey } from '@/lib/roster-dates';
import {
  countWorkingDaysInTemplateRange,
  normalizeWeekOffDays,
} from '@/lib/generate-shift-template';
import { WEEKDAY_PRESET_WEEKEND } from '@/lib/roster-weekdays';
import { Fonts } from '@/constants/theme';
import type { Weekday } from '@/types/roster';

type ShiftTemplatePanelProps = {
  onApplyAll: (startDateKey: string, weekOffDays: Weekday[]) => void | Promise<void>;
  onApplyOne: (
    templateId: ShiftTemplateId,
    startDateKey: string,
    weekOffDays: Weekday[]
  ) => void | Promise<void>;
};

export function ShiftTemplatePanel({ onApplyAll, onApplyOne }: ShiftTemplatePanelProps) {
  const [startDateKey, setStartDateKey] = useState(formatDateKey(new Date()));
  const [weekOffDays, setWeekOffDays] = useState<Weekday[]>(WEEKDAY_PRESET_WEEKEND);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [offMode, setOffMode] = useState<'weekend' | 'custom'>('weekend');
  const [applyingAll, setApplyingAll] = useState(false);
  const [applyingOneId, setApplyingOneId] = useState<ShiftTemplateId | null>(null);

  const workingDays = countWorkingDaysInTemplateRange(startDateKey, weekOffDays);

  function setWeekendOff() {
    setOffMode('weekend');
    setWeekOffDays(WEEKDAY_PRESET_WEEKEND);
  }

  function setCustomOff(days: Weekday[]) {
    setOffMode('custom');
    setWeekOffDays(normalizeWeekOffDays(days));
  }

  async function handleApplyOne(templateId: ShiftTemplateId) {
    if (applyingOneId || applyingAll) {
      return;
    }

    setApplyingOneId(templateId);
    try {
      await onApplyOne(templateId, startDateKey, weekOffDays);
    } finally {
      setApplyingOneId(null);
    }
  }

  async function handleApplyAll() {
    if (applyingAll || applyingOneId) {
      return;
    }

    setApplyingAll(true);
    try {
      await onApplyAll(startDateKey, weekOffDays);
    } finally {
      setApplyingAll(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="duplicate-outline" size={20} color="#112A24" />
        <Text style={styles.title}>2-week shift templates</Text>
      </View>
      <Text style={styles.subtitle}>
        Standard 5-day work / 2-day off pattern for {SHIFT_TEMPLATE_WEEKS} weeks. Pick Sat–Sun off or
        choose your own weekoffs.
      </Text>

      <DateFieldButton
        label="Template starts"
        dateKey={startDateKey}
        onPress={() => setShowStartPicker(true)}
      />

      <Text style={styles.label}>Week off days</Text>
      <View style={styles.offModeRow}>
        <Pressable
          accessibilityRole="button"
          onPress={setWeekendOff}
          style={[styles.offModeChip, offMode === 'weekend' && styles.offModeChipActive]}>
          <Text
            style={[styles.offModeText, offMode === 'weekend' && styles.offModeTextActive]}>
            Sat & Sun off
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setOffMode('custom')}
          style={[styles.offModeChip, offMode === 'custom' && styles.offModeChipActive]}>
          <Text style={[styles.offModeText, offMode === 'custom' && styles.offModeTextActive]}>
            Custom weekoffs
          </Text>
        </Pressable>
      </View>

      {offMode === 'custom' ? (
        <WeekdayOffSelector weekOffDays={weekOffDays} onChange={setCustomOff} />
      ) : (
        <Text style={styles.hint}>Working days: Mon – Fri each week</Text>
      )}

      <Text style={styles.stats}>
        {workingDays} scheduled days across {SHIFT_TEMPLATE_WEEKS} weeks
      </Text>

      <View style={styles.templateList}>
        {SHIFT_TEMPLATES.map((template) => (
          <View key={template.id} style={styles.templateRow}>
            <View style={styles.templateCopy}>
              <Text style={styles.templateEmoji}>{template.emoji}</Text>
              <View>
                <Text style={styles.templateName}>{template.label}</Text>
                <Text style={styles.templateTime}>{template.description}</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={applyingOneId !== null || applyingAll}
              onPress={() => void handleApplyOne(template.id)}
              style={[
                styles.applyOneButton,
                (applyingOneId !== null || applyingAll) && styles.applyOneButtonDisabled,
              ]}>
              <Text style={styles.applyOneText}>
                {applyingOneId === template.id ? 'Applying…' : 'Apply'}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={applyingAll || applyingOneId !== null}
        onPress={() => void handleApplyAll()}
        style={[styles.applyAllButton, applyingAll && styles.applyAllButtonDisabled]}>
        <Ionicons name="layers-outline" size={18} color="#F6EFE5" />
        <Text style={styles.applyAllText}>
          {applyingAll
            ? 'Applying rotation…'
            : 'Apply all 3 (rotate from start date, 2 weeks)'}
        </Text>
      </Pressable>

      <DatePickerSheet
        visible={showStartPicker}
        title="Template start date"
        value={startDateKey}
        onClose={() => setShowStartPicker(false)}
        onConfirm={(dateKey) => {
          setStartDateKey(dateKey);
          setShowStartPicker(false);
        }}
      />
    </View>
  );
}

type WeekdayOffSelectorProps = {
  onChange: (weekOffDays: Weekday[]) => void;
  weekOffDays: Weekday[];
};

function WeekdayOffSelector({ onChange, weekOffDays }: WeekdayOffSelectorProps) {
  const offs = normalizeWeekOffDays(weekOffDays);

  return (
    <View style={styles.offWrap}>
      <Text style={styles.hint}>Tap days you are OFF (usually 2 per week)</Text>
      <WeekdaySelector
        accentColor={AppColors.accent}
        showPresets={false}
        summaryPrefix="Off:"
        weekdays={offs}
        onChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.card,
    borderRadius: 22,
    gap: 12,
    padding: 16,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 20,
  },
  subtitle: {
    color: '#6A756F',
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    color: '#6A756F',
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  offModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  offModeChip: {
    backgroundColor: '#E4EDE8',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  offModeChipActive: {
    backgroundColor: '#112A24',
  },
  offModeText: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 14,
  },
  offModeTextActive: {
    color: '#F6EFE5',
  },
  hint: {
    color: '#6A756F',
    fontSize: 13,
  },
  offWrap: {
    gap: 6,
  },
  stats: {
    color: '#112A24',
    fontFamily: Fonts.mono,
    fontSize: 13,
  },
  templateList: {
    gap: 10,
  },
  templateRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E7DF',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  templateCopy: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  templateEmoji: {
    fontSize: 26,
  },
  templateName: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 17,
  },
  templateTime: {
    color: '#6A756F',
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
  applyOneButton: {
    backgroundColor: '#16362E',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  applyOneButtonDisabled: {
    opacity: 0.5,
  },
  applyOneText: {
    color: '#F6EFE5',
    fontFamily: Fonts.rounded,
    fontSize: 14,
  },
  applyAllButton: {
    alignItems: 'center',
    backgroundColor: '#112A24',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  applyAllButtonDisabled: {
    opacity: 0.65,
  },
  applyAllText: {
    color: '#F6EFE5',
    fontFamily: Fonts.rounded,
    fontSize: 15,
  },
});
