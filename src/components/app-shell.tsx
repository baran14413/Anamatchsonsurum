
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
const authRoutes = ['/giris', '/kayit'];
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
    // 1. Wait until authentication state is fully resolved. This is the most important guard.
    if (isUserLoading) {
      return;
    }

    const isAuthRoute = authRoutes.includes(pathname);
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith(adminRoutePrefix);
    const isRulesRoute = pathname === rulesRoute;

    // 2. Handle Logged-In Users
    if (user) {
      // If profile is incomplete, force to registration page.
      if (!userProfile?.gender && !isAuthRoute) {
        router.replace('/kayit');
        return;
      }
      // If rules are not agreed to, force to rules page.
      if (userProfile?.gender && !userProfile.rulesAgreed && !isRulesRoute) {
        router.replace(rulesRoute);
        return;
      }
      // If user is fully onboarded but on a public/auth route, redirect to the main app.
      if (userProfile?.rulesAgreed && (publicRoutes.includes(pathname) || isAuthRoute || isRulesRoute)) {
        router.replace('/anasayfa');
        return;
      }
    } 
    // 3. Handle Logged-Out Users
    else {
      // If a logged-out user tries to access a protected page, redirect to the welcome page.
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
  

  // Show a global loader while auth is resolving to prevent any UI flickering or incorrect rendering.
  if (isUserLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Icons.logo width={48} height={48} className="animate-pulse" />
      </div>
    );
  }
  
  const isChatPage = /^\/eslesmeler\/[^/]+$/.test(pathname);
  const isAuthPage = authRoutes.includes(pathname);

  // This is the main logic for showing the app shell.
  // It should ONLY be shown for authenticated, fully onboarded users on protected routes.
  const showHeaderAndFooter = 
      user && 
      userProfile?.rulesAgreed && 
      !isAuthPage && // CRITICAL FIX: Do NOT show shell on auth pages
      protectedRoutes.some(route => pathname.startsWith(route)) && 
      !pathname.startsWith('/ayarlar/') && 
      !isChatPage;


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

  // For ALL other cases (public routes, login, registration, settings, chat etc.), render children without the main app shell.
  // This correctly isolates the registration and login flows from the main app's UI.
  return <>{children}</>;
}
