
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

  return (
    <div className="flex min-h-dvh flex-col items-center justify-between p-8 text-center animated-gradient-bg text-white">
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
         <div className="space-y-4">
            <div className="text-xs text-white/90">
              <p dangerouslySetInnerHTML={{ __html: t.welcome.agreement.replace('<1>', '<a href="/tos" class="underline">').replace('</1>', '</a>').replace('<3>', '<a href="/privacy" class="underline">').replace('</3>', '</a>').replace('<5>', '<a href="/cookies" class="underline">').replace('</5>', '</a>') }} />
            </div>

            <div className="space-y-3">
              <Link href="/giris">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30 text-base font-semibold justify-start pl-6 backdrop-blur-sm"
                >
                  <Mail className="mr-4 h-6 w-6" />
                  E-posta ile Giriş Yap
                </Button>
              </Link>
              <Link href="/profilini-tamamla">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-full bg-white/90 border-white/30 text-black hover:bg-white text-base font-semibold justify-start pl-6 backdrop-blur-sm"
                >
                  <UserPlus className="mr-4 h-6 w-6" />
                  Yeni Hesap Oluştur
                </Button>
              </Link>
            </div>
             <Button variant="link" className="text-white/60 hover:text-white" onClick={handleClearCache}>
                <Trash2 className="mr-2 h-4 w-4" />
                Önbelleği Temizle
            </Button>
        </div>
      </div>
    </div>
  );
}
