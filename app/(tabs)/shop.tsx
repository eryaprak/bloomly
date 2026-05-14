import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  getIsPremium,
  MONTHLY_PRODUCT_ID,
  YEARLY_PRODUCT_ID,
} from '@/services/purchases';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlanOption {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  period: string;
  badge?: string;
  pkg: unknown; // PurchasesPackage when available
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PREMIUM_FEATURES = [
  { icon: '🌸', text: 'Unlimited lives — play without limits' },
  { icon: '✂️', text: 'Free boosters every day' },
  { icon: '⏩', text: 'Skip wait timers instantly' },
  { icon: '🚫', text: 'No ads, ever' },
  { icon: '🌟', text: 'Exclusive premium levels' },
];

export default function ShopScreen() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [plans, setPlans] = useState<PlanOption[]>([
    {
      id: MONTHLY_PRODUCT_ID,
      title: 'Monthly',
      subtitle: 'Bloomly Premium Aylik',
      price: '$4.99',
      period: 'per month',
      pkg: null,
    },
    {
      id: YEARLY_PRODUCT_ID,
      title: 'Yearly',
      subtitle: 'Bloomly Premium Yearly',
      price: '$29.99',
      period: 'per year',
      badge: 'Best Value',
      pkg: null,
    },
  ]);

  // ── Load offerings on mount ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [offering, premium] = await Promise.all([
          getOfferings(),
          getIsPremium(),
        ]);

        if (cancelled) return;

        setIsPremium(premium);

        if (offering) {
          const updated: PlanOption[] = [];

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const monthly = offering.availablePackages.find(
            (p: any) => p.product.identifier === MONTHLY_PRODUCT_ID,
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const yearly = offering.availablePackages.find(
            (p: any) => p.product.identifier === YEARLY_PRODUCT_ID,
          );

          if (monthly) {
            updated.push({
              id: MONTHLY_PRODUCT_ID,
              title: 'Monthly',
              subtitle: 'Bloomly Premium Aylik',
              price: monthly.product.priceString,
              period: 'per month',
              pkg: monthly,
            });
          }
          if (yearly) {
            updated.push({
              id: YEARLY_PRODUCT_ID,
              title: 'Yearly',
              subtitle: 'Bloomly Premium Yearly',
              price: yearly.product.priceString,
              period: 'per year',
              badge: 'Best Value',
              pkg: yearly,
            });
          }

          if (updated.length > 0) setPlans(updated);
        }
      } catch (e) {
        // Graceful fallback — show static prices if RevenueCat unavailable
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  // ── Purchase ──────────────────────────────────────────────────────────────
  const handlePurchase = useCallback(async () => {
    if (isPremium) return;
    const plan = plans.find((p) =>
      p.id === (selectedPlan === 'monthly' ? MONTHLY_PRODUCT_ID : YEARLY_PRODUCT_ID),
    );
    if (!plan) return;

    setPurchasing(true);
    try {
      if (plan.pkg) {
        await purchasePackage(plan.pkg as Parameters<typeof purchasePackage>[0]);
        setIsPremium(true);
        Alert.alert(
          'Welcome to Premium! 🌸',
          'You now have unlimited access to all Bloomly features.',
        );
      } else {
        // RevenueCat not configured — inform user to contact support / sandbox
        Alert.alert(
          'Purchase Unavailable',
          'In-app purchases are being set up. Please try again later or contact support.',
        );
      }
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (!err?.userCancelled) {
        Alert.alert(
          'Purchase Failed',
          err?.message ?? 'Something went wrong. Please try again.',
        );
      }
    } finally {
      setPurchasing(false);
    }
  }, [isPremium, plans, selectedPlan]);

  // ── Restore ──────────────────────────────────────────────────────────────
  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      await restorePurchases();
      const premium = await getIsPremium();
      setIsPremium(premium);
      Alert.alert(
        premium ? 'Purchases Restored! 🌸' : 'No Previous Purchases',
        premium
          ? 'Your Premium subscription has been restored.'
          : 'No active subscriptions were found for your account.',
      );
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Restore Failed', err?.message ?? 'Unable to restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  }, []);

  // ── Active premium view ───────────────────────────────────────────────────
  if (!loading && isPremium) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Premium</Text>
          <View style={styles.activeCard}>
            <Text style={styles.activeIcon}>🌸</Text>
            <Text style={styles.activeTitle}>You're Premium!</Text>
            <Text style={styles.activeSubtitle}>
              Enjoy unlimited lives, no ads, and all exclusive features.
            </Text>
          </View>
          <View style={styles.featuresList}>
            {PREMIUM_FEATURES.map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={restoring}
          >
            {restoring ? (
              <ActivityIndicator color="#A78BFA" />
            ) : (
              <Text style={styles.restoreText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Bloomly Premium</Text>
        <Text style={styles.subtitle}>
          Unlock the full garden experience
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A78BFA" />
            <Text style={styles.loadingText}>Loading plans…</Text>
          </View>
        ) : (
          <>
            {/* Features */}
            <View style={styles.featuresCard}>
              {PREMIUM_FEATURES.map((f) => (
                <View key={f.text} style={styles.featureRow}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            {/* Plan selector */}
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            <View style={styles.plansContainer}>
              {plans.map((plan) => {
                const key = plan.id === MONTHLY_PRODUCT_ID ? 'monthly' : 'yearly';
                const isSelected = selectedPlan === key;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[styles.planCard, isSelected && styles.planCardSelected]}
                    onPress={() => setSelectedPlan(key)}
                    activeOpacity={0.8}
                  >
                    {plan.badge ? (
                      <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>{plan.badge}</Text>
                      </View>
                    ) : null}
                    <Text style={[styles.planTitle, isSelected && styles.planTitleSelected]}>
                      {plan.title}
                    </Text>
                    <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                      {plan.price}
                    </Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedIndicatorText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.ctaButton, purchasing && styles.ctaButtonDisabled]}
              onPress={handlePurchase}
              disabled={purchasing}
              activeOpacity={0.85}
            >
              {purchasing ? (
                <ActivityIndicator color="#1A0A2E" />
              ) : (
                <Text style={styles.ctaText}>
                  {selectedPlan === 'monthly'
                    ? `Subscribe Monthly — ${plans.find((p) => p.id === MONTHLY_PRODUCT_ID)?.price ?? '$4.99'}`
                    : `Subscribe Yearly — ${plans.find((p) => p.id === YEARLY_PRODUCT_ID)?.price ?? '$29.99'}`}
                </Text>
              )}
            </TouchableOpacity>

            {/* Legal */}
            <Text style={styles.legalText}>
              {Platform.OS === 'ios'
                ? 'Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless it is canceled at least 24 hours before the end of the current period. You can manage and cancel your subscriptions by going to your account settings on the App Store after purchase.'
                : 'Subscription renews automatically. Cancel anytime in Google Play.'}
            </Text>

            {/* Restore */}
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={restoring}
            >
              {restoring ? (
                <ActivityIndicator color="#A78BFA" />
              ) : (
                <Text style={styles.restoreText}>Restore Purchases</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1A0A2E',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 8,
  },
  subtitle: {
    color: '#A78BFA',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  featuresCard: {
    backgroundColor: '#2D1B5C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#7C3AED',
    gap: 10,
  },
  featuresList: {
    gap: 10,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  featureText: {
    color: '#E0D7FF',
    fontSize: 14,
    flex: 1,
  },
  sectionTitle: {
    color: '#CCCCCC',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#2D1B5C',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4C2E8A',
    position: 'relative',
    minHeight: 120,
    justifyContent: 'center',
  },
  planCardSelected: {
    borderColor: '#A78BFA',
    backgroundColor: '#3D2070',
  },
  badgeContainer: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#1A0A2E',
    fontSize: 10,
    fontWeight: '800',
  },
  planTitle: {
    color: '#AAAAAA',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 6,
    marginTop: 4,
  },
  planTitleSelected: {
    color: '#FFFFFF',
  },
  planPrice: {
    color: '#A78BFA',
    fontWeight: '800',
    fontSize: 22,
    marginBottom: 2,
  },
  planPriceSelected: {
    color: '#FFFFFF',
  },
  planPeriod: {
    color: '#888888',
    fontSize: 11,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#A78BFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  ctaButton: {
    backgroundColor: '#A78BFA',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: '#1A0A2E',
    fontWeight: '800',
    fontSize: 16,
  },
  legalText: {
    color: '#666666',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreText: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '600',
  },
  activeCard: {
    backgroundColor: '#2D1B5C',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#A78BFA',
    marginBottom: 20,
  },
  activeIcon: {
    fontSize: 52,
    marginBottom: 12,
  },
  activeTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  activeSubtitle: {
    color: '#A78BFA',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
