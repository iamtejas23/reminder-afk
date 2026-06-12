import { Stack } from 'expo-router';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import 'react-native-reanimated';

export default function RootLayout() {
  useEffect(() => {
    let isActive = true;

    async function syncUpdateOnLaunch() {
      if (__DEV__ || !Updates.isEnabled) {
        return;
      }

      try {
        const update = await Updates.checkForUpdateAsync();

        if (!isActive || (!update.isAvailable && !update.isRollBackToEmbedded)) {
          return;
        }

        const fetchedUpdate = await Updates.fetchUpdateAsync();

        if (!isActive || (!fetchedUpdate.isNew && !fetchedUpdate.isRollBackToEmbedded)) {
          return;
        }

        await Updates.reloadAsync();
      } catch {
        // Stay on the cached bundle when startup update checks fail, including offline launches.
      }
    }

    void syncUpdateOnLaunch();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
