/**
 * RevenueCat purchases service — premium abonelik yönetimi
 *
 * FIXME: Replace placeholder API keys with your actual RevenueCat keys.
 * iOS key:     App Store Connect > RevenueCat Dashboard > iOS App > API Key
 * Android key: Google Play > RevenueCat Dashboard > Android App > API Key
 * Dashboard:   https://app.revenuecat.com
 */

import { Platform } from 'react-native';

// ── API Keys ──────────────────────────────────────────────────────────────────
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? 'appl_PLACEHOLDER';
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? 'goog_PLACEHOLDER';

const API_KEY =
  Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

const isPlaceholder = API_KEY.includes('PLACEHOLDER');

// ── Constants ─────────────────────────────────────────────────────────────────
export const ENTITLEMENT_ID = 'premium';
export const MONTHLY_PRODUCT_ID = 'com.voxduru.bloomly.premium.monthly';
export const YEARLY_PRODUCT_ID = 'com.voxduru.bloomly.premium.yearly';

// ── Dynamic import helpers ────────────────────────────────────────────────────
// react-native-purchases is an optional native dependency.
// When not installed / not configured, all methods gracefully no-op.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Purchases: any = null;

async function getPurchases(): Promise<typeof Purchases> {
  if (Purchases) return Purchases;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Purchases = require('react-native-purchases').default;
    return Purchases;
  } catch {
    return null;
  }
}

// ── State ─────────────────────────────────────────────────────────────────────
let initialized = false;

// ── Init ──────────────────────────────────────────────────────────────────────
export async function initPurchases(): Promise<void> {
  if (initialized || isPlaceholder) return;
  try {
    const P = await getPurchases();
    if (!P) return;
    P.configure({ apiKey: API_KEY });
    initialized = true;
  } catch (e) {
    console.error('[Purchases] init error:', e);
  }
}

// ── Premium Check ─────────────────────────────────────────────────────────────
export async function getIsPremium(): Promise<boolean> {
  try {
    await initPurchases();
    if (!initialized) return false;
    const P = await getPurchases();
    if (!P) return false;
    const customerInfo = await P.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (e) {
    console.error('[Purchases] getIsPremium error:', e);
    return false;
  }
}

// ── Offerings ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getOfferings(): Promise<any | null> {
  try {
    await initPurchases();
    if (!initialized) return null;
    const P = await getPurchases();
    if (!P) return null;
    const offerings = await P.getOfferings();
    return offerings.current;
  } catch (e) {
    console.error('[Purchases] getOfferings error:', e);
    return null;
  }
}

// ── Purchase ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function purchasePackage(pkg: any): Promise<void> {
  try {
    await initPurchases();
    if (!initialized) throw new Error('Purchases not configured');
    const P = await getPurchases();
    if (!P) throw new Error('react-native-purchases not available');
    await P.purchasePackage(pkg);
  } catch (e) {
    console.error('[Purchases] purchasePackage error:', e);
    throw e;
  }
}

// ── Restore ───────────────────────────────────────────────────────────────────
export async function restorePurchases(): Promise<void> {
  try {
    await initPurchases();
    if (!initialized) throw new Error('Purchases not configured');
    const P = await getPurchases();
    if (!P) throw new Error('react-native-purchases not available');
    await P.restorePurchases();
  } catch (e) {
    console.error('[Purchases] restorePurchases error:', e);
    throw e;
  }
}
