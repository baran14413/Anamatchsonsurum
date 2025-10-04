
"use client";

import { useUser, useAuth } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Icons } from "./icons";
import FooterNav from "./footer-nav";
import { signOut } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";

const publicPaths = ["/login", "/kayit-ol", "/"];
const appRoot = "/anasayfa";

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
    if (isUserLoading) {
      return; 
    }

    const isPublicPage = publicPaths.includes(pathname);

    if (user) {
      if (isPublicPage) {
        router.replace(appRoot);
      }
    } else {
      if (!isPublicPage) {
        router.replace("/login");
      }
    }
  }, [user, isUserLoading, pathname, router]);

  if (isUserLoading && !publicPaths.includes(pathname)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background dark:bg-black">
        <Icons.logo className="h-24 w-24 animate-pulse text-primary" />
      </div>
    );
  }
  
  const isAppPage = !publicPaths.includes(pathname);

  if (isAppPage && user) {
    return (
      <div className="flex h-dvh flex-col bg-background dark:bg-black">
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

  return <>{children}</>;
}
