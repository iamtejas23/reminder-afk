import { StyleSheet, View, type ViewStyle } from 'react-native';

import { AppColors } from '@/constants/app-ui';

type ScreenBackgroundProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function ScreenBackground({ children, style }: ScreenBackgroundProps) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.orbLarge} pointerEvents="none" />
      <View style={styles.orbSmall} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AppColors.canvas,
  },
  orbLarge: {
    position: 'absolute',
    top: -40,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(59, 143, 120, 0.28)',
  },
  orbSmall: {
    position: 'absolute',
    bottom: 120,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(228, 110, 66, 0.2)',
  },
});
