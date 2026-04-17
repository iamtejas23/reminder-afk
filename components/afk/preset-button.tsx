import { Pressable, StyleSheet, Text } from 'react-native';

import { Fonts } from '@/constants/theme';

type PresetButtonProps = {
  active: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
};

export function PresetButton({ active, disabled, label, onPress }: PresetButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, active && styles.buttonActive, disabled && styles.buttonDisabled]}>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#EFE4D3',
    borderColor: '#D0BFAB',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonActive: {
    backgroundColor: '#16362E',
    borderColor: '#16362E',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  label: {
    color: '#173029',
    fontFamily: Fonts.mono,
    fontSize: 14,
    textAlign: 'center',
  },
  labelActive: {
    color: '#F6EFE5',
  },
});
