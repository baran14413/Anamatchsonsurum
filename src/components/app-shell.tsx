'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import FooterNav from './footer-nav';
import { Loader2 } from 'lucide-react';

// Routes that require authentication and will be wrapped by the AppShell
const protectedRoutes = ['/anasayfa', '/kesfet', '/begeniler', '/eslesmeler', '/profil'];
// Routes that are public and should not have the AppShell
const publicRoutes = ['/', '/login', '/kayit-ol', '/kurallar', '/tos', '/privacy', '/cookies'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    // If we are not loading and the user is not logged in, and they are on a protected route, redirect to home
    if (!isUserLoading && !user && isProtectedRoute) {
      router.replace('/');
    }
  }, [isUserLoading, user, isProtectedRoute, router]);
  
  // While loading auth state on a protected route, show a loader
  if (isUserLoading && isProtectedRoute) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If it's a protected route and we have a user, show the shell with the content
  if (isProtectedRoute && user) {
    return (
      <div className="flex h-dvh flex-col bg-background text-foreground">
        <main className="flex-1 overflow-hidden">
           {children}
        </main>
        <FooterNav />
      </div>
    );
  }

  // Otherwise (e.g., on public routes like login/signup), just render the children without the shell
  return <>{children}</>;
}
