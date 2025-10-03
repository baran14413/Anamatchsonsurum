
"use client";

import { useUser } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "./header";
import { Icons } from "./icons";
import FooterNav from "./footer-nav";

const publicPaths = ["/login", "/kayit-ol"];
const authPaths = ["/login", "/kayit-ol"];
const landingPage = "/";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return;

    const isPublic = publicPaths.includes(pathname) || pathname === landingPage;
    const isAuthPage = authPaths.includes(pathname);
    const isLandingPage = pathname === landingPage;

    if (!user && !isPublic) {
      router.replace("/login");
    }

    if (user && (isAuthPage || isLandingPage)) {
      router.replace("/anasayfa");
    }
  }, [user, isUserLoading, pathname, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Icons.logo className="h-24 w-24 animate-pulse text-[#FD5068]" />
      </div>
    );
  }

  const isAppPage = !publicPaths.includes(pathname) && pathname !== landingPage;

  if (isAppPage) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <Header />
        <main className="relative flex-1 overflow-hidden">{children}</main>
        <FooterNav />
      </div>
    );
  }

  return <>{children}</>;
}
