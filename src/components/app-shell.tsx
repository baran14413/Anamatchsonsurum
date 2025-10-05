
'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import FooterNav from './footer-nav';
import { Loader2, ShieldCheck, Settings } from 'lucide-react';
import { Icons } from './icons';
import { Button } from './ui/button';
import Link from 'next/link';

// Define route categories
const protectedRoutes = ['/anasayfa', '/kesfet', '/begeniler', '/eslesmeler', '/profil', '/ayarlar'];
const authFlowRoutes = ['/', '/login', '/tos', '/privacy', '/cookies'];
const registrationRoute = '/kayit-ol';


export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthFlowRoute = authFlowRoutes.includes(pathname);
  const isRegistrationRoute = pathname.startsWith(registrationRoute);

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user and profile status is resolved
    }

    // SCENARIO 1: User is logged in
    if (user) {
      // 1a: But profile is INCOMPLETE (we use 'gender' as the marker for a complete profile)
      if (!userProfile) {
        // If they are not on the registration page, FORCE them to it.
        if (!isRegistrationRoute) {
          router.replace(registrationRoute);
        }
        // If they are already on the registration page, do nothing.
      }
      // 1b: And profile is COMPLETE
      else {
        // If they are on a public auth or registration page, redirect to the main app.
        if (isAuthFlowRoute || isRegistrationRoute) {
          router.replace('/anasayfa');
        }
      }
    }
    // SCENARIO 2: User is NOT logged in
    else {
      // If they are trying to access a protected route, redirect to welcome page.
      if (isProtectedRoute) {
        router.replace('/');
      }
      // If they are on a public or auth-flow page, do nothing.
    }
  }, [isUserLoading, user, userProfile, pathname, router, isProtectedRoute, isAuthFlowRoute, isRegistrationRoute]);


  // Show a global loader while resolving auth/profile state,
  // especially on protected routes to prevent content flashing.
  if (isUserLoading && (isProtectedRoute || isRegistrationRoute)) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Determine if the header and footer should be shown
  const showHeaderAndFooter = userProfile && isProtectedRoute && pathname !== '/ayarlar' && !pathname.startsWith('/ayarlar/');

  if (showHeaderAndFooter) {
    const isProfilePage = pathname === '/profil';
    return (
      <div className="flex h-dvh flex-col bg-background text-foreground">
         <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b px-4">
          {isProfilePage ? (
            <>
                <Icons.logo width={80} height={26} className="text-pink-500" />
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                    </Button>
                    <Link href="/ayarlar">
                      <Button variant="ghost" size="icon">
                          <Settings className="h-6 w-6 text-muted-foreground" />
                      </Button>
                    </Link>
                </div>
            </>
          ) : (
            <div className='flex-1 flex justify-center'>
                 <Icons.logo width={80} height={26} />
            </div>
          )}
        </header>
        <main className="flex-1 overflow-y-auto">
           {children}
        </main>
        <FooterNav />
      </div>
    );
  }

  // For all other cases (public routes, login, registration, settings without footer), just render the children.
  return <>{children}</>;
}
