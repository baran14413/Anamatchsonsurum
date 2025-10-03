
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
    <nav className="relative z-20 shrink-0 border-t bg-background dark:bg-black">
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center justify-items-center">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary",
                isActive ? "text-primary" : "text-gray-500"
              )}
            >
              <Icon 
                className={cn(
                  "h-7 w-7", 
                  { 'fill-current': isActive && href === '/anasayfa' }
                )} 
              />
              {isActive && (
                <span className="text-[10px] font-semibold">{label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
