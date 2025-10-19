
'use client';

import { useUser, useFirestore } from '@/firebase/provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import FooterNav from './footer-nav';
import { ShieldCheck, Settings, ChevronRight, AtSign } from 'lucide-react';
import { Icons } from './icons';
import { Button } from './ui/button';
import Link from 'next/link';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

// Define route categories
const protectedRoutes = ['/anasayfa', '/begeniler', '/eslesmeler', '/profil', '/ayarlar'];
const authFlowRoutes = ['/', '/login', '/tos', '/privacy', '/cookies', '/giris'];
const registrationRoute = '/profilini-tamamla';
const rulesRoute = '/kurallar';
const adminRoutes = '/admin';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const router = useRouter();

  const [hasNewLikes, setHasNewLikes] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthFlowRoute = authFlowRoutes.includes(pathname);
  const isRegistrationRoute = pathname.startsWith(registrationRoute);
  const isRulesRoute = pathname.startsWith(rulesRoute);
  const isAdminRoute = pathname.startsWith(adminRoutes);
  
  // Specific check for the dynamic chat page
  const isChatPage = /^\/eslesmeler\/[^/]+$/.test(pathname);

  // Effect for notifications
  useEffect(() => {
    if (!user || !firestore) return;

    // --- Check for new likes ---
    const likesQuery = query(
      collection(firestore, "matches"),
      where('user2Id', '==', user.uid),
      where('user1_action', '==', 'liked'),
      where('user2_action', '==', null)
    );
    const unsubscribeLikes = onSnapshot(likesQuery, (snapshot) => {
        setHasNewLikes(!snapshot.empty);
    });

    // --- Check for unread messages ---
    // This now checks the `unreadCount` field on the denormalized match data
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



  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user and profile status is resolved
    }
    
    // SCENARIO 1: User is logged in
    if (user) {
      // 1a: But profile is INCOMPLETE (we use 'gender' as the marker for a complete profile)
      if (!userProfile?.gender) {
        // If they are not on the registration page, FORCE them to it.
        if (!isRegistrationRoute) {
          router.replace(registrationRoute);
        }
      } 
      // 1b: Profile is complete, but they haven't seen the rules
      else if (!userProfile.rulesAgreed) {
          if (!isRulesRoute) {
              router.replace(rulesRoute);
          }
      }
      // 1c: And profile is COMPLETE and rules are agreed
      else {
        // If they are on a public auth or registration page, redirect to the main app.
        if (isAuthFlowRoute || isRegistrationRoute || isRulesRoute) {
          router.replace('/anasayfa');
        }
      }
    }
    // SCENARIO 2: User is NOT logged in
    else {
      // If they are trying to access a protected route, redirect to welcome page.
      if (isProtectedRoute || isRulesRoute || isAdminRoute) {
        router.replace('/');
      }
      // If they are on a public or auth-flow page (including registration), do nothing.
    }
  }, [isUserLoading, user, userProfile, pathname, router, isProtectedRoute, isAuthFlowRoute, isRegistrationRoute, isRulesRoute, isAdminRoute]);


  // Show a global loader while resolving auth/profile state,
  // especially on protected routes to prevent content flashing.
  if (isUserLoading && (isProtectedRoute || isRegistrationRoute || isRulesRoute || isAdminRoute)) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Icons.logo width={48} height={48} className="animate-pulse" />
      </div>
    );
  }
  
  // Determine if the header and footer should be shown
  const showHeaderAndFooter = userProfile?.gender && userProfile?.rulesAgreed && isProtectedRoute && !pathname.startsWith('/ayarlar/') && !isChatPage;


  if (showHeaderAndFooter) {
    const isProfilePage = pathname === '/profil';
    return (
      <div className="flex h-dvh flex-col bg-background text-foreground">
         <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b px-4">
          {isProfilePage ? (
            <>
                <Icons.logo width={80} height={26} className="text-pink-500" />
                <div className="flex items-center gap-2">
                    <Link href="/admin/dashboard">
                        <Button variant="ghost" size="icon">
                            <AtSign className="h-6 w-6 text-muted-foreground" />
                        </Button>
                    </Link>
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

  // For all other cases (public routes, login, registration, settings, chat), just render the children.
  return <>{children}</>;
}
