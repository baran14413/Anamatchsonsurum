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

// Helper function to check for the native Android interface
const isAndroidInterfaceAvailable = (): boolean => {
  return typeof window !== 'undefined' && (window as any).AndroidInterface && typeof (window as any).AndroidInterface.startPurchase === 'function';
};


let billingInstance: BillingPlugin | null = null;
let initializationPromise: Promise<BillingPlugin> | null = null;

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

const getBilling = async (): Promise<BillingPlugin | null> => {
    if (billingInstance) {
        return billingInstance;
    }
    if (initializationPromise) {
        return await initializationPromise;
    }

    initializationPromise = new Promise(async (resolve) => {
        if (Capacitor.isPluginAvailable('Billing')) {
            const plugin = registerPlugin<BillingPlugin>('Billing');
            try {
                await plugin.initialize();
                plugin.addListener('purchaseCompleted', (result: Purchase | any) => {
                    if (result && result.purchaseState === 'PURCHASED') {
                        handleSuccessfulPurchase(result as Purchase);
                    }
                });
                plugin.addListener('purchaseFailed', (error: any) => {
                    console.error('Global listener: Purchase failed', error);
                });
                billingInstance = plugin;
            } catch (err) {
                console.error("Failed to initialize Capacitor Billing plugin, using mock.", err);
                // Fallback to a mock object if initialization fails
                billingInstance = {
                    initialize: async () => {},
                    queryProducts: async () => ({ products: [] }),
                    purchase: async (options) => console.error(`Capacitor Billing not initialized. Cannot purchase ${options.productId}.`),
                    checkSubscriptions: async () => ({ activeSubscriptions: [] }),
                    addListener: async () => {}
                };
            }
        } else {
            // Fallback for environments where the plugin isn't available
             billingInstance = {
                initialize: async () => {},
                queryProducts: async () => ({ products: [] }),
                purchase: async (options) => console.error(`Capacitor Billing not available. Cannot purchase ${options.productId}.`),
                checkSubscriptions: async () => ({ activeSubscriptions: [] }),
                addListener: async () => {}
            };
        }
        resolve(billingInstance);
    });

    return initializationPromise;
};


export const purchase = async (options: { productId: string }): Promise<void> => {
  const tryPurchaseNatively = (retries: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (isAndroidInterfaceAvailable()) {
          console.log(`AndroidInterface found after ${5 - retries} retries. Initiating purchase for ${options.productId}`);
          (window as any).AndroidInterface.startPurchase(options.productId);
          resolve();
        } else if (retries > 0) {
          console.log(`AndroidInterface not found, ${retries} retries left.`);
          resolve(tryPurchaseNatively(retries - 1));
        } else {
          console.error('AndroidInterface not found after multiple attempts.');
          reject(new Error('Native purchase interface is not available.'));
        }
      }, 100); // Wait 100ms between attempts
    });
  };

  if (isAndroidInterfaceAvailable()) {
    console.log(`Attempting purchase via Android interface for product: ${options.productId}`);
    (window as any).AndroidInterface.startPurchase(options.productId);
    return;
  }

  // If the interface is not immediately available, poll for it.
  // This handles the race condition where the webview loads before the interface is injected.
  try {
    await tryPurchaseNatively(5); // Try 5 times (total of ~500ms)
  } catch (error) {
    console.error('An error occurred during the native purchase attempt:', error);
    // If native fails after all retries, fall back to the web/Capacitor method if needed,
    // or simply throw the final error.
    try {
        console.log('Falling back to Capacitor billing...');
        const billing = await getBilling();
        if (billing) {
            await billing.purchase(options);
        } else {
            throw new Error('Billing service is not available.');
        }
    } catch (fallbackError) {
        console.error('Fallback purchase method also failed:', fallbackError);
        throw fallbackError; // Re-throw the final error to be caught by the caller.
    }
  }
};


// Initialize on load if in a browser environment
if (typeof window !== 'undefined') {
    getBilling();
}