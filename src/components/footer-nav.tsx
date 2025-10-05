
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, MessageSquare, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { langTr } from '@/languages/tr';
import { Icons } from './icons';

interface FooterNavProps {
    hasNewLikes: boolean;
    hasUnreadMessages: boolean;
}

export default function FooterNav({ hasNewLikes, hasUnreadMessages }: FooterNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/anasayfa', icon: Icons.tinderFlame, label: langTr.footerNav.home, hasNotification: false },
    { href: '/kesfet', icon: Search, label: langTr.footerNav.discover, hasNotification: false },
    { href: '/begeniler', icon: Heart, label: langTr.footerNav.likes, hasNotification: hasNewLikes },
    { href: '/eslesmeler', icon: MessageSquare, label: langTr.footerNav.chats, hasNotification: hasUnreadMessages },
    { href: '/profil', icon: User, label: langTr.footerNav.profile, hasNotification: false },
  ];


  return (
    <footer className="sticky bottom-0 z-10 w-full border-t bg-background/95 backdrop-blur-sm">
      <nav className="flex h-12 items-center justify-around">
        {navItems.map((item, index) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={`${item.href}-${index}`}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 p-2 text-[10px] transition-colors h-full w-full',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn("h-6 w-6", 
                isActive && item.href === '/anasayfa' ? 'fill-primary' : '', 
                isActive && (item.href === '/begeniler' || item.href === '/profil') ? 'text-primary fill-primary' : '',
                item.hasNotification && !isActive && 'animate-pulse'
              )} />
              {item.hasNotification && (
                 <span className="absolute top-1.5 right-[calc(50%-1.25rem)] h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
