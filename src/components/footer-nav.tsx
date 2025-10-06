
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, MessageSquare, User, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { langTr } from '@/languages/tr';

interface FooterNavProps {
    hasNewLikes: boolean;
    hasUnreadMessages: boolean;
}

export default function FooterNav({ hasNewLikes, hasUnreadMessages }: FooterNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/begeniler', icon: Heart, label: langTr.footerNav.likes, hasNotification: hasNewLikes },
    { href: '/eslesmeler', icon: MessageSquare, label: langTr.footerNav.chats, hasNotification: hasUnreadMessages },
    { href: '/anasayfa', icon: Flame, label: langTr.footerNav.home, hasNotification: false },
    { href: '/profil', icon: User, label: langTr.footerNav.profile, hasNotification: false },
  ];

  // Reorder to put 'anasayfa' in the middle
  const orderedNavItems = [
      navItems.find(item => item.href === '/begeniler'),
      navItems.find(item => item.href === '/eslesmeler'),
      navItems.find(item => item.href === '/anasayfa'),
      navItems.find(item => item.href === '/profil'),
  ].filter(Boolean) as typeof navItems;


  return (
    <footer className="sticky bottom-0 z-10 w-full border-t bg-background/95 backdrop-blur-sm">
      <nav className="flex h-14 items-center justify-around">
        {orderedNavItems.map((item, index) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          const isCenterButton = item.href === '/anasayfa';

          return (
            <Link
              key={`${item.href}-${index}`}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 p-2 text-[10px] transition-colors h-full w-full',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                  'flex items-center justify-center rounded-full transition-all duration-300',
                  isCenterButton ? 'w-12 h-12' : 'w-10 h-10',
                  isActive && isCenterButton && 'bg-primary/10'
              )}>
                <Icon className={cn("transition-all", 
                  isCenterButton ? "h-7 w-7" : "h-6 w-6",
                  isActive ? 'fill-primary' : '',
                  item.hasNotification && !isActive && 'animate-pulse',
                  isActive && 'drop-shadow-[0_0_4px_hsl(var(--primary))]'
                )} />
              </div>
              {item.hasNotification && !isCenterButton && (
                 <span className="absolute top-2.5 right-[calc(50%-1.25rem)] h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
