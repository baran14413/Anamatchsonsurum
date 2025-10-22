'use client';

import { products, getProductById } from '@/lib/products';
import { getFirestore, doc, updateDoc, increment, serverTimestamp, Timestamp, collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { add } from 'date-fns';

export const purchase = async (options: { productId: string }): Promise<void> => {
  // Web-based billing is not implemented yet.
  // We will reject the promise to be caught by the UI handler.
  return Promise.reject(new Error("Web ödeme sistemi henüz aktif değil."));
};

// The following functions are kept for data structure reference but are not actively used in the simplified web flow.

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
        
        // This function would be called by the native side if purchase is successful
        if (typeof (window as any).purchaseSuccessful === 'function') {
            (window as any).purchaseSuccessful();
        }
        
    } catch (error) {
        console.error("Error granting entitlement:", error);
    }
};
