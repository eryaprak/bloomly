import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '@/stores/playerStore';
import '@/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 48) / 3;

interface GardenObject {
  name: string;
  label: string;
  cost: number; // stars required
  image: number;
}

const GARDEN_OBJECTS: GardenObject[] = [
  { name: 'obj_bench',      label: 'Bench',      cost: 5,  image: require('@assets/garden/obj_bench.png') },
  { name: 'obj_birdhouse',  label: 'Birdhouse',  cost: 8,  image: require('@assets/garden/obj_birdhouse.png') },
  { name: 'obj_butterfly',  label: 'Butterfly',  cost: 12, image: require('@assets/garden/obj_butterfly.png') },
  { name: 'obj_fountain',   label: 'Fountain',   cost: 20, image: require('@assets/garden/obj_fountain.png') },
  { name: 'obj_lantern',    label: 'Lantern',    cost: 15, image: require('@assets/garden/obj_lantern.png') },
  { name: 'obj_path',       label: 'Path',       cost: 3,  image: require('@assets/garden/obj_path.png') },
  { name: 'obj_rose_hedge', label: 'Rose Hedge', cost: 18, image: require('@assets/garden/obj_rose_hedge.png') },
  { name: 'obj_tree',       label: 'Tree',       cost: 10, image: require('@assets/garden/obj_tree.png') },
];

export default function GardenScreen() {
  const { t } = useTranslation();
  const gardenObjects = usePlayerStore((s) => s.gardenObjects);
  const stars = usePlayerStore((s) => s.stars);
  const unlockGardenObject = usePlayerStore((s) => s.unlockGardenObject);

  const totalStars = Object.values(stars).reduce((sum, s) => sum + s, 0);

  const handleUnlock = (obj: GardenObject) => {
    if (totalStars >= obj.cost && !gardenObjects.includes(obj.name)) {
      unlockGardenObject(obj.name);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('garden')}</Text>
        <View style={styles.starsChip}>
          <Text style={styles.starsText}>★ {totalStars}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {GARDEN_OBJECTS.map((obj) => {
          const isUnlocked = gardenObjects.includes(obj.name);
          const canAfford = totalStars >= obj.cost;
          return (
            <TouchableOpacity
              key={obj.name}
              style={[styles.item, isUnlocked && styles.itemUnlocked]}
              onPress={() => !isUnlocked && handleUnlock(obj)}
              activeOpacity={isUnlocked ? 1 : 0.7}
            >
              <View style={styles.imageWrap}>
                <Image
                  source={obj.image}
                  style={[styles.objImage, !isUnlocked && styles.objImageLocked]}
                  resizeMode="contain"
                />
                {!isUnlocked && <Text style={styles.lockOverlay}>🔒</Text>}
              </View>
              <Text style={styles.objLabel}>{obj.label}</Text>
              {!isUnlocked && (
                <View style={[styles.costChip, !canAfford && styles.costChipUnaffordable]}>
                  <Text style={styles.costText}>★ {obj.cost}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  starsChip: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  starsText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 32,
  },
  item: {
    width: ITEM_SIZE,
    backgroundColor: '#1A3A1A',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2A5A2A',
  },
  itemUnlocked: {
    borderColor: '#22C55E',
    backgroundColor: '#1F4A1F',
  },
  imageWrap: {
    width: ITEM_SIZE - 24,
    height: ITEM_SIZE - 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objImage: {
    width: '100%',
    height: '100%',
  },
  objImageLocked: {
    opacity: 0.3,
  },
  lockOverlay: {
    position: 'absolute',
    fontSize: 28,
  },
  objLabel: {
    color: '#CCCCCC',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  costChip: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  costChipUnaffordable: {
    backgroundColor: '#555555',
  },
  costText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 11,
  },
});
