
'use client';

import { getProductById } from '@/lib/products';
import { getFirestore, doc, updateDoc, increment, serverTimestamp, Timestamp, collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { add } from 'date-fns';

/**
 * Bu fonksiyon, TWA host'u (Android sarmalayıcı) tarafından çağrılır.
 * Google Play ödemesi başarılı olduğunda, host bu global fonksiyonu tetikler.
 */
const handleSuccessfulPurchase = async (productId: string) => {
    console.log("Handling successful purchase for:", productId);
    // Firebase servislerini doğrudan burada başlatmak en güvenilir yöntemdir.
    const auth = getAuth();
    const firestore = getFirestore();
    const user = auth.currentUser;

    if (!user) {
        console.error("User not logged in, cannot grant entitlement.");
        // Gerekirse ana uygulamaya hata mesajı gönder
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
          let expiryDate: Date = new Date();
          if (product.id.includes('1month')) {
            expiryDate = add(new Date(), { months: 1 });
          } else if (product.id.includes('6months')) {
            expiryDate = add(new Date(), { months: 6 });
          } else if (product.id.includes('12months')) {
            expiryDate = add(new Date(), { years: 1 });
          }
          updateData.goldMembershipExpiresAt = Timestamp.fromDate(expiryDate);
        } else if (product.type === 'superlike') {
          const amount = parseInt(product.id.split('.').pop() || '0');
          if(isNaN(amount)) throw new Error("Invalid superlike amount in product ID");
          updateData.superLikeBalance = increment(amount);
        }

        await updateDoc(userDocRef, updateData);
        
        // Satın alma işlemini kaydet
        await addDoc(collection(firestore, 'purchases'), {
            userId: user.uid,
            productId: productId,
            purchaseDate: serverTimestamp(),
            platform: 'android_twa' 
        });

        console.log(`Entitlement for ${product.title} granted to user ${user.uid}.`);
        
        // Başarıyı TWA host'una bildir (TWA v2 ile gerekli olmayabilir, ama iyi bir pratiktir)
        if (window.parent) {
            window.parent.postMessage({ type: 'PURCHASE_SUCCESS', productId }, '*');
        }

        // Kullanıcıyı bilgilendir
        if ((window as any).purchaseSuccessful) {
            (window as any).purchaseSuccessful(productId);
        }

    } catch (error) {
        console.error("Error granting entitlement:", error);
         if (window.parent) {
           window.parent.postMessage({ type: 'PURCHASE_ERROR', error: 'Entitlement grant failed' }, '*');
        }
    }
};

// Bu fonksiyonu global scope'a atayarak TWA tarafından erişilebilir yapıyoruz.
if (typeof window !== 'undefined') {
    (window as any).onTwaPurchaseSuccess = handleSuccessfulPurchase;
}


/**
 * Uygulama içi satın alma işlemini başlatır.
 * @param options Satın alınacak ürünün ID'sini içeren obje.
 * @throws Digital Goods API veya Play Billing servisi mevcut değilse hata fırlatır.
 */
export const purchase = async (options: { productId: string }): Promise<void> => {
    // Digital Goods API'nin varlığını kontrol et
    if (typeof (window as any).getDigitalGoodsService === 'undefined') {
        throw new Error('Uygulama içi satın alma bu cihazda veya tarayıcıda desteklenmiyor.');
    }

    try {
        // Google Play Billing servisine bağlan
        const service = await (window as any).getDigitalGoodsService("https://play.google.com/billing");
        
        if (service === null) {
            throw new Error('Google Play Ödeme servisine bağlanılamadı. Lütfen Google Play Store\'un güncel olduğundan emin olun.');
        }

        console.log("Ödeme servisine bağlanıldı, ürün için satın alma akışı başlatılıyor:", options.productId);
        
        // Google Play'in yerel ödeme ekranını açar.
        // Sonuç, TWA host'u tarafından yakalanır ve onTwaPurchaseSuccess fonksiyonu aracılığıyla geri bildirilir.
        await service.purchase({
            itemIds: [options.productId]
        });

    } catch (error: any) {
        console.error(`${options.productId} için satın alma başarısız:`, error);
        throw new Error(`Satın alma işlemi başlatılamadı: ${error.message}`);
    }
};
