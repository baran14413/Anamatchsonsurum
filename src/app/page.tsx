
'use client';

import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { langTr } from '@/languages/tr';
import { useUser } from '@/firebase/provider';
import { useEffect } from 'react';
import { Mail, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function WelcomePage() {
  const t = langTr;
  const { user, userProfile, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user && userProfile?.gender) {
        router.replace('/anasayfa');
    }
  }, [user, userProfile, isUserLoading, router]);

  if (isUserLoading || (user && userProfile?.gender)) {
      return (
           <div className="flex h-dvh items-center justify-center bg-background">
             <Icons.logo width={48} height={48} className="animate-pulse" />
           </div>
      );
  }

  return (
    <div className="flex min-h-dvh flex-col animated-gradient-bg text-white">
      <main className="flex flex-1 flex-col items-center p-8 text-center">
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
           <div className="w-40 h-px bg-gradient-to-r from-red-500 to-yellow-500 mb-8"></div>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="text-xs text-white/90">
            <p dangerouslySetInnerHTML={{ __html: t.welcome.agreement.replace('<1>', '<a href="/tos" class="underline">').replace('</1>', '</a>').replace('<3>', '<a href="/privacy" class="underline">').replace('</3>', '</a>').replace('<5>', '<a href="/cookies" class="underline">').replace('</5>', '</a>') }} />
          </div>

          <div className="space-y-3">
               <Link href="/giris" className='w-full'>
                <Button
                    variant="outline"
                    className="w-full h-12 rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30 text-base font-semibold justify-start pl-6 backdrop-blur-sm"
                >
                    <Mail className="mr-4 h-6 w-6" />
                    E-posta ile Giriş Yap
                </Button>
               </Link>
               <Link href="/profilini-tamamla" className='w-full'>
                 <Button
                    variant="outline"
                    className="w-full h-12 rounded-full bg-white/90 border-white/30 text-black hover:bg-white text-base font-semibold justify-start pl-6 backdrop-blur-sm"
                >
                    <UserPlus className="mr-4 h-6 w-6" />
                    Yeni Hesap Oluştur
                </Button>
               </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
