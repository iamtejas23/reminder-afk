import * as Haptics from 'expo-haptics';
import { Pressable, type PressableProps } from 'react-native';

export function HapticTab(props: PressableProps) {
  return (
    <Pressable
      {...props}
      onPressIn={(event) => {
        if (process.env.EXPO_OS === 'ios') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(event);
      }}
    />
  );
}
