"use client";

import { useUser, useAuth } from "@/firebase";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { Icons } from "./icons";
import FooterNav from "./footer-nav";
import { Button } from "./ui/button";
import { Settings, Shield } from "lucide-react";
import { signOut } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { langTr } from "@/languages/tr";

const publicPaths = ["/", "/login", "/kayit-ol", "/kurallar", "/tos", "/privacy", "/cookies"];
const appRoot = "/anasayfa";

const Header = () => {
    return (
        <header className="flex items-center justify-between p-4 bg-background dark:bg-black sticky top-0 z-10 border-b shrink-0">
            <Link href={appRoot} className="flex items-center gap-2 font-bold text-xl">
                 <Icons.logo width={32} height={32} />
                 <span>BeMatch</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/profil/duzenle">
                <Button variant="ghost" size="icon">
                  <Shield className="h-6 w-6 text-muted-foreground" />
                </Button>
              </Link>
              <Link href="/profil/duzenle">
                <Button variant="ghost" size="icon">
                  <Settings className="h-6 w-6 text-muted-foreground" />
                </Button>
              </Link>
            </div>
      </header>
    )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const t = langTr;

  const handleLogout = useCallback(async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.replace('/'); 
      toast({
        title: t.ayarlar.toasts.logoutSuccessTitle,
        description: t.ayarlar.toasts.logoutSuccessDesc,
      });
    } catch (error) {
      toast({
        title: t.ayarlar.toasts.logoutErrorTitle,
        description: t.ayarlar.toasts.logoutErrorDesc,
        variant: 'destructive',
      });
    }
  }, [auth, router, toast, t]);

  useEffect(() => {
    if (pathname === '/quit') {
      handleLogout();
    }
  }, [pathname, handleLogout]);

  useEffect(() => {
    if (isUserLoading) return;

    const isPublicPage = publicPaths.some(path => pathname.startsWith(path));

    if (user && isPublicPage) {
      router.replace(appRoot);
    } else if (!user && !isPublicPage) {
      router.replace("/");
    }
  }, [user, isUserLoading, pathname, router]);

  if (isUserLoading || pathname === '/quit') {
    return (
      <div className="flex h-screen items-center justify-center bg-background dark:bg-black">
        <Icons.logo className="h-24 w-24 animate-pulse" />
      </div>
    );
  }
  
  const isAppPage = user && !publicPaths.some(path => pathname.startsWith(path));

  if (!isAppPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-dvh flex-col bg-background dark:bg-black">
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-hidden"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <FooterNav />
    </div>
  );
}
