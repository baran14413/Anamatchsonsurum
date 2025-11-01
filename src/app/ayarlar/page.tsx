
'use client';

import { useUser, useFirebase } from '@/firebase/provider';
import { langTr } from '@/languages/tr';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, SlidersHorizontal, LogOut, Heart, User, MapPin, Smartphone, Wallet, ShieldCheck, Shield, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import AppShell from '@/components/app-shell';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface SettingsItemProps {
  icon: React.ElementType;
  iconColor: string;
  text: string;
  value?: string;
  href?: string;
  onClick?: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon: Icon, iconColor, text, value, href, onClick }) => {
  const content = (
      <div className="flex items-center justify-between w-full p-4 cursor-pointer hover:bg-muted/50" onClick={onClick}>
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
    const { userProfile, auth } = useUser();
    const router = useRouter();
    const t = langTr;
    const { toast } = useToast();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
      if (!auth) return;
      setIsLoggingOut(true);
      try {
        await signOut(auth);
        router.replace('/');
      } catch (error) {
        console.error("Logout error:", error);
        toast({
          title: t.ayarlar.toasts.logoutErrorTitle,
          description: t.ayarlar.toasts.logoutErrorDesc,
          variant: "destructive"
        });
        setIsLoggingOut(false);
      }
    };


    return (
        <AlertDialog>
             <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Ayarlar</h1>
                 {userProfile?.isAdmin ? (
                    <Link href="/admin/dashboard">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Shield className="w-6 h-6" />
                        </Button>
                    </Link>
                ) : (
                    <div className="w-9 h-9" />
                )}
            </header>
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

                <SectionTitle title="Destek" />
                <div className="bg-background border-y divide-y">
                    <SettingsItem 
                        icon={HelpCircle} 
                        iconColor="#64748b" 
                        text="Destek & İletişim" 
                        value="bematchstudio@gmail.com"
                        href="mailto:bematchstudio@gmail.com" 
                    />
                </div>

                <SectionTitle title="Oturum" />
                <div className="bg-background border-y">
                    <AlertDialogTrigger asChild>
                        <div>
                            <SettingsItem icon={LogOut} iconColor="#78716c" text="Çıkış Yap" />
                        </div>
                    </AlertDialogTrigger>
                </div>

                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Icons.logo width={100} height={35} />
                    <p className="text-xs text-muted-foreground mt-2">Tüm hakları gizlidir © BeMatch</p>
                </div>
                
            </div>
             <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>{t.common.logoutConfirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t.common.logoutConfirmDescription}
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
                    {isLoggingOut ? <Icons.logo width={16} height={16} className="h-4 w-4 animate-pulse" /> : t.common.logout}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}


export default function SettingsPage() {
    // We don't need AppShell here because we are creating our own header
    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
             <SettingsPageContent />
        </div>
    );
}
