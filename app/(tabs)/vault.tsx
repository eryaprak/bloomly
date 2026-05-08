import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '@/stores/playerStore';
import { GARDEN_OBJECTS } from '@/constants/gardenObjects';
import VaultItemCard from '@/components/vault/VaultItemCard';
import type { VaultPlant } from '@/types/vault';
import '@/i18n';

export default function VaultScreen() {
  const { t } = useTranslation();
  const gardenObjects = usePlayerStore((s) => s.gardenObjects);

  const vaultPlants: VaultPlant[] = gardenObjects.map((objName) => {
    const obj = GARDEN_OBJECTS.find((g) => g.name === objName);
    return {
      id: objName,
      name: obj?.label || objName,
      type: 'Dekorasyon',
      unlockedAt: Date.now(),
      alarms: [],
      image: obj?.image,
    };
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Vault</Text>
        <View style={styles.countChip}>
          <Text style={styles.countText}>{vaultPlants.length} Bitki</Text>
        </View>
      </View>

      {vaultPlants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🌱</Text>
          <Text style={styles.emptyTitle}>Henüz Bitki Yok</Text>
          <Text style={styles.emptySubtitle}>
            Bölüm tamamlayarak bitki kazan ve vault'unu doldur
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {vaultPlants.map((plant) => (
            <VaultItemCard key={plant.id} plant={plant} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D1F0D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  countChip: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  countText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#AAAAAA',
    fontSize: 14,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 32,
  },
});
