
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Moon, Sun, Laptop, Trash2, Smartphone, Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { langTr } from '@/languages/tr';
import { requestNotificationPermission, isNotificationSupported, saveTokenToFirestore } from '@/lib/notifications';
import { Icons } from '@/components/icons';
import { useUser, useFirestore } from '@/firebase/provider';


// You can get this from package.json in a real build process
const appVersion = '0.1.0';

export default function AppSettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const t = langTr;
  const { user } = useUser();
  const firestore = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkSupportAndPermission = async () => {
        const supported = await isNotificationSupported();
        setIsSupported(supported);
        if (supported) {
            setNotificationPermission(Notification.permission);
        }
    };
    checkSupportAndPermission();
  }, []);

  const handlePermissionRequest = async () => {
      setIsRequestingPermission(true);
      try {
          const result = await requestNotificationPermission();
          if (result) {
              setNotificationPermission(result.permission);
              if (result.permission === 'granted' && result.fcmToken) {
                  await saveTokenToFirestore(firestore, user, result.fcmToken);
                  toast({
                      title: "Bildirimlere İzin Verildi",
                      description: "Yeni mesaj ve eşleşmelerden anında haberdar olacaksın."
                  });
              } else if (result.permission === 'denied') {
                  toast({
                      title: "Bildirimler Engellendi",
                      description: "Bildirimleri almak için tarayıcı ayarlarından izin vermen gerekecek.",
                      variant: 'destructive'
                  });
              }
          }
      } catch (error) {
          console.error("Error requesting notification permission:", error);
           toast({
              title: "Hata",
              description: "Bildirim izni istenirken bir sorun oluştu.",
              variant: 'destructive'
          });
      } finally {
        setIsRequestingPermission(false);
      }
  }

  const handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      toast({
        title: "Önbellek Temizlendi",
        description: "Uygulama verileri başarıyla temizlendi. Sayfa yenileniyor.",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Önbellek temizlenirken bir sorun oluştu.",
        variant: 'destructive',
      });
    }
  };

  if (!mounted) {
    return null; // Render nothing on the server to avoid mismatch
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Uygulama Ayarları</h1>
        <div className="w-9"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Bildirimler</h2>
            <p className="text-muted-foreground">Yeni eşleşmelerden ve mesajlardan anında haberdar ol.</p>
            {isSupported ? (
                 <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                    <div className="flex flex-col space-y-1">
                        <span>Anlık Bildirimler</span>
                        <span className="font-normal text-xs leading-snug text-muted-foreground">
                             {notificationPermission === 'granted' && 'Bildirimlere izin verdin.'}
                             {notificationPermission === 'denied' && 'Bildirimleri engelledin.'}
                             {notificationPermission === 'default' && 'Bildirimlere henüz izin vermedin.'}
                        </span>
                    </div>
                     {notificationPermission === 'default' && (
                        <Button variant="default" size="sm" onClick={handlePermissionRequest} disabled={isRequestingPermission}>
                           {isRequestingPermission ? <Icons.logo width={16} height={16} className='animate-pulse mr-2' /> : <Bell className="h-4 w-4 mr-2"/>}
                           İzin Ver
                        </Button>
                     )}
                      {notificationPermission === 'granted' && (
                        <div className='flex items-center gap-2 text-green-500'>
                            <Bell className="h-5 w-5" />
                            <span className='font-semibold text-sm'>Aktif</span>
                        </div>
                     )}
                     {notificationPermission === 'denied' && (
                        <div className='flex items-center gap-2 text-red-500'>
                            <BellOff className="h-5 w-5" />
                            <span className='font-semibold text-sm'>Engellendi</span>
                        </div>
                     )}
                </div>
            ) : (
                 <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                    <div className="flex flex-col space-y-1">
                        <span>Anlık Bildirimler</span>
                        <span className="font-normal text-xs leading-snug text-muted-foreground">
                            Tarayıcınız anlık bildirimleri desteklemiyor.
                        </span>
                    </div>
                </div>
            )}
        </div>


        <div className="space-y-4">
          <h2 className="text-xl font-bold">Görünüm</h2>
          <p className="text-muted-foreground">Uygulamanın nasıl görüneceğini seçin.</p>
          <RadioGroup
            value={theme}
            onValueChange={setTheme}
            className="space-y-1"
          >
            <Label
              htmlFor="light"
              className="flex items-center justify-between rounded-lg border bg-background p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <div className="flex items-center gap-3">
                <Sun className="h-5 w-5" />
                <span>Gündüz Modu</span>
              </div>
              <RadioGroupItem value="light" id="light" />
            </Label>
            <Label
              htmlFor="dark"
              className="flex items-center justify-between rounded-lg border bg-background p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5" />
                <span>Gece Modu</span>
              </div>
              <RadioGroupItem value="dark" id="dark" />
            </Label>
            <Label
              htmlFor="system"
              className="flex items-center justify-between rounded-lg border bg-background p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <div className="flex items-center gap-3">
                <Laptop className="h-5 w-5" />
                <span>Sistem Varsayılanı</span>
              </div>
              <RadioGroupItem value="system" id="system" />
            </Label>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Uygulama Verileri</h2>
           <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                <div className="flex flex-col space-y-1">
                    <span>Önbelleği Temizle</span>
                    <span className="font-normal text-xs leading-snug text-muted-foreground">
                        Uygulamanın tarayıcıda sakladığı tüm yerel verileri (tema seçimi vb.) temizler.
                    </span>
                </div>
                <Button variant="destructive" size="sm" onClick={handleClearCache}>
                    <Trash2 className="h-4 w-4 mr-2"/>
                    Temizle
                </Button>
            </div>
        </div>

         <div className="space-y-4">
          <h2 className="text-xl font-bold">Hakkında</h2>
           <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                <div className="flex items-center gap-3">
                     <Smartphone className="h-5 w-5" />
                     <span>Sürüm</span>
                </div>
                <span className="text-sm text-muted-foreground font-mono">{appVersion}</span>
            </div>
        </div>

      </main>
    </div>
  );
}
