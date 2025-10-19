
'use client';

import { useUser, useFirestore } from '@/firebase/provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldCheck, Settings, AtSign, Plus, Flame, Heart, MessageSquare, User, LogOut } from 'lucide-react';
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
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotificationHandler } from '@/lib/notifications';


// Define route categories
const protectedRoutes = ['/anasayfa', '/begeniler', '/eslesmeler', '/profil', '/ayarlar', '/market'];
const publicRoutes = ['/', '/tos', '/privacy', '/cookies'];
const authRoutes = ['/giris', '/kayit'];
const rulesRoute = '/kurallar';
const adminRoutePrefix = '/admin';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, userProfile, auth, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const t = langTr;

  useNotificationHandler(toast);

  const [hasNewLikes, setHasNewLikes] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // --- START: ROUTING LOGIC ---
  useEffect(() => {
    // Wait until user status is fully resolved before attempting any redirects.
    // This now checks for both loading states to prevent race conditions.
    if (isUserLoading || (user && !userProfile)) {
      return;
    }

    const isAuthRoute = authRoutes.includes(pathname);
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith(adminRoutePrefix);
    const isRulesRoute = pathname === rulesRoute;

    if (user) {
      if (userProfile && userProfile.isAdmin && pathname.startsWith('/admin')) {
        return; // Admin on admin page, do nothing.
      }
      
      // If user is logged in but hasn't agreed to rules, force them to the rules page.
      if (userProfile && !userProfile.rulesAgreed && !isRulesRoute) {
        router.replace(rulesRoute);
        return;
      }
      
      // If user is fully onboarded, but is on a public, auth, or rules page, redirect to home.
      if (userProfile?.rulesAgreed && (publicRoutes.includes(pathname) || isAuthRoute || isRulesRoute)) {
        router.replace('/anasayfa');
        return;
      }
    } 
    else {
      // If user is not logged in, but is trying to access a protected page, redirect to welcome page.
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
        collection(firestore, `users/${user.uid}/matches`), 
        where('status', '==', 'superlike_pending'),
        where('superLikeInitiator', '!=', user.uid)
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

   const handleLogout = async () => {
    if (!auth) return;
    setIsLoggingOut(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: t.ayarlar.toasts.logoutErrorTitle,
        description: t.ayarlar.toasts.logoutErrorDesc,
        variant: "destructive"
      });
      setIsLoggingOut(false);
    }
  };
  
  // This is the most crucial part. While user status is loading,
  // or if the user is logged in but profile data is not yet available, show a full-screen loader.
  // This prevents any "flicker" of other pages.
  if (isUserLoading || (user && !userProfile)) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Icons.logo width={48} height={48} className="animate-pulse" />
      </div>
    );
  }
  
  const isAuthPage = authRoutes.includes(pathname);
  const isWelcomePage = pathname === '/';
  const isAdminPage = pathname.startsWith('/admin');

  // The main app UI is shown only if the user is fully onboarded (logged in AND agreed to rules)
  const showAppUI = user && userProfile?.rulesAgreed && !isAuthPage && !isWelcomePage;

  // Render the main app UI only when the user is fully authenticated and onboarded.
  if (showAppUI && !isAdminPage) {
    const navItems = [
      { href: '/anasayfa', icon: Flame, label: t.footerNav.home, hasNotification: false },
      { href: '/begeniler', icon: Heart, label: t.footerNav.likes, hasNotification: hasNewLikes },
      { href: '/eslesmeler', icon: MessageSquare, label: t.footerNav.chats, hasNotification: hasUnreadMessages },
      { href: '/profil', icon: User, label: t.footerNav.profile, hasNotification: false },
    ];

    return (
      <div className="flex h-dvh flex-col bg-background text-foreground">
         <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
            <Link href="/anasayfa">
              <Icons.logo width={32} height={32} />
            </Link>

            <div className='flex items-center gap-1'>
                 <TooltipProvider>
                    {navItems.map((item) => (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <Link href={item.href}>
                            <Button variant='ghost' size='icon' className={cn("relative rounded-full h-10 w-10", pathname.startsWith(item.href) && "bg-muted")}>
                                <item.icon className={cn("h-5 w-5", pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground")} />
                                {item.hasNotification && (
                                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                                )}
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                </TooltipProvider>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                            <Settings className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <DropdownMenuItem asChild>
                           <Link href="/ayarlar">
                            <Settings className='mr-2'/>
                            <span>Ayarlar ve Hareketler</span>
                           </Link>
                        </DropdownMenuItem>
                         {userProfile?.isAdmin && (
                            <DropdownMenuItem asChild>
                               <Link href="/admin/dashboard">
                                 <AtSign className='mr-2'/>
                                 <span>Yönetici Paneli</span>
                               </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className='text-red-500 focus:text-red-500'>
                            <LogOut className='mr-2'/>
                            <span>Çıkış Yap</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

            </div>
        </header>
        <main className="flex-1 flex flex-col overflow-hidden">
           {children}
        </main>
      </div>
    );
  }

  // If none of the above conditions are met, render the children directly.
  // This handles the welcome page, auth pages, rules page, and the admin layout.
  // The loader at the top of the component prevents this from rendering until data is ready.
  return <>{children}</>;
}
