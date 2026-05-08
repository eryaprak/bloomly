import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAlarmStore } from '@/stores/alarmStore';
import AlarmService from '@/services/AlarmService';
import type { AlarmRepeat } from '@/types/vault';

interface AlarmSheetProps {
  visible: boolean;
  plantId: string;
  plantName: string;
  onClose: () => void;
}

export default function AlarmSheet({
  visible,
  plantId,
  plantName,
  onClose,
}: AlarmSheetProps) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState<AlarmRepeat>('once');

  const getAlarmsForPlant = useAlarmStore((s) => s.getAlarmsForPlant);
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const removeAlarm = useAlarmStore((s) => s.removeAlarm);
  const toggleAlarm = useAlarmStore((s) => s.toggleAlarm);
  const updateAlarmNotificationId = useAlarmStore((s) => s.updateAlarmNotificationId);

  const alarms = getAlarmsForPlant(plantId);

  const handleSaveAlarm = async () => {
    if (!label.trim()) {
      Alert.alert('Hata', 'Lütfen alarm için bir etiket girin');
      return;
    }

    const alarmId = `${plantId}_${Date.now()}`;
    const newAlarm = {
      id: alarmId,
      plantId,
      label: label.trim(),
      time: selectedDate.getTime(),
      repeat,
      enabled: true,
      notificationId: null as string | null,
    };

    try {
      const notificationId = await AlarmService.scheduleAlarm(newAlarm);
      newAlarm.notificationId = notificationId;
      addAlarm(newAlarm);

      // Reset form
      setLabel('');
      setSelectedDate(new Date());
      setRepeat('once');
      setShowForm(false);
    } catch (error) {
      Alert.alert('Hata', 'Alarm oluşturulamadı. Bildirim izni verildi mi?');
    }
  };

  const handleDeleteAlarm = (alarmId: string) => {
    Alert.alert('Emin misiniz?', 'Bu alarmı silmek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => removeAlarm(plantId, alarmId),
      },
    ]);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRepeatLabel = (rep: AlarmRepeat) => {
    switch (rep) {
      case 'once':
        return 'Bir Kez';
      case 'daily':
        return 'Günlük';
      case 'weekly':
        return 'Haftalık';
      default:
        return 'Bir Kez';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{plantName} - Alarmlar</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {alarms.length === 0 && !showForm && (
              <Text style={styles.emptyText}>Henüz alarm yok</Text>
            )}

            {alarms.map((alarm) => (
              <View key={alarm.id} style={styles.alarmRow}>
                <View style={styles.alarmInfo}>
                  <Text style={styles.alarmLabel}>{alarm.label}</Text>
                  <Text style={styles.alarmTime}>{formatDate(alarm.time)}</Text>
                  <View style={styles.repeatBadge}>
                    <Text style={styles.repeatText}>{getRepeatLabel(alarm.repeat)}</Text>
                  </View>
                </View>
                <View style={styles.alarmActions}>
                  <Switch
                    value={alarm.enabled}
                    onValueChange={() => toggleAlarm(plantId, alarm.id)}
                    trackColor={{ false: '#555555', true: '#22C55E' }}
                    thumbColor="#FFFFFF"
                  />
                  <TouchableOpacity
                    onPress={() => handleDeleteAlarm(alarm.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {showForm && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Yeni Alarm</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Etiket (örn: Sulama zamanı)"
                  placeholderTextColor="#888888"
                  value={label}
                  onChangeText={setLabel}
                />

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    📅 {selectedDate.toLocaleDateString('tr-TR')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    🕐 {selectedDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={(_event: any, date?: Date) => {
                      setShowDatePicker(false);
                      if (date) setSelectedDate(date);
                    }}
                  />
                )}

                {showTimePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="time"
                    display="default"
                    onChange={(_event: any, date?: Date) => {
                      setShowTimePicker(false);
                      if (date) setSelectedDate(date);
                    }}
                  />
                )}

                <View style={styles.repeatRow}>
                  <TouchableOpacity
                    style={[styles.repeatChip, repeat === 'once' && styles.repeatChipActive]}
                    onPress={() => setRepeat('once')}
                  >
                    <Text style={[styles.repeatChipText, repeat === 'once' && styles.repeatChipTextActive]}>
                      Bir Kez
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.repeatChip, repeat === 'daily' && styles.repeatChipActive]}
                    onPress={() => setRepeat('daily')}
                  >
                    <Text style={[styles.repeatChipText, repeat === 'daily' && styles.repeatChipTextActive]}>
                      Günlük
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.repeatChip, repeat === 'weekly' && styles.repeatChipActive]}
                    onPress={() => setRepeat('weekly')}
                  >
                    <Text style={[styles.repeatChipText, repeat === 'weekly' && styles.repeatChipTextActive]}>
                      Haftalık
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowForm(false);
                      setLabel('');
                      setSelectedDate(new Date());
                      setRepeat('once');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveAlarm}>
                    <Text style={styles.saveButtonText}>Kaydet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!showForm && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowForm(true)}
              >
                <Ionicons name="add-circle-outline" size={24} color="#FFD700" />
                <Text style={styles.addButtonText}>Yeni Alarm Ekle</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0D1F0D',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A5A2A',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  emptyText: {
    color: '#AAAAAA',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
  },
  alarmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A3A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  alarmTime: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 4,
  },
  repeatBadge: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  repeatText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  alarmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
  },
  form: {
    backgroundColor: '#1A3A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  formTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#0D1F0D',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A5A2A',
  },
  dateButton: {
    backgroundColor: '#0D1F0D',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A5A2A',
  },
  dateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  repeatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  repeatChip: {
    flex: 1,
    backgroundColor: '#0D1F0D',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A5A2A',
  },
  repeatChipActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  repeatChipText: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '600',
  },
  repeatChipTextActive: {
    color: '#FFFFFF',
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#555555',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A3A1A',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  addButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
});
