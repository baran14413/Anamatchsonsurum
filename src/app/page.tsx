
'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { motion } from 'framer-motion';
import googleLogo from '@/img/googlelogin.png';
import emailLogo from '@/img/gmaillogin.png';
import { langEn } from '@/languages/en';
import { langTr } from '@/languages/tr';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Globe } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export default function WelcomePage() {
  const { lang, setLang } = useLanguage();
  const t = lang === 'en' ? langEn : langTr;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-500 to-purple-600 text-white">
      <main className="flex flex-1 flex-col items-center p-8 text-center">
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
            className="mb-8"
          >
            <Icons.logo width={256} height={256} />
          </motion.div>
           <div className="w-40 h-px bg-gradient-to-r from-red-500 to-blue-500 mb-8"></div>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="text-xs text-white/90">
            <p dangerouslySetInnerHTML={{ __html: t.welcome.agreement.replace('<1>', '<a href="/tos" class="underline">').replace('</1>', '</a>').replace('<3>', '<a href="/privacy" class="underline">').replace('</3>', '</a>').replace('<5>', '<a href="/cookies" class="underline">').replace('</5>', '</a>') }} />
          </div>

          <div className="space-y-3">
            <Link href="/kurallar" className="w-full block">
              <Button
                variant="outline"
                className="w-full h-12 rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30 text-base font-semibold justify-start pl-6 backdrop-blur-sm"
              >
                <Image src={googleLogo} alt="Google logo" width={24} height={24} className="mr-4" />
                {t.welcome.continueWithGoogle}
              </Button>
            </Link>
            <Link href="/login" className="w-full block">
              <Button variant="outline" className="w-full h-12 rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30 text-base font-semibold justify-start pl-6 backdrop-blur-sm">
                <Image src={emailLogo} alt="Email logo" width={24} height={24} className="mr-4" />
                {t.welcome.continueWithEmail}
              </Button>
            </Link>
          </div>

          <Link href="/help" className="text-sm font-semibold hover:underline">
            {t.welcome.loginIssues}
          </Link>
        </div>
      </main>

       <div className="absolute bottom-4 right-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 rounded-full">
                <Globe className="mr-2 h-4 w-4" />
                {lang === 'en' ? 'English' : 'Türkçe'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 bg-background/80 backdrop-blur-md border-white/20">
              <div className="space-y-1">
                 <Button
                    variant="ghost"
                    onClick={() => setLang('en')}
                    className={`w-full justify-start ${lang === 'en' ? 'font-semibold' : 'font-normal'}`}
                  >
                   {lang === 'en' && <Check className="mr-2 h-4 w-4" />}
                   English
                 </Button>
                 <Button
                    variant="ghost"
                    onClick={() => setLang('tr')}
                    className={`w-full justify-start ${lang === 'tr' ? 'font-semibold' : 'font-normal'}`}
                  >
                    {lang === 'tr' && <Check className="mr-2 h-4 w-4" />}
                    Türkçe
                 </Button>
              </div>
            </PopoverContent>
          </Popover>
      </div>
    </div>
  );
}
