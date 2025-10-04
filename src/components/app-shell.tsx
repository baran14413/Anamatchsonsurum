'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import FooterNav from './footer-nav';
import { Loader2 } from 'lucide-react';
import { Icons } from './icons';

const protectedRoutes = ['/anasayfa', '/kesfet', '/begeniler', '/eslesmeler', '/profil'];
const publicRoutes = ['/', '/login', '/kayit-ol', '/kurallar', '/tos', '/privacy', '/cookies'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    if (!isUserLoading && !user && isProtectedRoute) {
      router.replace('/');
    }
  }, [isUserLoading, user, isProtectedRoute, router]);
  
  if (isUserLoading && isProtectedRoute) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isProtectedRoute && user) {
    return (
      <div className="flex h-dvh flex-col bg-background text-foreground">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-center border-b">
            <Icons.logo width={100} height={32} />
        </header>
        <main className="flex-1 overflow-hidden relative">
           {children}
        </main>
        <FooterNav />
      </div>
    );
  }

  return <>{children}</>;
}
