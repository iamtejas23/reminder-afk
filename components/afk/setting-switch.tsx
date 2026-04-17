import { StyleSheet, Switch, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';

type SettingSwitchProps = {
  description: string;
  label: string;
  onValueChange: (nextValue: boolean) => void | Promise<void>;
  value: boolean;
};

export function SettingSwitch({
  description,
  label,
  onValueChange,
  value,
}: SettingSwitchProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copyWrap}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        trackColor={{ false: '#D0BFAB', true: '#76B7A2' }}
        thumbColor={value ? '#16362E' : '#F7F0E6'}
        ios_backgroundColor="#D0BFAB"
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  copyWrap: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: '#112A24',
    fontFamily: Fonts.rounded,
    fontSize: 18,
  },
  description: {
    color: '#485A52',
    fontSize: 14,
    lineHeight: 20,
  },
});
