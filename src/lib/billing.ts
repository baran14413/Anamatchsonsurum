'use client';

import { Capacitor, registerPlugin } from '@capacitor/core';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
}

export interface Purchase {
  purchaseState: 'PURCHASED' | 'PENDING' | 'FAILED' | 'CANCELLED' | 'UNSPECIFIED' | undefined;
  productId: string;
  transaction?: any;
}

export interface BillingPlugin {
  initialize(): Promise<void>;
  queryProducts(options: { productIds: string[] }): Promise<{ products: Product[] }>;
  purchase(options: { productId: string }): Promise<Purchase>;
  checkSubscriptions(): Promise<{ activeSubscriptions: any[] }>;
}

// A singleton instance of our billing plugin.
let billingInstance: BillingPlugin | null = null;
let initializationPromise: Promise<BillingPlugin> | null = null;

// Default implementation for web or when the plugin is not available.
const unavailableBilling: BillingPlugin = {
  initialize: async () => console.warn('Billing plugin not available on this platform. Using mock.'),
  queryProducts: async () => {
    console.warn('Billing plugin not available. Returning empty products.');
    return { products: [] };
  },
  purchase: async (options) => {
    console.log(`Billing plugin not available. Simulating successful purchase for ${options.productId} for testing purposes.`);
    // On web, we simulate a successful purchase for testing.
    return { purchaseState: 'PURCHASED', productId: options.productId };
  },
  checkSubscriptions: async () => {
    console.warn('Billing plugin not available. Returning empty subscriptions.');
    return { activeSubscriptions: [] };
  },
};

// This function safely initializes and returns the billing plugin.
export const initializeBilling = (): Promise<BillingPlugin> => {
  if (billingInstance) {
    return Promise.resolve(billingInstance);
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise(async (resolve) => {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Billing')) {
      try {
        const plugin = registerPlugin<BillingPlugin>('Billing');
        await plugin.initialize();
        console.log("Billing plugin initialized successfully.");
        billingInstance = plugin;
        resolve(billingInstance);
      } catch (error) {
        console.error("Failed to initialize billing plugin:", error);
        billingInstance = unavailableBilling; // Fallback to unavailable
        resolve(billingInstance);
      }
    } else {
      console.warn('Billing plugin is not native or not available. Using mock implementation.');
      billingInstance = unavailableBilling;
      resolve(billingInstance);
    }
  });

  return initializationPromise;
};

// Export a getter to access the instance.
export const getBilling = (): BillingPlugin => {
    if (!billingInstance) {
        console.warn("Billing plugin has not been initialized. Returning unavailable mock. Call initializeBilling() at app startup.");
        return unavailableBilling;
    }
    return billingInstance;
}
