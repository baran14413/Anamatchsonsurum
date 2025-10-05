'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import FooterNav from './footer-nav';
import { Loader2, ShieldCheck, Settings } from 'lucide-react';
import { Icons } from './icons';
import { Button } from './ui/button';

const protectedRoutes = ['/anasayfa', '/kesfet', '/begeniler', '/eslesmeler', '/profil'];
const authRoutes = ['/', '/login', '/kayit-ol', '/kurallar', '/tos', '/privacy', '/cookies'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  useEffect(() => {
    // This effect now ONLY handles redirecting unauthenticated users from protected routes.
    // It no longer handles redirecting authenticated users from public routes.
    if (isUserLoading) {
      return; // Wait until user status is resolved
    }

    if (!user && isProtectedRoute) {
      // If not logged in and trying to access a protected route, redirect to welcome page
      router.replace('/');
    }
  }, [isUserLoading, user, isProtectedRoute, router]);


  // While loading user state, show a loader for protected routes.
  if (isUserLoading && isProtectedRoute) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If the route is not protected, or if the user is loaded, render the content.
  // For protected routes, this will only render if the user is authenticated (due to the redirect above).
  const isProfilePage = pathname === '/profil';

  if (isProtectedRoute && user) {
    return (
      <div className="flex h-screen flex-col bg-background text-foreground">
        <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b px-4">
          {isProfilePage ? (
            <>
                <Icons.logo width={80} height={26} className="text-pink-500" />
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Settings className="h-6 w-6 text-muted-foreground" />
                    </Button>
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

  // For public routes, just render the children.
  // This will also handle the case where a user is logged in but on a public page,
  // letting the page-level logic (like in page.tsx) handle the redirect.
  return <>{children}</>;
}
