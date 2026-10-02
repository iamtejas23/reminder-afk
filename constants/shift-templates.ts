import type { ShiftKind } from '@/types/roster';

export type ShiftTemplateId = 'morning' | 'evening' | 'night';

export const SHIFT_TEMPLATE_WEEKS = 2;

export type ShiftTemplateDefinition = {
  id: ShiftTemplateId;
  kind: ShiftKind;
  label: string;
  emoji: string;
  color: string;
  startTime: string;
  endTime: string;
  description: string;
};

export const SHIFT_TEMPLATES: ShiftTemplateDefinition[] = [
  {
    id: 'morning',
    kind: 'morning',
    label: 'Morning',
    emoji: '🌅',
    color: '#3B8F78',
    startTime: '07:00',
    endTime: '15:00',
    description: '7:00 AM – 3:00 PM',
  },
  {
    id: 'evening',
    kind: 'evening',
    label: 'Evening',
    emoji: '🌇',
    color: '#D48734',
    startTime: '15:00',
    endTime: '23:00',
    description: '3:00 PM – 11:00 PM',
  },
  {
    id: 'night',
    kind: 'night',
    label: 'Night',
    emoji: '🌙',
    color: '#5B7FD6',
    startTime: '23:00',
    endTime: '07:00',
    description: '11:00 PM – 7:00 AM',
  },
];

export function getShiftTemplate(id: ShiftTemplateId) {
  return SHIFT_TEMPLATES.find((template) => template.id === id) ?? SHIFT_TEMPLATES[0];
}
