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
        return;
    }
    
    const product = getProductById(productId);
    if (!product) {
        console.error(`Product with ID ${productId} not found.`);
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
            productId: productId,
            purchaseDate: serverTimestamp(),
            platform: 'android' // Assuming Android for now
        });

        console.log(`Entitlement for ${product.title} granted to user ${user.uid}.`);
        
        alert("Ödemeniz başarıyla tamamlandı! Ayrıcalıklarınız hesabınıza bir sonraki uygulama açılışında yüklenecektir.");

    } catch (error) {
        console.error("Error granting entitlement:", error);
    }
};


export const purchase = async (options: { productId: string }): Promise<void> => {
  const playStoreUrl = `https://play.google.com/store/apps/details?id=app.vercel.bematch_new.twa&sku=${options.productId}&launch=true`;

  try {
    // This will open the Play Store in a TWA context.
    window.location.href = playStoreUrl;

    // This is a simulation. In a real TWA, a server with Real-time Developer Notifications
    // is needed to securely verify purchases and grant entitlements. We will use a timeout
    // and an alert to guide the user for this simulation.
    setTimeout(() => {
        handleSuccessfulPurchase(options.productId);
    }, 5000); 

  } catch (error: any) {
    console.error(`Purchase failed for ${options.productId}:`, error);
    throw new Error(`Satın alma işlemi başlatılamadı: ${error.message}`);
  }
};
