
'use client';

import { useUser, useFirestore } from '@/firebase/provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import FooterNav from './footer-nav';
import { ShieldCheck, Settings, AtSign } from 'lucide-react';
import { Icons } from './icons';
import { Button } from './ui/button';
import Link from 'next/link';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

// Define route categories
const protectedRoutes = ['/anasayfa', '/begeniler', '/eslesmeler', '/profil', '/ayarlar'];
const publicRoutes = ['/', '/tos', '/privacy', '/cookies'];
const authRoutes = ['/giris', '/profilini-tamamla'];
const rulesRoute = '/kurallar';
const adminRoutePrefix = '/admin';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const router = useRouter();

  const [hasNewLikes, setHasNewLikes] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // --- START: ROUTING LOGIC ---
  useEffect(() => {
    // 1. Do nothing while auth state is resolving. This is the most important guard.
    if (isUserLoading) {
      return;
    }

    const isAuthRoute = authRoutes.includes(pathname);
    const isPublicRoute = publicRoutes.includes(pathname);
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith(adminRoutePrefix);
    const isRulesRoute = pathname.startsWith(rulesRoute);

    // 2. Handle signed-in users
    if (user) {
      // Profile is incomplete -> force registration
      if (!userProfile?.gender && pathname !== '/profilini-tamamla') {
        router.replace('/profilini-tamamla');
        return;
      }
      // Rules are not agreed to -> force rules page
      if (userProfile?.gender && !userProfile.rulesAgreed && !isRulesRoute) {
        router.replace(rulesRoute);
        return;
      }
      // User is fully onboarded, but on a public/auth page -> redirect to app
      if (userProfile?.rulesAgreed && (isPublicRoute || isAuthRoute || isRulesRoute)) {
         if (pathname !== '/anasayfa') { // Avoid redundant navigation
            router.replace('/anasayfa');
         }
        return;
      }
    } 
    // 3. Handle signed-out users
    else {
      // If a logged-out user tries to access a protected page, redirect to home.
      if (isProtectedRoute) {
        router.replace('/');
        return;
      }
    }
  }, [isUserLoading, user, userProfile, pathname, router]);
  // --- END: ROUTING LOGIC ---


  // Effect for notifications (likes and messages)
  useEffect(() => {
    if (!user || !firestore) return;

    const likesQuery = query(
      collection(firestore, "matches"),
      where('user2Id', '==', user.uid),
      where('user1_action', '==', 'liked'),
      where('user2_action', '==', null)
    );
    const unsubscribeLikes = onSnapshot(likesQuery, (snapshot) => {
        setHasNewLikes(!snapshot.empty);
    });

    const matchesQuery = query(
        collection(firestore, `users/${user.uid}/matches`),
        where('unreadCount', '>', 0)
    );
    const unsubscribeMatches = onSnapshot(matchesQuery, (snapshot) => {
        setHasUnreadMessages(!snapshot.empty);
    }, () => setHasUnreadMessages(false));

    return () => {
        unsubscribeLikes();
        unsubscribeMatches();
    };
  }, [user, firestore]);
  

  // Show a global loader while auth is resolving to prevent flickers.
  if (isUserLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Icons.logo width={48} height={48} className="animate-pulse" />
      </div>
    );
  }
  
  // Determine if the header and footer should be shown
  const isChatPage = /^\/eslesmeler\/[^/]+$/.test(pathname);
  const showHeaderAndFooter = user && userProfile?.rulesAgreed && protectedRoutes.some(route => pathname.startsWith(route)) && !pathname.startsWith('/ayarlar/') && !isChatPage;

  if (showHeaderAndFooter) {
    const isProfilePage = pathname === '/profil';
    return (
      <div className="flex h-dvh flex-col bg-background text-foreground">
         <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b px-4">
          {isProfilePage ? (
            <>
                <Icons.logo width={80} height={26} className="text-pink-500" />
                <div className="flex items-center gap-2">
                    {userProfile?.isAdmin && (
                        <Link href="/admin/dashboard">
                            <Button variant="ghost" size="icon">
                                <AtSign className="h-6 w-6 text-muted-foreground" />
                            </Button>
                        </Link>
                    )}
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
        <FooterNav hasNewLikes={hasNewLikes} hasUnreadMessages={hasUnreadMessages} />
      </div>
    );
  }

  // For all other cases (public routes, login, registration, settings, chat etc.) render children without the main shell.
  return <>{children}</>;
}
