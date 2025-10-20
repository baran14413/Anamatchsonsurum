'use client';

import { Capacitor, registerPlugin } from '@capacitor/core';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  // Diğer olası alanlar
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

// Eklentiyi sarmalayan ve platform kontrolü yapan daha güvenli bir yapı
const initializeBilling = (): BillingPlugin => {
  if (Capacitor.isPluginAvailable('Billing')) {
    // Eklenti sadece mevcutsa ve native platformdaysa yükle
    return registerPlugin<BillingPlugin>('Billing');
  } else {
    // Eklenti mevcut değilse (örneğin web'de), konsola uyarı veren sahte bir implementasyon döndür.
    // Bu, kodun hata vermesini engeller.
    const unavailablePlugin: BillingPlugin = {
      initialize: async () => console.warn('Billing plugin not available.'),
      queryProducts: async () => {
        console.warn('Billing plugin not available.');
        return { products: [] };
      },
      purchase: async (options) => {
        console.warn(`Billing plugin not available. Purchase for ${options.productId} cannot be completed.`);
        return { purchaseState: 'FAILED', productId: options.productId };
      },
      checkSubscriptions: async () => {
        console.warn('Billing plugin not available.');
        return { activeSubscriptions: [] };
      },
    };
    return unavailablePlugin;
  }
};

const Billing = initializeBilling();

export default Billing;
