import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import type { PlantAlarm } from '@/types/vault';

export interface AlarmServiceInterface {
  requestPermission(): Promise<boolean>;
  scheduleAlarm(alarm: PlantAlarm): Promise<string>;
  cancelAlarm(notificationId: string): Promise<void>;
  rescheduleAlarm(alarm: PlantAlarm): Promise<string>;
  cancelAllForPlant(alarms: PlantAlarm[]): Promise<void>;
}

class AlarmService implements AlarmServiceInterface {
  async requestPermission(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  async scheduleAlarm(alarm: PlantAlarm): Promise<string> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('Notification permission not granted');
    }

    const triggerDate = new Date(alarm.time);
    let trigger: Notifications.NotificationTriggerInput;

    switch (alarm.repeat) {
      case 'once':
        trigger = {
          type: SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        };
        break;

      case 'daily':
        trigger = {
          type: SchedulableTriggerInputTypes.CALENDAR,
          hour: triggerDate.getHours(),
          minute: triggerDate.getMinutes(),
          repeats: true,
        };
        break;

      case 'weekly':
        trigger = {
          type: SchedulableTriggerInputTypes.CALENDAR,
          weekday: (triggerDate.getDay() + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7, // Sunday=1, Monday=2...
          hour: triggerDate.getHours(),
          minute: triggerDate.getMinutes(),
          repeats: true,
        };
        break;

      default:
        trigger = {
          type: SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        };
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌸 Sulama Zamanı!',
        body: alarm.label || 'Bitkini sulamayı unutma',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { alarmId: alarm.id, plantId: alarm.plantId },
      },
      trigger,
    });

    return notificationId;
  }

  async cancelAlarm(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async rescheduleAlarm(alarm: PlantAlarm): Promise<string> {
    if (alarm.notificationId) {
      await this.cancelAlarm(alarm.notificationId);
    }
    return this.scheduleAlarm(alarm);
  }

  async cancelAllForPlant(alarms: PlantAlarm[]): Promise<void> {
    const cancelPromises = alarms
      .filter((a) => a.notificationId)
      .map((a) => this.cancelAlarm(a.notificationId!));
    await Promise.all(cancelPromises);
  }
}

export default new AlarmService();
