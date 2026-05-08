import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { VaultPlant } from '@/types/vault';
import { useAlarmStore } from '@/stores/alarmStore';
import AlarmSheet from './AlarmSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 48) / 3;

interface VaultItemCardProps {
  plant: VaultPlant & { image?: number };
}

export default function VaultItemCard({ plant }: VaultItemCardProps) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const getAlarmsForPlant = useAlarmStore((s) => s.getAlarmsForPlant);

  const alarms = getAlarmsForPlant(plant.id);
  const activeAlarms = alarms.filter((a) => a.enabled);

  return (
    <>
      <View style={styles.card}>
        <View style={styles.imageWrap}>
          {plant.image && (
            <Image
              source={plant.image}
              style={styles.image}
              resizeMode="contain"
            />
          )}
        </View>
        <Text style={styles.name}>{plant.name}</Text>
        <Text style={styles.type}>{plant.type}</Text>
        <TouchableOpacity
          style={styles.alarmButton}
          onPress={() => setSheetVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={20} color="#FFD700" />
          {activeAlarms.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeAlarms.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <AlarmSheet
        visible={sheetVisible}
        plantId={plant.id}
        plantName={plant.name}
        onClose={() => setSheetVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: ITEM_SIZE,
    backgroundColor: '#1A3A1A',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#22C55E',
  },
  imageWrap: {
    width: ITEM_SIZE - 24,
    height: ITEM_SIZE - 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  type: {
    color: '#AAAAAA',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  alarmButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
