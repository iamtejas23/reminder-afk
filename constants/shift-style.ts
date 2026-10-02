import type { ShiftKind } from '@/types/roster';

export type ShiftKindPreset = {
  kind: ShiftKind;
  label: string;
  emoji: string;
  defaultName: string;
  defaultStart: string;
  defaultEnd: string;
  color: string;
};

export const SHIFT_KIND_PRESETS: ShiftKindPreset[] = [
  {
    kind: 'morning',
    label: 'Morning',
    emoji: '🌅',
    defaultName: 'Morning shift',
    defaultStart: '07:00',
    defaultEnd: '15:00',
    color: '#3B8F78',
  },
  {
    kind: 'afternoon',
    label: 'Afternoon',
    emoji: '☀️',
    defaultName: 'Afternoon shift',
    defaultStart: '12:00',
    defaultEnd: '18:00',
    color: '#E46E42',
  },
  {
    kind: 'evening',
    label: 'Evening',
    emoji: '🌇',
    defaultName: 'Evening shift',
    defaultStart: '15:00',
    defaultEnd: '23:00',
    color: '#D48734',
  },
  {
    kind: 'night',
    label: 'Night',
    emoji: '🌙',
    defaultName: 'Night shift',
    defaultStart: '23:00',
    defaultEnd: '07:00',
    color: '#5B7FD6',
  },
  {
    kind: 'custom',
    label: 'Custom',
    emoji: '✨',
    defaultName: 'Custom shift',
    defaultStart: '09:00',
    defaultEnd: '17:00',
    color: '#9B6BCC',
  },
];

export const SHIFT_EMOJI_OPTIONS = [
  '🌅',
  '☀️',
  '🌇',
  '🌆',
  '🌙',
  '⭐',
  '🌤️',
  '💼',
  '🏥',
  '🛠️',
  '🚑',
  '🏫',
  '🍽️',
  '✨',
  '🔔',
] as const;

export const SHIFT_KIND_ORDER: ShiftKind[] = [
  'morning',
  'afternoon',
  'evening',
  'night',
  'custom',
];

export function getShiftKindPreset(kind: ShiftKind) {
  return SHIFT_KIND_PRESETS.find((preset) => preset.kind === kind) ?? SHIFT_KIND_PRESETS[4];
}
