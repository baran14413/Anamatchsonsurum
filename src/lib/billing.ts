
'use client';

/**
 * Bu dosya, bir Android WebView içinde çalışan web uygulamasının,
 * native Android koduyla (Java/Kotlin) Google Play Faturalandırma
 * işlemleri için nasıl iletişim kuracağını gösterir.
 */

declare global {
  interface Window {
    // AndroidWrapper, MainActivity'de tanımlanan JavaScript arayüzünün adıdır.
    AndroidWrapper?: {
      purchase: (productId: string) => void;
      registerFCMToken: (token: string) => void;
    };
  }
}

/**
 * Android'in JavaScript arayüzünü çağırarak satın alma işlemini başlatır.
 * @param productId Google Play Console'da tanımlanan ürün ID'si.
 */
export const purchase = (productId: string): void => {
  if (window.AndroidWrapper && typeof window.AndroidWrapper.purchase === 'function') {
    console.log(`[WebView Billing] purchase fonksiyonu çağrılıyor: ${productId}`);
    window.AndroidWrapper.purchase(productId);
  } else {
    // TWA veya tarayıcı için fallback
    console.warn('[WebView Billing] AndroidWrapper bulunamadı. Standart tarayıcı akışı deneniyor veya hata veriliyor.');
    // Gerekirse burada TWA için olan `getDigitalGoodsService` mantığı eklenebilir.
    // Şimdilik, sadece WebView ortamında çalışacağını varsayıyoruz.
    throw new Error('Satın alma işlemi yalnızca mobil uygulamada desteklenmektedir.');
  }
};
