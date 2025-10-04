
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Compass, MessageSquare, User, Heart } from "lucide-react";
import { Icons } from "./icons";
import { useLanguage } from "@/hooks/use-language";
import { langEn } from "@/languages/en";
import { langTr } from "@/languages/tr";

export default function FooterNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const t = lang === 'en' ? langEn : langTr;

  const navLinks = [
    { href: "/anasayfa", label: t.footerNav.home, icon: Icons.tinderFlame },
    { href: "/kesfet", label: t.footerNav.discover, icon: Compass },
    { href: "/begeniler", label: t.footerNav.likes, icon: Heart },
    { href: "/eslesmeler", label: t.footerNav.chats, icon: MessageSquare },
    { href: "/profil", label: t.footerNav.profile, icon: User },
  ];

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
