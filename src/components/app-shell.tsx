'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import FooterNav from './footer-nav';
import { motion } from 'framer-motion';

const protectedRoutes = ['/kesfet', '/begeniler', '/eslesmeler', '/profil'];

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
        {/* You can replace this with a proper loading spinner component */}
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (!isProtectedRoute) {
    return <>{children}</>;
  }
  
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <main className="flex-1 overflow-hidden">
         {children}
      </main>
      <FooterNav />
    </div>
  );
}
