import { useEffect, useState } from 'react';
import { LogBox, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import '@/i18n';
import { AudioService } from '@/services/AudioService';
import { hydratePlayerEconomy, usePlayerStore } from '@/stores/playerStore';
import OnboardingScreen from '@/components/ui/OnboardingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

LogBox.ignoreAllLogs();

const ONBOARDING_KEY = '@bloomly/onboarding/done';

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

async function scheduleEngagementNotifications(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    // Cancel any existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();

    // Daily reminder at 10:00 — "Don't forget your plants!"
    const dailyReminder = new Date(now);
    dailyReminder.setHours(10, 0, 0, 0);
    if (dailyReminder <= now) dailyReminder.setDate(dailyReminder.getDate() + 1);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your garden misses you! 🌸',
        body: 'New levels are waiting. Come back and keep blooming!',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 10,
        minute: 0,
      },
    });
  } catch {
    // Notifications are optional — never block app flow
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
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((val) => {
        setShowOnboarding(val !== 'done');
        setOnboardingChecked(true);
      })
      .catch(() => {
        // If storage fails, skip onboarding to not block the user
        setShowOnboarding(false);
        setOnboardingChecked(true);
      });
  }, []);

  function handleOnboardingDone() {
    AsyncStorage.setItem(ONBOARDING_KEY, 'done').catch(() => {});
    // Request notification permissions after onboarding
    Notifications.requestPermissionsAsync()
      .then(() => scheduleEngagementNotifications())
      .catch(() => {});
    setShowOnboarding(false);
  }

  if (!onboardingChecked) {
    // Blank while checking storage — splash screen covers this
    return null;
  }

  if (showOnboarding) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <OnboardingScreen onDone={handleOnboardingDone} />
      </GestureHandlerRootView>
    );
  }

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
