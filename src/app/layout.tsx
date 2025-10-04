import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/app-shell";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "BeMatch",
  description: "Aşkı Keşfet, Bağlantı Kur.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={inter.className} suppressHydrationWarning>
      <body className="h-dvh overflow-hidden bg-background dark:bg-black">
        <FirebaseClientProvider>
          <AppShell>{children}</AppShell>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
