'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { motion } from 'framer-motion';
import googleLogo from '@/img/googlelogin.png';
import emailLogo from '@/img/gmaillogin.png';

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-500 to-purple-600 text-white">
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="flex-1 flex flex-col justify-center items-center">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2.5,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
            className="mb-12"
          >
            <Icons.logo width={256} height={256} />
          </motion.div>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="text-xs text-white/90">
            <p>
              Oturum aç'a dokunarak <Link href="/tos" className="font-bold underline">Şartlarımızı</Link> kabul edersin. Verilerini nasıl işlediğimizi öğrenmek için <Link href="/privacy" className="font-bold underline">Gizlilik Politikası</Link> ve <Link href="/cookies" className="font-bold underline">Çerez Politikası</Link>'nı inceleyebilirsin.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/kurallar" className="w-full block">
              <Button
                variant="outline"
                className="w-full h-12 rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30 text-base font-semibold justify-start pl-6 backdrop-blur-sm"
              >
                <Image src={googleLogo} alt="Google logo" width={24} height={24} className="mr-4" />
                Google ile devam et
              </Button>
            </Link>
            <Link href="/login" className="w-full block">
              <Button variant="outline" className="w-full h-12 rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30 text-base font-semibold justify-start pl-6 backdrop-blur-sm">
                <Image src={emailLogo} alt="Email logo" width={24} height={24} className="mr-4" />
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
