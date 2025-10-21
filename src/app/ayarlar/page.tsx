
'use client';

import { useUser } from '@/firebase/provider';
import { langTr } from '@/languages/tr';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, SlidersHorizontal, LogOut, Heart, User, MapPin, Smartphone, Wallet, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import AppShell from '@/components/app-shell';

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


function SettingsPageContent() {
    const { user } = useUser();
    const router = useRouter();
    const t = langTr;

    return (
        <div className="flex-1 overflow-y-auto">
            <SectionTitle title="Hesabın" />
            <div className="bg-background border-y divide-y">
               <SettingsItem icon={User} iconColor="#8b5cf6" text="Kişisel Bilgiler" href='/ayarlar/kisisel-bilgiler' />
               <SettingsItem icon={Wallet} iconColor="#f59e0b" text="Cüzdanım" href='/ayarlar/cuzdanim' />
               <SettingsItem icon={MapPin} iconColor="#10b981" text="Konum" href='/ayarlar/konum' />
               <SettingsItem icon={SlidersHorizontal} iconColor="#3b82f6" text="Tercihler" href='/ayarlar/tercihler' />
            </div>
            
            <SectionTitle title="Profil ve Güvenlik" />
             <div className="bg-background border-y divide-y">
               <SettingsItem icon={Heart} iconColor="#ef4444" text="İlgi Alanlarını Düzenle" href='/ayarlar/ilgi-alanlari' />
               <SettingsItem icon={ShieldCheck} iconColor="#16a34a" text="Doğrulamalar" href="/ayarlar/dogrulamalar" />
            </div>

            <SectionTitle title="Uygulama Ayarları" />
             <div className="bg-background border-y">
               <SettingsItem icon={Smartphone} iconColor="#f97316" text="Uygulama" href='/ayarlar/uygulama' />
            </div>

             <SectionTitle title="Oturum" />
             <div className="bg-background border-y">
                <SettingsItem icon={LogOut} iconColor="#78716c" text="Çıkış Yap" />
            </div>

             <div className="flex flex-col items-center justify-center py-10 text-center">
                <Icons.logo width={100} height={35} />
                <p className="text-xs text-muted-foreground mt-2">Tüm hakları gizlidir © BeMatch</p>
            </div>
            
        </div>
    )
}


export default function SettingsPage() {
    return (
        <AppShell>
            <SettingsPageContent />
        </AppShell>
    );
}
