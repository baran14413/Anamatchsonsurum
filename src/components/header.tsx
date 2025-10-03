
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "./icons";
import { Button } from "./ui/button";
import { SlidersHorizontal, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="relative z-10 shrink-0 bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/profil" className="flex items-center gap-2">
            {/* You can add a user avatar here later */}
        </Link>

        <Link href="/anasayfa" className="flex items-center gap-2">
          <Icons.tinder className="h-8 w-auto text-primary" />
        </Link>

        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
             <SlidersHorizontal />
           </Button>
        </div>
      </div>
    </header>
  );
}
