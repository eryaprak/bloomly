// KURAL: ASLA s => ({...}) kullanma. Her selector = s => s.fieldName
import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import type { PlantAlarm } from '@/types/vault';
import AlarmService from '@/services/AlarmService';

let storage: MMKV;
try {
  storage = createMMKV({ id: 'alarm-store' });
} catch {
  storage = createMMKV();
}

function loadFromMMKV<T>(key: string, fallback: T): T {
  try {
    const raw = storage.getString(key);
    if (raw !== undefined) return JSON.parse(raw) as T;
  } catch {
    // corrupted data — return fallback
  }
  return fallback;
}

function saveToMMKV(key: string, value: unknown): void {
  try {
    storage.set(key, JSON.stringify(value));
  } catch {
    // ignore write errors
  }
}

interface AlarmStore {
  alarms: Record<string, PlantAlarm[]>;
  addAlarm: (alarm: PlantAlarm) => void;
  removeAlarm: (plantId: string, alarmId: string) => Promise<void>;
  toggleAlarm: (plantId: string, alarmId: string) => Promise<void>;
  updateAlarmNotificationId: (plantId: string, alarmId: string, notificationId: string | null) => void;
  getAlarmsForPlant: (plantId: string) => PlantAlarm[];
}

const DEFAULT_STATE = {
  alarms: {} as Record<string, PlantAlarm[]>,
};

function loadPersistedState() {
  return {
    alarms: loadFromMMKV('alarms', DEFAULT_STATE.alarms),
  };
}

export const useAlarmStore = create<AlarmStore>((set, get) => ({
  ...loadPersistedState(),

  addAlarm: (alarm) => {
    const { alarms } = get();
    const plantAlarms = alarms[alarm.plantId] || [];
    const newAlarms = { ...alarms, [alarm.plantId]: [...plantAlarms, alarm] };
    saveToMMKV('alarms', newAlarms);
    set({ alarms: newAlarms });
  },

  removeAlarm: async (plantId, alarmId) => {
    const { alarms } = get();
    const plantAlarms = alarms[plantId] || [];
    const alarmToRemove = plantAlarms.find((a) => a.id === alarmId);

    if (alarmToRemove?.notificationId) {
      await AlarmService.cancelAlarm(alarmToRemove.notificationId);
    }

    const updated = plantAlarms.filter((a) => a.id !== alarmId);
    const newAlarms = { ...alarms, [plantId]: updated };
    saveToMMKV('alarms', newAlarms);
    set({ alarms: newAlarms });
  },

  toggleAlarm: async (plantId, alarmId) => {
    const { alarms } = get();
    const plantAlarms = alarms[plantId] || [];
    const alarmIndex = plantAlarms.findIndex((a) => a.id === alarmId);
    if (alarmIndex === -1) return;

    const alarm = plantAlarms[alarmIndex];
    const newEnabled = !alarm.enabled;

    if (newEnabled && !alarm.notificationId) {
      // Re-schedule
      const notificationId = await AlarmService.scheduleAlarm(alarm);
      alarm.notificationId = notificationId;
      alarm.enabled = true;
    } else if (!newEnabled && alarm.notificationId) {
      // Cancel
      await AlarmService.cancelAlarm(alarm.notificationId);
      alarm.notificationId = null;
      alarm.enabled = false;
    } else {
      alarm.enabled = newEnabled;
    }

    const updated = [...plantAlarms];
    updated[alarmIndex] = alarm;
    const newAlarms = { ...alarms, [plantId]: updated };
    saveToMMKV('alarms', newAlarms);
    set({ alarms: newAlarms });
  },

  updateAlarmNotificationId: (plantId, alarmId, notificationId) => {
    const { alarms } = get();
    const plantAlarms = alarms[plantId] || [];
    const updated = plantAlarms.map((a) =>
      a.id === alarmId ? { ...a, notificationId } : a
    );
    const newAlarms = { ...alarms, [plantId]: updated };
    saveToMMKV('alarms', newAlarms);
    set({ alarms: newAlarms });
  },

  getAlarmsForPlant: (plantId) => {
    return get().alarms[plantId] || [];
  },
}));
