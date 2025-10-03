"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Compass, Heart, MessageSquare, User, Home } from "lucide-react";
import { Icons } from "./icons";

const navLinks = [
  { href: "/anasayfa", label: "Ana sayfa", icon: Icons.tinderFlame },
  { href: "/kesfet", label: "Keşfet", icon: Compass },
  { href: "/begeniler", label: "Beğeniler", icon: Heart },
  { href: "/sohbetler", label: "Sohbetler", icon: MessageSquare },
  { href: "/profil", label: "Profil", icon: User },
];

export default function FooterNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="grid grid-cols-5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Button
              key={href}
              asChild
              variant="ghost"
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 rounded-none text-muted-foreground",
                {
                  "text-primary": isActive,
                }
              )}
            >
              <Link href={href}>
                <Icon className={cn("h-6 w-6", { 'fill-current': isActive && href === '/anasayfa' })} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
