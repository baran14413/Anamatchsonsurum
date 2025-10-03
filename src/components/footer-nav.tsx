
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Compass, Heart, MessageSquare, User } from "lucide-react";
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
      <div className="grid h-14 grid-cols-5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
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
              <Icon className={cn("h-5 w-5", { 'fill-current text-primary': isActive && href === '/anasayfa' }, { 'text-gray-400': !isActive })} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
