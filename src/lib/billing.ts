'use client';

import { registerPlugin } from '@capacitor/core';

export interface BillingPlugin {
  initialize(): Promise<void>;
  queryProducts(options: { productIds: string[] }): Promise<{ products: any[] }>;
  purchase(options: { productId: string }): Promise<{ purchaseState: string, productId: string }>;
  checkSubscriptions(): Promise<{ activeSubscriptions: any[] }>;
}

const Billing = registerPlugin<BillingPlugin>('Billing');

export default Billing;
