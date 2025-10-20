'use client';

import { Capacitor, registerPlugin } from '@capacitor/core';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
}

export interface Purchase {
  purchaseState: 'PURCHASED' | 'PENDING' | 'FAILED' | 'CANCELLED';
  productId: string;
}

export interface BillingPlugin {
  initialize(): Promise<void>;
  queryProducts(options: { productIds: string[] }): Promise<{ products: Product[] }>;
  purchase(options: { productId: string }): Promise<Purchase>;
  checkSubscriptions(): Promise<{ activeSubscriptions: any[] }>;
}

// A singleton instance of our billing plugin.
let billingInstance: BillingPlugin | null = null;
let isInitializing = false;

// Default implementation for web or when the plugin is not available.
const unavailableBilling: BillingPlugin = {
  initialize: async () => console.warn('Billing plugin not available on this platform.'),
  queryProducts: async () => {
    console.warn('Billing plugin not available.');
    return { products: [] };
  },
  purchase: async (options) => {
    console.warn(`Billing plugin not available. Purchase for ${options.productId} cannot be completed.`);
    // Returning FAILED to avoid confusion with cancellation.
    return { purchaseState: 'FAILED', productId: options.productId };
  },
  checkSubscriptions: async () => {
    console.warn('Billing plugin not available.');
    return { activeSubscriptions: [] };
  },
};

// This function safely initializes and returns the billing plugin.
export const initializeBilling = async (): Promise<BillingPlugin> => {
  if (billingInstance) {
    return billingInstance;
  }

  // Prevent multiple initializations at the same time.
  if (isInitializing) {
    // If initialization is already in progress, wait for it to complete.
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (billingInstance) {
          clearInterval(interval);
          resolve(billingInstance);
        }
      }, 100);
    });
  }

  isInitializing = true;

  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Billing')) {
    try {
      const plugin = registerPlugin<BillingPlugin>('Billing');
      await plugin.initialize();
      console.log("Billing plugin initialized successfully.");
      billingInstance = plugin;
    } catch (error) {
      console.error("Failed to initialize billing plugin:", error);
      billingInstance = unavailableBilling; // Fallback to unavailable
    }
  } else {
    billingInstance = unavailableBilling;
  }
  
  isInitializing = false;
  return billingInstance;
};

// Export a getter to access the instance if needed, though initialization should be primary.
export const getBilling = (): BillingPlugin => {
    if (!billingInstance) {
        // This is a safeguard. In a well-structured app, initializeBilling should always be called first.
        // We return the unavailableBilling mock to prevent crashes, but warn the developer.
        console.warn("Billing plugin has not been initialized. Returning unavailable mock. Call initializeBilling() at app startup.");
        return unavailableBilling;
    }
    return billingInstance;
}
