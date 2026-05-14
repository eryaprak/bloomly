import { useEffect } from 'react';
import { LogBox, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import '@/i18n';
import { AudioService } from '@/services/AudioService';
import { hydratePlayerEconomy, usePlayerStore } from '@/stores/playerStore';

LogBox.ignoreAllLogs();

// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function requestTrackingPermission(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    await requestTrackingPermissionsAsync();
    // App continues regardless of the user's choice (granted or denied)
  } catch {
    // Silently ignore — tracking is optional, never block app launch
  }
}

function AppInit() {
  const updateStreak = usePlayerStore((s) => s.updateStreak);

  useEffect(() => {
    void hydratePlayerEconomy();
    AudioService.preload().catch(() => {});
    updateStreak();
    // Request ATT after a short delay so the splash has fully dismissed
    const timer = setTimeout(() => {
      void requestTrackingPermission();
    }, 500);
    return () => clearTimeout(timer);
  }, [updateStreak]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppInit />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="level/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="level-complete" options={{ headerShown: false }} />
        <Stack.Screen name="level-fail" options={{ headerShown: false }} />
        <Stack.Screen name="match3" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
