import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type ExpoNotificationsModule = typeof import('expo-notifications');

let cachedModule: ExpoNotificationsModule | null | undefined;

/** Android Expo Go cannot load expo-notifications (SDK 53+). Dev/release builds are fine. */
export function supportsNativeExpoNotifications(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }

  if (
    Platform.OS === 'android' &&
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    return false;
  }

  return true;
}

export function getExpoNotificationsModule(): ExpoNotificationsModule | null {
  if (!supportsNativeExpoNotifications()) {
    return null;
  }

  if (cachedModule === undefined) {
    cachedModule = require('expo-notifications') as ExpoNotificationsModule;
  }

  return cachedModule;
}

let notificationHandlerConfigured = false;

export function configureExpoNotificationHandler(isAppForegrounded: () => boolean) {
  const Notifications = getExpoNotificationsModule();
  if (!Notifications || notificationHandlerConfigured) {
    return;
  }

  notificationHandlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: !isAppForegrounded(),
      shouldSetBadge: false,
      shouldShowBanner: !isAppForegrounded(),
      shouldShowList: !isAppForegrounded(),
    }),
  });
}
