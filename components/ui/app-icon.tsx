import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { useSyncExternalStore, type ComponentProps } from 'react';
import { Platform, View } from 'react-native';

type AppIconProps = ComponentProps<typeof ExpoIonicons>;

let isWebHydrated = false;
const hydrationListeners = new Set<() => void>();

function subscribeToHydration(onChange: () => void) {
  hydrationListeners.add(onChange);
  if (Platform.OS === 'web' && !isWebHydrated) {
    isWebHydrated = true;
    hydrationListeners.forEach((listener) => listener());
  }
  return () => hydrationListeners.delete(onChange);
}

function getHydrationSnapshot() {
  return Platform.OS !== 'web' || isWebHydrated;
}

function getServerHydrationSnapshot() {
  return Platform.OS !== 'web';
}

export function AppIcon(props: AppIconProps) {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot
  );

  if (!isHydrated) {
    const size = props.size ?? 24;
    return <View style={{ height: size, width: size }} />;
  }

  return <ExpoIonicons {...props} />;
}
