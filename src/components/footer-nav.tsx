
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Compass, Heart, MessageSquare, User } from "lucide-react";
import { Icons } from "./icons";

const navLinks = [
  { href: "/anasayfa", label: "Ana sayfa", icon: Icons.tinderFlame },
  { href: "/kesfet", label: "Keşfet", icon: Compass },
  { href: "/eslesmeler", label: "Eşleşmeler", icon: Heart },
  { href: "/sohbetler", label: "Sohbetler", icon: MessageSquare },
  { href: "/profil", label: "Profil", icon: User },
];

export default function FooterNav() {
  const pathname = usePathname();

  return (
    <nav className="relative z-10 shrink-0 border-t bg-background">
      <div className="mx-auto grid h-14 max-w-md grid-cols-5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors hover:text-primary",
                {
                  "text-primary": isActive,
                }
              )}
            >
              <Icon 
                className={cn(
                  "h-6 w-6", 
                  { 'fill-current': isActive && href === '/anasayfa' }
                )} 
              />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
