"use client";

import { useUser } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "./header";
import { Icons } from "./icons";

const publicPaths = ["/", "/login", "/kayit-ol"];
const authPaths = ["/login", "/kayit-ol"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return;

    const isPublic = publicPaths.includes(pathname);
    const isAuthPage = authPaths.includes(pathname);

    if (!user && !isPublic) {
      router.replace("/login");
    }

    if (user && isAuthPage) {
      router.replace("/anasayfa");
    }
  }, [user, isUserLoading, pathname, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Icons.logo className="h-24 w-24 animate-pulse text-primary" />
      </div>
    );
  }

  const isAppPage = !publicPaths.includes(pathname);

  if (isAppPage) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return <>{children}</>;
}
