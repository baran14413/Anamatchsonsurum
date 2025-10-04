'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, MessageSquare, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { langTr } from '@/languages/tr';

const navItems = [
  { href: '/kesfet', icon: Search, label: langTr.footerNav.discover },
  { href: '/begeniler', icon: Heart, label: langTr.footerNav.likes },
  { href: '/eslesmeler', icon: MessageSquare, label: langTr.footerNav.chats },
  { href: '/profil', icon: User, label: langTr.footerNav.profile },
];

export default function FooterNav() {
  const pathname = usePathname();

  return (
    <footer className="sticky bottom-0 z-10 w-full border-t bg-background/95 backdrop-blur-sm">
      <nav className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 p-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
