
'use client';

import { useUser, useFirestore } from '@/firebase/provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Settings, Flame, Heart, MessageSquare, User, Globe } from 'lucide-react';
import { Icons } from './icons';
import { Button } from './ui/button';
import Link from 'next/link';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
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
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';


export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, userProfile, auth, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const { toast } = useToast();
  const t = langTr;
  const router = useRouter();

  useNotificationHandler(toast);

  const [hasNewLikes, setHasNewLikes] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const handleAdminLogin = () => {
    if (adminPassword === 'admin') {
      sessionStorage.setItem('admin_access', 'granted');
      router.push('/admin/dashboard');
    } else {
      toast({
        title: 'Hatalı Şifre',
        description: 'Admin paneline erişim için girdiğiniz şifre yanlış.',
        variant: 'destructive',
      });
    }
  };
  
    useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          router.back();
        } else {
          App.exitApp();
        }
      });
    }

    return () => {
      // Clean up the listener when the component unmounts
      if (Capacitor.isNativePlatform()) {
        App.removeAllListeners();
      }
    };
  }, [router]);


  useEffect(() => {
    if (isUserLoading) {
        return; // Wait until user status is resolved
    }

    if (user && !userProfile?.rulesAgreed) {
        if (pathname !== '/kurallar' && pathname !== '/profil/galeri') {
            router.replace('/profil/galeri');
        }
    } else if (!user) {
        // Allow access to public pages
        const publicPages = ['/', '/giris', '/kayit', '/tos', '/privacy', '/cookies', '/sifremi-unuttum'];
        if (!publicPages.includes(pathname)) {
            router.replace('/');
        }
    }
  }, [user, userProfile, isUserLoading, pathname, router]);


  // Effect for notifications (likes and messages)
  useEffect(() => {
    if (!user || !firestore) return;

    const likesQuery = query(
        collection(firestore, `users/${user.uid}/matches`), 
        where('status', 'in', ['pending', 'superlike_pending']),
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
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: t.ayarlar.toasts.logoutErrorTitle,
        description: t.ayarlar.toasts.logoutErrorDesc,
        variant: "destructive"
      });
    }
  };
  
    const navItems = [
      { href: '/anasayfa', icon: Flame, label: t.footerNav.home, hasNotification: false },
      { href: '/begeniler', icon: Heart, label: t.footerNav.likes, hasNotification: hasNewLikes },
      { href: '/eslesmeler', icon: MessageSquare, label: t.footerNav.chats, hasNotification: hasUnreadMessages },
      { href: '/profil', icon: User, label: t.footerNav.profile, hasNotification: false },
    ];
    
    // Determine if the AppShell UI should be shown
    const showAppUI = user && userProfile?.rulesAgreed;

    if (isUserLoading) {
      return <div className="flex h-dvh items-center justify-center bg-background"><Icons.logo width={48} height={48} className="animate-pulse" /></div>;
    }
    
    if (!showAppUI) {
      // For public pages or onboarding, just render the children without the shell
      return <>{children}</>;
    }


    return (
     <AlertDialog>
      <div className="flex h-dvh flex-col bg-background text-foreground">
         <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
            <div className="flex items-center gap-2">
                <Link href="/anasayfa">
                    <Icons.logo width={100} height={35} />
                </Link>
            </div>

            <div className='flex items-center gap-1'>
                 <TooltipProvider>
                    {navItems.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>
                            <Link href={item.href}>
                              <Button variant='ghost' size='icon' className="relative rounded-full h-10 w-10">
                                  <item.icon className={cn("h-6 w-6 transition-colors", isActive ? "text-red-500" : "text-muted-foreground hover:text-foreground/80")} />
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
                      )
                    })}
                </TooltipProvider>

                <Link href="/ayarlar">
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </Link>
            </div>
        </header>
        <main className="flex-1 flex flex-col overflow-hidden">
           {children}
        </main>
      </div>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Admin Girişi</AlertDialogTitle>
          <AlertDialogDescription>
            Yönetici paneline erişmek için lütfen şifreyi girin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
            <Input 
                type="password"
                placeholder="Şifre"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setAdminPassword('')}>İptal</AlertDialogCancel>
          <AlertDialogAction onClick={handleAdminLogin}>Giriş Yap</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
     </AlertDialog>
    );
}

    