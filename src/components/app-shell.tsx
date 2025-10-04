
"use client";

import { useUser } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Icons } from "./icons";
import FooterNav from "./footer-nav";

const publicPaths = ["/login", "/kayit-ol", "/"];
const appRoot = "/anasayfa";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

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
