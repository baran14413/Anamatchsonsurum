
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Compass, MessageSquare, User, Heart } from "lucide-react";
import { Icons } from "./icons";
import { langEn } from "@/languages/en";

const navLinks = [
  { href: "/anasayfa", label: langEn.footerNav.home, icon: Icons.tinderFlame },
  { href: "/kesfet", label: langEn.footerNav.discover, icon: Compass },
  { href: "/begeniler", label: langEn.footerNav.likes, icon: Heart },
  { href: "/eslesmeler", label: langEn.footerNav.chats, icon: MessageSquare },
  { href: "/profil", label: langEn.footerNav.profile, icon: User },
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
                "flex flex-col items-center justify-center gap-1 text-gray-500 transition-colors hover:text-primary",
                isActive && "text-primary"
              )}
            >
              <Icon 
                className={cn("h-7 w-7")}
                fill={isActive && (href === "/begeniler" || href === "/anasayfa") ? "currentColor" : "none"}
                stroke="currentColor"
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

    