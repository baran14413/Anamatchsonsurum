'use client';

import { useUser } from '@/firebase';
import { langTr } from '@/languages/tr';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, SlidersHorizontal, LogOut, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import Link from 'next/link';

interface SettingsItemProps {
  icon: React.ElementType;
  iconColor: string;
  text: string;
  value?: string;
  href?: string;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon: Icon, iconColor, text, value, href }) => {
  const content = (
      <div className="flex items-center justify-between w-full p-4 cursor-pointer hover:bg-muted/50">
          <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full`} style={{ backgroundColor: `${iconColor}20`, color: iconColor }}>
                  <Icon className="h-5 w-5" />
              </div>
              <span className="font-medium">{text}</span>
          </div>
          <div className="flex items-center gap-2">
              {value && <span className="text-sm text-muted-foreground">{value}</span>}
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
      </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content;
};


const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <h2 className="px-4 pt-6 pb-2 text-sm font-semibold text-muted-foreground">{title}</h2>
);


export default function SettingsPage() {
    const { user } = useUser();
    const router = useRouter();
    const t = langTr;

    return (
        <div className="flex h-dvh flex-col bg-gray-50 dark:bg-black">
             <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Ayarlar ve hareketler</h1>
                <div className='w-9'></div>
            </header>
            <main className="flex-1 overflow-y-auto">
                <SectionTitle title="Hesabın" />
                <div className="bg-background border-y">
                   <SettingsItem icon={SlidersHorizontal} iconColor="#3b82f6" text="Tercihler" href='/ayarlar/tercihler' />
                </div>
                
                <SectionTitle title="İlgi Alanları" />
                 <div className="bg-background border-y">
                   <SettingsItem icon={Heart} iconColor="#ef4444" text="İlgi Alanlarını Düzenle" href='/ayarlar/ilgi-alanlari' />
                </div>

                 <SectionTitle title="Oturum" />
                 <div className="bg-background border-y">
                    <SettingsItem icon={LogOut} iconColor="#78716c" text="Çıkış Yap" />
                </div>

                 <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Icons.logo width={100} height={35} />
                    <p className="text-xs text-muted-foreground mt-2">Tüm hakları gizlidir © BeMatch</p>
                </div>
                
            </main>
        </div>
    )
}
