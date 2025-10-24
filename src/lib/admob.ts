'use client';

import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdMobBannerOptions, InterstitialAdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

// --- Ad Unit IDs (REPLACE WITH YOUR OWN) ---
// It's recommended to use environment variables for these
const adUnits = {
  // Android
  android_banner: 'ca-app-pub-3940256099942544/6300978111', // Test ID
  android_interstitial: 'ca-app-pub-3940256099942544/1033173712', // Test ID

  // iOS
  ios_banner: 'ca-app-pub-3940256099942544/2934735716', // Test ID
  ios_interstitial: 'ca-app-pub-3940256099942544/4411468910', // Test ID
};

const getAdUnitId = (type: 'banner' | 'interstitial'): string => {
  if (Capacitor.getPlatform() === 'ios') {
    return type === 'banner' ? adUnits.ios_banner : adUnits.ios_interstitial;
  }
  return type === 'banner' ? adUnits.android_banner : adUnits.android_interstitial;
}

// --- AdMob Initialization ---
export const initializeAdMob = async (): Promise<void> => {
  if (!isNative) return;
  try {
    const { status } = await AdMob.trackingAuthorizationStatus();
    if (status === 'notDetermined') {
      console.log('Displaying tracking authorization request.');
    }

    await AdMob.initialize({
      requestTrackingAuthorization: true,
      testingDevices: [], // Add your test device IDs here
      initializeForTesting: true,
    });
    console.log("AdMob initialized successfully.");
  } catch (error: any) {
    console.error("Error initializing AdMob:", error);
  }
};

// --- Banner Ad ---
export const showBanner = async (): Promise<void> => {
  if (!isNative) return;

  const options: AdMobBannerOptions = {
    adId: getAdUnitId('banner'),
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: true, // Set to false for production
  };

  try {
    await AdMob.showBanner(options);
    console.log("Banner ad is being shown.");
  } catch (error: any) {
     console.error("Error showing banner ad:", error);
  }
};

export const hideBanner = async (): Promise<void> => {
    if (!isNative) return;
    try {
        await AdMob.hideBanner();
        console.log("Banner ad hidden.");
    } catch (error: any) {
        console.error("Error hiding banner ad:", error);
    }
};

export const resumeBanner = async (): Promise<void> => {
    if (!isNative) return;
    try {
        await AdMob.resumeBanner();
        console.log("Banner ad resumed.");
    } catch (error: any) {
        console.error("Error resuming banner ad:", error);
    }
};

// --- Interstitial Ad ---
export const prepareInterstitial = async (): Promise<void> => {
  if (!isNative) return;

  const options: InterstitialAdOptions = {
    adId: getAdUnitId('interstitial'),
    isTesting: true,
  };

  try {
    await AdMob.prepareInterstitial(options);
     console.log("Interstitial ad prepared.");
  } catch (error: any) {
     console.error("Error preparing interstitial ad:", error);
  }
};

export const showInterstitial = async (): Promise<void> => {
    if (!isNative) return;
    try {
        await AdMob.showInterstitial();
        console.log("Interstitial ad shown.");
        // After showing, prepare the next one
        await prepareInterstitial();
    } catch (error: any) {
        console.error("Error showing interstitial ad:", error);
    }
};
