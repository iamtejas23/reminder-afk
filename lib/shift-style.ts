import { getShiftKindPreset, SHIFT_KIND_PRESETS } from '@/constants/shift-style';
import type { RosterShift, ShiftKind } from '@/types/roster';

function parseHour(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) {
    return null;
  }
  const hour = Number.parseInt(match[1], 10);
  if (hour < 0 || hour > 23) {
    return null;
  }
  return hour;
}

export function inferShiftKindFromStartTime(startTime: string): ShiftKind {
  const hour = parseHour(startTime);
  if (hour === null) {
    return 'custom';
  }

  if (hour >= 5 && hour < 12) {
    return 'morning';
  }
  if (hour >= 12 && hour < 16) {
    return 'afternoon';
  }
  if (hour >= 16 && hour < 21) {
    return 'evening';
  }
  return 'night';
}

export function inferShiftKindFromName(name: string): ShiftKind | null {
  const value = name.toLowerCase();
  if (value.includes('morning') || value.includes('sunrise')) {
    return 'morning';
  }
  if (value.includes('afternoon') || value.includes('midday')) {
    return 'afternoon';
  }
  if (value.includes('evening') || value.includes('sunset')) {
    return 'evening';
  }
  if (value.includes('night') || value.includes('overnight')) {
    return 'night';
  }
  return null;
}

export function resolveShiftEmoji(shift: Pick<RosterShift, 'emoji' | 'kind' | 'startTime' | 'name'>) {
  if (shift.emoji?.trim()) {
    return shift.emoji.trim();
  }

  const fromKind = getShiftKindPreset(shift.kind).emoji;
  if (shift.kind !== 'custom') {
    return fromKind;
  }

  const inferred = inferShiftKindFromName(shift.name) ?? inferShiftKindFromStartTime(shift.startTime);
  return getShiftKindPreset(inferred).emoji;
}

export function applyShiftKindPreset(kind: ShiftKind, current?: Partial<RosterShift>) {
  const preset = getShiftKindPreset(kind);
  const shouldRename =
    !current?.name?.trim() ||
    SHIFT_KIND_PRESETS.some((item) => item.defaultName === current.name?.trim());

  return {
    kind,
    emoji: preset.emoji,
    color: preset.color,
    startTime: current?.startTime?.trim() ? current.startTime : preset.defaultStart,
    endTime: current?.endTime?.trim() ? current.endTime : preset.defaultEnd,
    name: shouldRename ? preset.defaultName : current?.name ?? preset.defaultName,
  };
}

export function applyStartTimeAutoStyle(startTime: string, current: RosterShift) {
  if (current.kind === 'custom') {
    return {};
  }

  const kind = inferShiftKindFromStartTime(startTime);
  const preset = getShiftKindPreset(kind);

  return {
    kind,
    emoji: preset.emoji,
    color: preset.color,
  };
}
