'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import LoginForm from '@/components/login-form';
import { langTr } from '@/languages/tr';

export default function LoginPage() {
  const t = langTr;
  return (
     <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-20 items-center justify-center border-b">
        <Link href="/" className="flex items-center gap-2">
            <Icons.logo width={150} height={40} />
        </Link>
      </header>
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-sm">
            <h1 className="text-3xl font-bold tracking-tight mb-2">BeMatch'e Hoş Geldin</h1>
            <p className="text-muted-foreground mb-8">Devam etmek için giriş yap.</p>
            <LoginForm />
        </div>
      </main>
    </div>
  );
}
