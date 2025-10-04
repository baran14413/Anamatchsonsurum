
'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { motion } from 'framer-motion';
import googleLogo from '@/img/googlelogin.png';
import emailLogo from '@/img/gmaillogin.png';
import { langEn } from '@/languages/en';

export default function WelcomePage() {
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
            <p>
              {langEn.welcome.agreement.split('<1>')[0]}
              <Link href="/tos" className="font-bold underline">{langEn.welcome.agreement.split('<1>')[1].split('</1>')[0]}</Link>
              {langEn.welcome.agreement.split('</1>')[1].split('<3>')[0]}
              <Link href="/privacy" className="font-bold underline">{langEn.welcome.agreement.split('<3>')[1].split('</3>')[0]}</Link>
              {langEn.welcome.agreement.split('</3>')[1].split('<5>')[0]}
              <Link href="/cookies" className="font-bold underline">{langEn.welcome.agreement.split('<5>')[1].split('</5>')[0]}</Link>
              {langEn.welcome.agreement.split('</5>')[1]}
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/kurallar" className="w-full block">
              <Button
                variant="outline"
                className="w-full h-12 rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30 text-base font-semibold justify-start pl-6 backdrop-blur-sm"
              >
                <Image src={googleLogo} alt="Google logo" width={24} height={24} className="mr-4" />
                {langEn.welcome.continueWithGoogle}
              </Button>
            </Link>
            <Link href="/login" className="w-full block">
              <Button variant="outline" className="w-full h-12 rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30 text-base font-semibold justify-start pl-6 backdrop-blur-sm">
                <Image src={emailLogo} alt="Email logo" width={24} height={24} className="mr-4" />
                {langEn.welcome.continueWithEmail}
              </Button>
            </Link>
          </div>

          <Link href="/help" className="text-sm font-semibold hover:underline">
            {langEn.welcome.loginIssues}
          </Link>
        </div>
      </main>
    </div>
  );
}
    