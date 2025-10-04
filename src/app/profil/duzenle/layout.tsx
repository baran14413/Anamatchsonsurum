
'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';
import { langEn } from '@/languages/en';
import { langTr } from '@/languages/tr';

export default function DuzenleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang } = useLanguage();
  const t = lang === 'en' ? langEn : langTr;

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center border-b px-4">
        <Link
          href="/profil"
          className="flex items-center gap-2 text-foreground"
        >
          <ArrowLeft className="h-6 w-6" />
          <h1 className="text-xl font-bold">{t.ayarlar.title}</h1>
        </Link>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
