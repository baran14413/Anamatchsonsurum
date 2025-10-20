
'use client';

import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { langTr } from '@/languages/tr';
import { useUser } from '@/firebase/provider';
import { useEffect } from 'react';
import { Mail, UserPlus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import AppShell from '@/components/app-shell';

export default function WelcomePage() {
  const t = langTr;
  const { user, userProfile, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // This effect should only redirect if the user is fully authenticated and onboarded.
    // It should not interfere with new users trying to sign up.
    if (!isUserLoading && user && userProfile?.rulesAgreed) {
        router.replace('/anasayfa');
    }
  }, [user, userProfile, isUserLoading, router]);

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

  // While loading, show a loader to prevent any flicker or premature rendering.
  if (isUserLoading) {
      return (
           <div className="flex h-dvh items-center justify-center bg-background">
             <Icons.logo width={48} height={48} className="animate-pulse" />
           </div>
      );
  }
  
  // If user is loaded but already fully onboarded, this component will redirect.
  // We can show a loader here as well to make the transition smooth.
  if(user && userProfile?.rulesAgreed) {
     return (
           <div className="flex h-dvh items-center justify-center bg-background">
             <Icons.logo width={48} height={48} className="animate-pulse" />
           </div>
      );
  }

  // If user is not logged in or not fully onboarded, show the welcome screen
  if (!user || !userProfile?.rulesAgreed) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-between p-8 text-center bg-background text-foreground">
        <div />
        <div className="flex flex-1 flex-col justify-center items-center">
          <motion.div
            className="transform-gpu"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2.5,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          >
            <Icons.logo width={256} height={256} />
          </motion.div>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="text-xs text-muted-foreground">
            <p dangerouslySetInnerHTML={{ __html: t.welcome.agreement.replace('<1>', '<a href="/tos" class="underline">').replace('</1>', '</a>').replace('<3>', '<a href="/privacy" class="underline">').replace('</3>', '</a>').replace('<5>', '<a href="/cookies" class="underline">').replace('</5>', '</a>') }} />
          </div>

          <div className="space-y-3">
            <Link href="/giris">
              <Button
                variant="outline"
                className="w-full h-12 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 text-base font-semibold justify-start pl-6 backdrop-blur-sm"
              >
                <Mail className="mr-4 h-6 w-6" />
                E-posta ile Giriş Yap
              </Button>
            </Link>
            <Link href="/kayit">
              <Button
                variant="default"
                className="w-full h-12 rounded-full text-base font-semibold justify-start pl-6 backdrop-blur-sm"
              >
                <UserPlus className="mr-4 h-6 w-6" />
                Yeni Hesap Oluştur
              </Button>
            </Link>
          </div>
            <Button variant="link" className="text-muted-foreground hover:text-foreground" onClick={handleClearCache}>
              <Trash2 className="mr-2 h-4 w-4" />
              Önbelleği Temizle
          </Button>
        </div>
      </div>
    );
  }
  
  // This should ideally not be reached, but as a fallback, we show the main app.
  return <AppShell><div/></AppShell>;
}
