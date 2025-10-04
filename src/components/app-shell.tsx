
"use client";

import { useUser, useAuth } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Icons } from "./icons";
import FooterNav from "./footer-nav";
import { signOut } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";

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
      // event.key'nin bir dize olduğundan emin olmak için kontrol ekleyin
      if (typeof event.key !== 'string') {
        return;
      }
      
      let newBuffer;
      if (event.key === 'Backspace') {
        newBuffer = inputBuffer.slice(0, -1);
      } else if (event.key.length === 1) { // Ignore keys like Shift, Control, etc.
        newBuffer = inputBuffer + event.key;
      } else {
        newBuffer = inputBuffer;
      }
      
      // Keep the buffer from growing too large
      newBuffer = newBuffer.slice(-6);
      setInputBuffer(newBuffer);

      if (newBuffer.endsWith('/quit')) {
        handleLogout();
        setInputBuffer(''); // Reset buffer after command
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

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Icons.logo className="h-24 w-24 animate-pulse text-[#FD5068]" />
      </div>
    );
  }
  
  const isAppPage = !publicPaths.includes(pathname);

  if (isAppPage && user) {
    return (
      <div className="flex h-dvh flex-col bg-background dark:bg-black">
        <main className="flex-1 overflow-hidden">{children}</main>
        <FooterNav />
      </div>
    );
  }

  return <>{children}</>;
}
