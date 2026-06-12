import { NativeModules, Platform } from 'react-native';

type AfkTimerNotificationModule = {
  start(endAtMs: number, durationMinutes: number): Promise<void>;
  stop(): Promise<void>;
};

const nativeTimerNotification = NativeModules.AfkTimerNotification as
  | AfkTimerNotificationModule
  | undefined;

export async function startAfkTimerNotificationAsync({
  durationMinutes,
  endAtMs,
}: {
  durationMinutes: number;
  endAtMs: number;
}): Promise<void> {
  if (Platform.OS !== 'android' || !nativeTimerNotification) {
    return;
  }

  await nativeTimerNotification.start(endAtMs, durationMinutes);
}

export async function stopAfkTimerNotificationAsync(): Promise<void> {
  if (Platform.OS !== 'android' || !nativeTimerNotification) {
    return;
  }

  await nativeTimerNotification.stop();
}
