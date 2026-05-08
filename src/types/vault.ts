export type AlarmRepeat = 'once' | 'daily' | 'weekly';

export interface PlantAlarm {
  id: string;
  plantId: string;
  label: string;
  time: number;
  repeat: AlarmRepeat;
  enabled: boolean;
  notificationId: string | null;
}

export interface VaultPlant {
  id: string;
  name: string;
  type: string;
  unlockedAt: number;
  alarms: PlantAlarm[];
}
