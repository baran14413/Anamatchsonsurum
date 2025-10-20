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
  purchase(options: { productId: string }): Promise<Purchase | void>;
  checkSubscriptions(): Promise<{ activeSubscriptions: any[] }>;
  addListener(eventName: 'purchaseCompleted' | 'purchaseFailed', listenerFunc: (result: Purchase | any) => void): Promise<any>;
}

let billingInstance: BillingPlugin | null = null;
let initializationPromise: Promise<BillingPlugin> | null = null;

const unavailableBilling: BillingPlugin = {
  initialize: async () => console.warn('Billing plugin not available on this platform. Using mock.'),
  queryProducts: async () => {
    console.warn('Billing plugin not available. Returning empty products.');
    return { products: [] };
  },
  purchase: async (options) => {
    console.error(`Billing plugin not available. Cannot process purchase for ${options.productId}.`);
    // Return void or throw an error to indicate failure
    return;
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

export const initializeBilling = (): Promise<BillingPlugin> => {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise(async (resolve, reject) => {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Billing')) {
        const plugin = registerPlugin<BillingPlugin>('Billing');
        
        // Zorla gerçek eklentiyi başlat, hata olursa yakalama ve fırlat.
        await plugin.initialize();

        // Başarılı başlatmanın hemen ardından dinleyicileri kur.
        plugin.addListener('purchaseCompleted', (result: Purchase | any) => {
          console.log('Global listener: Purchase completed', result);
          if (result && result.purchaseState === 'PURCHASED') {
              handleSuccessfulPurchase(result as Purchase);
          }
        });

        plugin.addListener('purchaseFailed', (error: any) => {
          console.error('Global listener: Purchase failed', error);
        });

        console.log("Billing plugin initialized successfully with listeners.");
        billingInstance = plugin;
        resolve(billingInstance);

    } else {
      console.warn('Billing plugin is not native or not available. Using mock implementation.');
      billingInstance = unavailableBilling;
      resolve(billingInstance);
    }
  });

  return initializationPromise;
};

export const getBilling = async (): Promise<BillingPlugin> => {
    if (billingInstance) {
        return billingInstance;
    }
    // Eğer başlatma sözü yoksa, yeni bir tane başlat ve onun sonucunu bekle.
    if (!initializationPromise) {
        return initializeBilling();
    }
    // Eğer başlatma zaten devam ediyorsa, onun bitmesini bekle.
    return initializationPromise;
}
