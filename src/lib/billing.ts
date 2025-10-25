'use client';

import { products, getProductById } from '@/lib/products';
import { getFirestore, doc, updateDoc, increment, serverTimestamp, Timestamp, collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { add } from 'date-fns';


const handleSuccessfulPurchase = async (productId: string) => {
    console.log("Handling successful purchase for:", productId);
    const auth = getAuth();
    const firestore = getFirestore();
    const user = auth.currentUser;

    if (!user) {
        console.error("User not logged in, cannot grant entitlement.");
        if (window.parent) {
             window.parent.postMessage({ type: 'PURCHASE_ERROR', error: 'User not logged in' }, '*');
        }
        return;
    }
    
    const product = getProductById(productId);
    if (!product) {
        console.error(`Product with ID ${productId} not found.`);
         if (window.parent) {
             window.parent.postMessage({ type: 'PURCHASE_ERROR', error: `Product ${productId} not found` }, '*');
        }
        return;
    }

    try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const updateData: any = {};
        
        if (product.type === 'gold') {
          updateData.membershipType = 'gold';
          let expiryDate: Date = new Date();
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
            productId: productId,
            purchaseDate: serverTimestamp(),
            platform: 'android' 
        });

        console.log(`Entitlement for ${product.title} granted to user ${user.uid}.`);
        
        if (window.purchaseSuccessful) {
            window.purchaseSuccessful(productId);
        }

    } catch (error) {
        console.error("Error granting entitlement:", error);
        if (window.parent) {
           window.parent.postMessage({ type: 'PURCHASE_ERROR', error: 'Error granting entitlement' }, '*');
        }
    }
};

// This function will be called from the TWA host.
if (typeof window !== 'undefined') {
    (window as any).onTwaPurchaseSuccess = handleSuccessfulPurchase;
}


export const purchase = async (options: { productId: string }): Promise<void> => {
    if (typeof (window as any).getDigitalGoodsService === 'undefined') {
        throw new Error('Digital Goods API is not available in this browser.');
    }

    try {
        const service = await (window as any).getDigitalGoodsService("https://play.google.com/billing");
        
        if (service === null) {
            throw new Error('Google Play Billing service is not available.');
        }

        console.log("Service obtained, launching purchase flow for:", options.productId);
        
        // This will open the native Google Play purchase sheet.
        // The result will be handled by the TWA host and communicated back via onTwaPurchaseSuccess.
        await service.purchase({
            itemIds: [options.productId]
        });

    } catch (error: any) {
        console.error(`Purchase failed for ${options.productId}:`, error);
        throw new Error(`Satın alma işlemi başlatılamadı: ${error.message}`);
    }
};
