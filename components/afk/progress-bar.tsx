import { StyleSheet, Text, View } from 'react-native';

type ProgressBarProps = {
  label: string;
  progress: number;
};

export function ProgressBar({ label, progress }: ProgressBarProps) {
  const safeProgress = Math.max(0, Math.min(1, progress));

  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ now: safeProgress * 100, min: 0, max: 100 }}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${safeProgress * 100}%` }]} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: '#D7C6B3',
    borderRadius: 999,
    height: 14,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: '#E46E42',
    borderRadius: 999,
    height: '100%',
  },
  label: {
    color: '#5D6A64',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'right',
  },
});
