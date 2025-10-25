
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseProvider } from "@/firebase/provider";
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/theme-provider";
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "BeMatch",
  description: "Discover Love, Connect.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={inter.className} suppressHydrationWarning>
       <head>
          {/* Google Play Billing kütüphanesini yüklüyoruz */}
          <Script
            src="https://play.google.com/billing/ui/v1/billing-ui-v1.js"
            strategy="beforeInteractive"
          />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <FirebaseProvider>
            {children}
          </FirebaseProvider>
          <Toaster />
        </ThemeProvider>
        
        {/* Satın alma başarılı olduğunda çağrılacak global fonksiyon */}
        <Script id="twa-purchase-callback-script" strategy="afterInteractive">
          {`
            window.purchaseSuccessful = function(productId) {
              console.log('Purchase successful for ' + productId);
              alert("Ödemeniz başarıyla tamamlandı! Ayrıcalıklarınız hesabınıza yüklendi. Değişikliklerin geçerli olması için lütfen uygulamayı yeniden başlatın.");
              // Gerekirse burada sayfayı yenileyebilir veya kullanıcıyı başka bir sayfaya yönlendirebilirsiniz.
              // Örneğin: window.location.href = '/cuzdanim'; 
            }
          `}
        </Script>
      </body>
    </html>
  );
}
