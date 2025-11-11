
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
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
          {/*
            Google Play Billing kütüphanesi artık TWA için gerekli değil,
            çünkü ödeme işlemleri native tarafta (WebView Host) yönetilecek.
            Bu script kaldırıldı.
          */}
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <FirebaseClientProvider>
            {children}
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>

        <Script id="native-purchase-callback-script" strategy="afterInteractive">
          {`
            // Bu global fonksiyon, native Android kodu tarafından çağrılacak.
            window.onPurchaseSuccess = function(productId) {
              console.log('Satın alma başarılı: ' + productId);
              alert("Ödemeniz başarıyla tamamlandı! Ayrıcalıklarınız hesabınıza yüklendi.");
              // Burada, satın almanın başarılı olduğunu web arayüzünde
              // göstermek için ek mantık eklenebilir. Örneğin, kullanıcının
              // cüzdan sayfasını yenilemek veya bir "başarılı" mesajı göstermek.
              // window.location.reload();
            }

            window.onPurchaseFailure = function(error) {
              console.error('Satın alma hatası: ' + error);
              alert("Ödeme sırasında bir hata oluştu: " + error);
            }
          `}
        </Script>
      </body>
    </html>
  );
}
