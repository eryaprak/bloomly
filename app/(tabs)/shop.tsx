import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import '@/i18n';

interface BoosterItem {
  icon: string;
  name: string;
  description: string;
}

const BOOSTERS: BoosterItem[] = [
  { icon: '✂️', name: 'Scissors Pack',   description: 'Remove any petal from the dock' },
  { icon: '💨', name: 'Wind Pack',        description: 'Shuffle all board petals' },
  { icon: '☀️', name: 'Sun Pack',         description: 'Melt all ice obstacles' },
  { icon: '🔑', name: 'Key Pack',         description: 'Unlock all locked petals' },
  { icon: '⏱️', name: '+5 Moves',         description: 'Add 5 extra moves to current level' },
];

const GOLD_PACKS = [
  { icon: '🌼', amount: 500,   price: '$0.99' },
  { icon: '🌻', amount: 1200,  price: '$1.99' },
  { icon: '🌷', amount: 3000,  price: '$4.99' },
  { icon: '🌹', amount: 7500,  price: '$9.99' },
];

export default function ShopScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('shop')}</Text>

        <View style={styles.comingSoonBanner}>
          <Text style={styles.comingSoonText}>🚧  {t('comingSoon')}  🚧</Text>
          <Text style={styles.comingSoonSubtext}>IAP coming in Phase 2</Text>
        </View>

        {/* Boosters section */}
        <Text style={styles.sectionTitle}>Boosters</Text>
        {BOOSTERS.map((b) => (
          <View key={b.name} style={styles.itemRow}>
            <Text style={styles.itemIcon}>{b.icon}</Text>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{b.name}</Text>
              <Text style={styles.itemDesc}>{b.description}</Text>
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{t('comingSoon')}</Text>
            </View>
          </View>
        ))}

        {/* Gold packs section */}
        <Text style={styles.sectionTitle}>Gold Packs</Text>
        <View style={styles.goldGrid}>
          {GOLD_PACKS.map((gp) => (
            <View key={gp.price} style={styles.goldCard}>
              <Text style={styles.goldIcon}>{gp.icon}</Text>
              <Text style={styles.goldAmount}>{gp.amount.toLocaleString()}</Text>
              <Text style={styles.goldPrice}>{gp.price}</Text>
              <View style={styles.comingSoonSmall}>
                <Text style={styles.comingSoonSmallText}>{t('comingSoon')}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1A0A2E',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    paddingVertical: 14,
    textAlign: 'center',
  },
  comingSoonBanner: {
    backgroundColor: 'rgba(255,200,0,0.15)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  comingSoonText: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 16,
  },
  comingSoonSubtext: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#CCCCCC',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D1B5C',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  itemIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  itemDesc: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 2,
  },
  priceBadge: {
    backgroundColor: '#555555',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priceText: {
    color: '#CCCCCC',
    fontSize: 11,
    fontWeight: '600',
  },
  goldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  goldCard: {
    width: '47%',
    backgroundColor: '#2D1B5C',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  goldIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  goldAmount: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 18,
  },
  goldPrice: {
    color: '#CCCCCC',
    fontSize: 13,
    marginTop: 2,
  },
  comingSoonSmall: {
    backgroundColor: '#555555',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 8,
  },
  comingSoonSmallText: {
    color: '#CCCCCC',
    fontSize: 10,
  },
});
