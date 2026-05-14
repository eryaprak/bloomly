/**
 * AdMob ads service — interstitial reklam yönetimi
 *
 * Kullanım akışı:
 *   1. Uygulama açılışında initAds() çağır
 *   2. Soru öncesi showInterstitial() çağır
 *   3. Promise resolve olunca soruya izin ver
 *
 * Hata toleransı: reklam yüklenmese veya gösterilemese bile
 * Promise her zaman resolve olur — akış hiçbir zaman bloklanmaz.
 */

import {
  InterstitialAd,
  AdEventType,
  TestIds,
  MobileAds,
} from "react-native-google-mobile-ads";
import { Platform, StatusBar } from "react-native";

// ── Ad Unit IDs ──────────────────────────────────────────────────────────────
const IOS_INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : "ca-app-pub-4748306445734022/6215374389";

const ANDROID_INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : "ca-app-pub-4748306445734022/1260834717";

const AD_UNIT_ID =
  Platform.OS === "ios" ? IOS_INTERSTITIAL_ID : ANDROID_INTERSTITIAL_ID;

// ── Module-level state ────────────────────────────────────────────────────────
let interstitial: InterstitialAd | null = null;
let adLoaded = false;
let adLoading = false;
let initDone = false;
let initPromise: Promise<void> | null = null;
let requestNonPersonalizedAdsOnly = Platform.OS === "ios";
let showPromise: Promise<void> | null = null;
let resolveShowPromise: (() => void) | null = null;
let showTimeout: ReturnType<typeof setTimeout> | null = null;
let lastInterstitialShownAt = 0;
const listenerCleanups: Array<() => void> = [];

const INTERSTITIAL_COOLDOWN_MS = 45000;
const SHOW_FAILSAFE_TIMEOUT_MS = 12000;

function clearListeners(): void {
  while (listenerCleanups.length > 0) {
    const cleanup = listenerCleanups.pop();
    cleanup?.();
  }
}

function finalizeInterstitialPresentation(): void {
  if (showTimeout) {
    clearTimeout(showTimeout);
    showTimeout = null;
  }

  if (Platform.OS === "ios") {
    StatusBar.setHidden(false, "fade");
  }

  const resolver = resolveShowPromise;
  resolveShowPromise = null;
  showPromise = null;
  resolver?.();
}

// ── Init ──────────────────────────────────────────────────────────────────────
export async function initAds(): Promise<void> {
  if (initDone) return;

  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    try {
      await MobileAds().initialize();
      initDone = true;
      loadInterstitial();
    } catch (e) {
      console.error("[AdMob] init error:", e);
    }
  })().finally(() => {
    initPromise = null;
  });

  await initPromise;
}

// ── Load ──────────────────────────────────────────────────────────────────────
export function loadInterstitial(): void {
  if (!initDone || adLoading) {
    return;
  }

  try {
    clearListeners();
    adLoading = true;
    adLoaded = false;

    interstitial = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly,
    });

    listenerCleanups.push(
      interstitial.addAdEventListener(
        AdEventType.LOADED,
        () => {
          adLoading = false;
          adLoaded = true;
        }
      )
    );

    listenerCleanups.push(
      interstitial.addAdEventListener(AdEventType.OPENED, () => {
        if (Platform.OS === "ios") {
          StatusBar.setHidden(true, "fade");
        }
      })
    );

    listenerCleanups.push(
      interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        adLoading = false;
        adLoaded = false;
        finalizeInterstitialPresentation();
        loadInterstitial();
      })
    );

    listenerCleanups.push(
      interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        console.warn("[AdMob] interstitial error:", error);
        adLoading = false;
        adLoaded = false;
        finalizeInterstitialPresentation();
        loadInterstitial();
      })
    );

    interstitial.load();
  } catch (e) {
    console.error("[AdMob] loadInterstitial error:", e);
    adLoading = false;
    adLoaded = false;
  }
}

// ── Show ──────────────────────────────────────────────────────────────────────
export function showInterstitial(): Promise<void> {
  if (showPromise) {
    return showPromise;
  }

  showPromise = new Promise(async (resolve) => {
    resolveShowPromise = resolve;

    await initAds();

    const now = Date.now();
    if (now - lastInterstitialShownAt < INTERSTITIAL_COOLDOWN_MS) {
      finalizeInterstitialPresentation();
      if (!adLoaded) {
        loadInterstitial();
      }
      return;
    }

    if (!interstitial || !adLoaded) {
      finalizeInterstitialPresentation();
      loadInterstitial();
      return;
    }

    try {
      lastInterstitialShownAt = now;
      showTimeout = setTimeout(() => {
        console.warn("[AdMob] show timeout reached, continuing flow.");
        adLoaded = false;
        finalizeInterstitialPresentation();
        loadInterstitial();
      }, SHOW_FAILSAFE_TIMEOUT_MS);
      interstitial.show();
    } catch (e) {
      console.error("[AdMob] showInterstitial unexpected error:", e);
      adLoaded = false;
      finalizeInterstitialPresentation();
      loadInterstitial();
    }
  });

  return showPromise;
}
