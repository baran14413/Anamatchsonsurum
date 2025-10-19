
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
const publicAuthRoutes = ['/', '/giris', '/login', '/tos', '/privacy', '/cookies'];
const registrationRoute = '/profilini-tamamla';
const rulesRoute = '/kurallar';
const adminRoutePrefix = '/admin';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const router = useRouter();

  const [hasNewLikes, setHasNewLikes] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // Determine current route type
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicAuthRoute = publicAuthRoutes.includes(pathname);
  const isRegistrationRoute = pathname.startsWith(registrationRoute);
  const isRulesRoute = pathname.startsWith(rulesRoute);
  const isAdminRoute = pathname.startsWith(adminRoutePrefix);
  const isChatPage = /^\/eslesmeler\/[^/]+$/.test(pathname);

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
  
  // --- Simplified and Corrected Routing Logic ---
  useEffect(() => {
    // If auth state is still loading, do nothing to prevent premature redirects.
    if (isUserLoading) {
      return;
    }

    if (user) {
      // User is logged in.
      // 1. Check for incomplete profile.
      if (!userProfile?.gender) {
        if (!isRegistrationRoute) {
          router.replace(registrationRoute);
        }
        return; // Stop further checks.
      }
      // 2. Check for rules agreement.
      if (!userProfile.rulesAgreed) {
        if (!isRulesRoute) {
          router.replace(rulesRoute);
        }
        return; // Stop further checks.
      }
      // 3. User is fully onboarded. If they are on a public/auth/reg page, redirect to app.
      if (isPublicAuthRoute || isRegistrationRoute || isRulesRoute) {
        router.replace('/anasayfa');
      }
    } else {
      // User is NOT logged in.
      // Protect routes that require authentication.
      if (isProtectedRoute || isRulesRoute || isAdminRoute) {
        router.replace('/');
      }
      // Guests are allowed on publicAuthRoutes and registrationRoute, so no 'else' block is needed.
    }
  }, [user, userProfile, isUserLoading, pathname, router, isProtectedRoute, isPublicAuthRoute, isRegistrationRoute, isRulesRoute, isAdminRoute]);


  // Show a global loader for protected areas while auth is resolving.
  if (isUserLoading && (isProtectedRoute || isRegistrationRoute || isRulesRoute || isAdminRoute)) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Icons.logo width={48} height={48} className="animate-pulse" />
      </div>
    );
  }
  
  // Determine if the header and footer should be shown
  const showHeaderAndFooter = user && userProfile?.gender && userProfile?.rulesAgreed && isProtectedRoute && !pathname.startsWith('/ayarlar/') && !isChatPage;

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

  // For all other cases (public routes, login, registration, settings, chat, loading), just render the children.
  return <>{children}</>;
}
