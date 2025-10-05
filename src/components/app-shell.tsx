'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import FooterNav from './footer-nav';
import { Loader2 } from 'lucide-react';
import { Icons } from './icons';

const protectedRoutes = ['/anasayfa', '/kesfet', '/begeniler', '/eslesmeler', '/profil'];
const authRoutes = ['/', '/login', '/kayit-ol', '/kurallar', '/tos', '/privacy', '/cookies'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.includes(pathname);

  useEffect(() => {
    if (isUserLoading) {
      // Still loading, do nothing yet.
      return;
    }

    if (!user && isProtectedRoute) {
      // If not logged in and trying to access a protected route, redirect to welcome page
      router.replace('/');
    } else if (user && isAuthRoute) {
      // If logged in and on a public/auth route, redirect to the main app page
      router.replace('/anasayfa');
    }
  }, [isUserLoading, user, pathname, isProtectedRoute, isAuthRoute, router]);

  if (isUserLoading && (isProtectedRoute || isAuthRoute)) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show shell for logged-in users on protected routes
  if (isProtectedRoute && user) {
    return (
      <div className="flex flex-col bg-background text-foreground h-screen">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-center border-b">
            <Icons.logo width={100} height={32} />
        </header>
        <main className="flex-1">
           {children}
        </main>
        <FooterNav />
      </div>
    );
  }

  // For public routes or when no user is logged in, just render the children
  return <>{children}</>;
}
