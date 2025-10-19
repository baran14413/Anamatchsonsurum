
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
const publicAuthRoutes = ['/', '/giris', '/login', '/tos', '/privacy', '/cookies'];
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

  // Determine current route type more granularly
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicAuthRoute = publicAuthRoutes.includes(pathname);
  const isRegistrationRoute = pathname.startsWith(registrationRoute);
  const isRulesRoute = pathname.startsWith(rulesRoute);
  const isAdminRoute = pathname.startsWith(adminRoutes);
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

  // --- NEW, SIMPLIFIED ROUTING LOGIC ---
  useEffect(() => {
    // 1. Wait until authentication state is resolved.
    if (isUserLoading) {
      return;
    }

    // 2. Handle LOGGED-IN users
    if (user) {
      // 2a. Profile is incomplete -> force to registration
      if (!userProfile?.gender) {
        if (!isRegistrationRoute) {
          router.replace(registrationRoute);
        }
        return; // Stop further checks
      }
      
      // 2b. Rules not agreed -> force to rules page
      if (!userProfile.rulesAgreed) {
        if (!isRulesRoute) {
          router.replace(rulesRoute);
        }
        return; // Stop further checks
      }

      // 2c. Fully onboarded, but on a public/auth/reg page -> redirect to app
      if (isPublicAuthRoute || isRegistrationRoute || isRulesRoute) {
        router.replace('/anasayfa');
      }
      return; // Stop further checks
    }

    // 3. Handle GUEST users (NOT logged in)
    if (!user) {
      // 3a. If guest tries to access a protected area, redirect to home.
      // We specifically EXCLUDE the registration route from this check.
      if (isProtectedRoute || isRulesRoute || isAdminRoute) {
        router.replace('/');
      }
      // Otherwise, do nothing. Let them stay on public pages like /, /login, /giris, /profilini-tamamla, etc.
    }
  }, [isUserLoading, user, userProfile, pathname, router, isProtectedRoute, isPublicAuthRoute, isRegistrationRoute, isRulesRoute, isAdminRoute]);


  // Show a global loader while resolving auth/profile state.
  if (isUserLoading && (isProtectedRoute || isRegistrationRoute || isRulesRoute || isAdminRoute)) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
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
