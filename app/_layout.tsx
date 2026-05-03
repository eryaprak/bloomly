import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '@/i18n';
import { AudioService } from '@/services/AudioService';
import { usePlayerStore } from '@/stores/playerStore';

LogBox.ignoreAllLogs();

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
