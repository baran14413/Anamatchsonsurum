
'use client';

import { useUser, useFirestore } from '@/firebase/provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldCheck, Settings, AtSign, Plus, Flame, Heart, MessageSquare, User } from 'lucide-react';
import { Icons } from './icons';
import { Button } from './ui/button';
import Link from 'next/link';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { langTr } from '@/languages/tr';


// Define route categories
const protectedRoutes = ['/anasayfa', '/begeniler', '/eslesmeler', '/profil', '/ayarlar', '/market'];
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
      if(userProfile && userProfile.isAdmin && pathname.startsWith('/admin')) {
        return;
      }
      
      // If rules are not agreed to, force to rules page.
      if (userProfile && !userProfile.rulesAgreed && !isRulesRoute) {
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
  
  const isAuthPage = authRoutes.includes(pathname);
  const isWelcomePage = pathname === '/';
  const isAdminPage = pathname.startsWith('/admin');

  const showAppUI = user && userProfile?.rulesAgreed && !isAuthPage && !isWelcomePage && !isAdminPage;

  if (showAppUI) {
    const navItems = [
      { href: '/anasayfa', icon: Flame, label: langTr.footerNav.home, hasNotification: false },
      { href: '/begeniler', icon: Heart, label: langTr.footerNav.likes, hasNotification: hasNewLikes },
      { href: '/eslesmeler', icon: MessageSquare, label: langTr.footerNav.chats, hasNotification: hasUnreadMessages },
      { href: '/profil', icon: User, label: langTr.footerNav.profile, hasNotification: false },
    ];

    return (
      <div className="flex h-dvh flex-col bg-background text-foreground">
         <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
                <Link href="/ayarlar">
                    <Button variant="ghost" size="icon">
                        <Settings className="h-6 w-6 text-muted-foreground" />
                    </Button>
                </Link>
                {userProfile?.isAdmin && (
                    <Link href="/admin/dashboard">
                        <Button variant="ghost" size="icon">
                            <AtSign className="h-6 w-6 text-muted-foreground" />
                        </Button>
                    </Link>
                )}
            </div>

            <Icons.logo width={80} height={26} />

             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                        <Plus className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    {navItems.map((item) => (
                         <Link href={item.href} key={item.href}>
                            <DropdownMenuItem className={cn("py-2.5", pathname.startsWith(item.href) && "bg-accent")}>
                                <item.icon className="mr-3 h-5 w-5" />
                                <span>{item.label}</span>
                                {item.hasNotification && (
                                    <span className="ml-auto w-2 h-2 rounded-full bg-primary" />
                                )}
                            </DropdownMenuItem>
                        </Link>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

        </header>
        <main className="flex-1 flex flex-col overflow-hidden">
           {children}
        </main>
      </div>
    );
  }

  // For ALL other cases (public routes, login, registration, settings, chat etc.), render children without the main app shell.
  // This correctly isolates the registration and login flows from the main app's UI.
  return <>{children}</>;
}
