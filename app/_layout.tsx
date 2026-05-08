import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import '@/i18n';
import { AudioService } from '@/services/AudioService';
import { usePlayerStore } from '@/stores/playerStore';

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

function AppInit() {
  const updateStreak = usePlayerStore((s) => s.updateStreak);

  useEffect(() => {
    AudioService.preload().catch(() => {});
    updateStreak();
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
      </Stack>
    </GestureHandlerRootView>
  );
}
