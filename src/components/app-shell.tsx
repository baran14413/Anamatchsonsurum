
"use client";

import { useUser, useAuth } from "@/firebase";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Icons } from "./icons";
import FooterNav from "./footer-nav";
import { Button } from "./ui/button";
import { Settings, Shield } from "lucide-react";
import { signOut } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";

const publicPaths = ["/login", "/kayit-ol", "/"];
const appRoot = "/anasayfa";

const Header = () => {
    return (
        <header className="flex items-center justify-between p-4 bg-background dark:bg-black sticky top-0 z-10 border-b">
            <Link href={appRoot} className="flex items-center gap-2 font-bold text-xl">
                 <Icons.logo className="h-8 w-8 text-primary" />
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

  const [inputBuffer, setInputBuffer] = useState('');

  const handleLogout = useCallback(async () => {
    try {
      if (auth) {
        await signOut(auth);
        router.push('/login');
        toast({
          title: 'Çıkış Yapıldı',
          description: 'Başarıyla çıkış yaptınız.',
        });
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Çıkış yapılırken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  }, [auth, router, toast]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (typeof event.key !== 'string') {
        return;
      }
      
      let newBuffer;
      if (event.key === 'Backspace') {
        newBuffer = inputBuffer.slice(0, -1);
      } else if (event.key.length === 1) {
        newBuffer = inputBuffer + event.key;
      } else {
        newBuffer = inputBuffer;
      }
      
      newBuffer = newBuffer.slice(-6);
      setInputBuffer(newBuffer);

      if (newBuffer.endsWith('/quit')) {
        handleLogout();
        setInputBuffer(''); 
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputBuffer, handleLogout]);

  useEffect(() => {
    // Wait until the authentication check is complete before doing any routing
    if (isUserLoading) {
      return; 
    }

    const isPublicPage = publicPaths.includes(pathname);

    // If there is a user
    if (user) {
      // And they are on a public page, redirect to the app root
      if (isPublicPage) {
        router.replace(appRoot);
      }
    } else {
      // If there is no user and they are on a protected page, redirect to login
      if (!isPublicPage) {
        router.replace("/login");
      }
    }
  }, [user, isUserLoading, pathname, router]);

  // While checking user auth, show a global loading screen.
  // This is the key to preventing the flicker of showing a page before the redirect happens.
  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background dark:bg-black">
        <Icons.logo className="h-24 w-24 animate-pulse text-primary" />
      </div>
    );
  }
  
  const isAppPage = !publicPaths.includes(pathname);

  // If we're on a public page, or the user is not authenticated yet for a protected page,
  // we just render the children (which might be the login page or the loading screen).
  if (!isAppPage || !user) {
    return <>{children}</>;
  }

  // If the user is authenticated and on a protected app page, render the full shell.
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
