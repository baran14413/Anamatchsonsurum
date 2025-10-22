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

        <Script id="twa-purchase-callback" strategy="afterInteractive">
          {`
            window.purchaseSuccessful = function() {
              alert("Ödemeniz başarıyla tamamlandı! Artık premium üyesiniz.");
              window.location.href = '/profil';
            }
          `}
        </Script>

      </body>
    </html>
  );
}
