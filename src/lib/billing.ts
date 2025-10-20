'use client';

import { Capacitor, registerPlugin } from '@capacitor/core';
import { products, getProductById } from '@/lib/products';
import { getFirestore, doc, updateDoc, increment, serverTimestamp, Timestamp, collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { add } from 'date-fns';

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
  // Eklentinin olayları dinleyebilmesi için bu metodun var olduğunu varsayıyoruz
  addListener(eventName: 'purchaseCompleted' | 'purchaseFailed', listenerFunc: (result: Purchase) => void): Promise<any>;
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
    // On web, we simulate a successful purchase for testing and trigger the handler directly.
    const fakePurchase: Purchase = { purchaseState: 'PURCHASED', productId: options.productId };
    handleSuccessfulPurchase(fakePurchase);
    return fakePurchase;
  },
  checkSubscriptions: async () => {
    console.warn('Billing plugin not available. Returning empty subscriptions.');
    return { activeSubscriptions: [] };
  },
  addListener: async () => { console.log("addListener called on unavailable billing"); }
};


const handleSuccessfulPurchase = async (purchase: Purchase) => {
    console.log("Handling successful purchase:", purchase);
    const auth = getAuth();
    const firestore = getFirestore();
    const user = auth.currentUser;

    if (!user) {
        console.error("User not logged in, cannot grant entitlement.");
        return;
    }
    
    const product = getProductById(purchase.productId);
    if (!product) {
        console.error(`Product with ID ${purchase.productId} not found.`);
        return;
    }

    try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const updateData: any = {};
        
        if (product.type === 'gold') {
          updateData.membershipType = 'gold';
          let expiryDate: Date | null = new Date();
          if (product.id.includes('1month')) {
            expiryDate = add(new Date(), { months: 1 });
          } else if (product.id.includes('6months')) {
            expiryDate = add(new Date(), { months: 6 });
          } else if (product.id.includes('1year')) {
            expiryDate = add(new Date(), { years: 1 });
          }
          updateData.goldMembershipExpiresAt = Timestamp.fromDate(expiryDate);
        } else if (product.type === 'superlike') {
          const amount = parseInt(product.id.split('.').pop() || '0');
          updateData.superLikeBalance = increment(amount);
        }

        await updateDoc(userDocRef, updateData);
        
        await addDoc(collection(firestore, 'purchases'), {
            userId: user.uid,
            productId: purchase.productId,
            purchaseDate: serverTimestamp(),
            ...purchase
        });

        console.log(`Entitlement for ${product.title} granted to user ${user.uid}.`);
        
    } catch (error) {
        console.error("Error granting entitlement:", error);
    }
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

        // Setup global listeners for purchase events
        plugin.addListener('purchaseCompleted', (purchase: Purchase) => {
          console.log('Global listener: Purchase completed', purchase);
          if (purchase.purchaseState === 'PURCHASED') {
              handleSuccessfulPurchase(purchase);
          }
        });

        plugin.addListener('purchaseFailed', (error: any) => {
          console.error('Global listener: Purchase failed', error);
        });

        console.log("Billing plugin initialized successfully with listeners.");
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
