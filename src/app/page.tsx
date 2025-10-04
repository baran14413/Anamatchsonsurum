
'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Chrome, Facebook, Mail } from 'lucide-react';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function WelcomePage() {
  const auth = useAuth();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!auth) {
       toast({
        title: "Hata",
        description: "Kimlik doğrulama hizmeti yüklenemedi.",
        variant: "destructive",
      });
      return;
    }
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // The user will be redirected to anasayfa by the AppShell on successful login
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // Handle specific errors, like user closing the popup
      if (error.code !== 'auth/popup-closed-by-user') {
          toast({
          title: "Giriş Başarısız",
          description: "Google ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-500 to-purple-600 text-white">
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="flex items-center gap-4 mb-12">
            <Icons.logo className="h-16 w-16 text-white" />
            <h1 className="text-5xl font-bold tracking-tighter">BeMatch</h1>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="text-xs text-white/90">
            <p>
              Oturum aç'a dokunarak <Link href="/tos" className="font-bold underline">Şartlarımızı</Link> kabul edersin. Verilerini nasıl işlediğimizi öğrenmek için <Link href="/privacy" className="font-bold underline">Gizlilik Politikası</Link> ve <Link href="/cookies" className="font-bold underline">Çerez Politikası</Link>'nı inceleyebilirsin.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30 text-base font-semibold justify-start pl-6 backdrop-blur-sm"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                  <Loader2 className="mr-4 h-6 w-6 animate-spin" />
              ) : (
                  <Chrome className="mr-4 h-6 w-6" />
              )}
              Google ile devam et
            </Button>
            <Link href="/kurallar" className='w-full block'>
              <Button variant="outline" className="w-full h-12 rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30 text-base font-semibold justify-start pl-6 backdrop-blur-sm">
                <Facebook className="mr-4 h-6 w-6" />
                Facebook ile devam et
              </Button>
            </Link>
            <Link href="/login" className='w-full block'>
              <Button variant="outline" className="w-full h-12 rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30 text-base font-semibold justify-start pl-6 backdrop-blur-sm">
                <Mail className="mr-4 h-6 w-6" />
                E-posta ile devam et
              </Button>
            </Link>
          </div>

          <Link href="/help" className="text-sm font-semibold hover:underline">
            Oturum açarken sorun mu yaşıyorsun?
          </Link>
        </div>
      </main>
    </div>
  );
}
