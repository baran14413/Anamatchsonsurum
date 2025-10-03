
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "./icons";
import { Button } from "./ui/button";
import { SlidersHorizontal, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();

  // Hide header on non-app pages
  const publicPaths = ["/login", "/kayit-ol", "/"];
  if (publicPaths.includes(pathname)) {
    return null;
  }

  return (
    <header className="relative z-20 shrink-0 bg-background dark:bg-black">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        <Link href="/anasayfa" className="flex items-center gap-2">
          <Icons.tinder className="h-8 w-auto text-primary" />
        </Link>

        <div className="flex items-center gap-1">
           <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
             <Shield className="h-6 w-6"/>
           </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
             <SlidersHorizontal className="h-6 w-6"/>
           </Button>
            <Button variant="ghost" size="icon" className="text-purple-500 hover:text-purple-400">
             <Zap className="h-6 w-6 fill-current"/>
           </Button>
        </div>
      </div>
    </header>
  );
}
