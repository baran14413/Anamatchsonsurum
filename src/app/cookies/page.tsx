
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/use-language';
import { langEn } from '@/languages/en';
import { langTr } from '@/languages/tr';

export default function CookiesPage() {
  const { lang } = useLanguage();
  const t = lang === 'en' ? langEn : langTr;
  const tc = t.hukuki.cookies;

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b px-4">
        <Link href="/" className="p-2 -ml-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">{t.common.back}</span>
          </Button>
        </Link>
        <Icons.logo width={32} height={32} />
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Card className="flex-1 flex flex-col">
            <CardHeader>
                <CardTitle>{tc.title}</CardTitle>
                <CardDescription>{tc.lastUpdated}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <p>{tc.p1}</p>
                        <h4 className="font-semibold text-foreground">{tc.h1}</h4>
                        <p>{tc.p2}</p>
                        <h4 className="font-semibold text-foreground">{tc.h2}</h4>
                        <p>{tc.p3}</p>
                        <p dangerouslySetInnerHTML={{ __html: tc.p4 }} />
                        <p dangerouslySetInnerHTML={{ __html: tc.p5 }} />
                        <h4 className="font-semibold text-foreground">{tc.h3}</h4>
                        <p>{tc.p6}</p>
                        <h4 className="font-semibold text-foreground">{tc.h4}</h4>
                        <p>{tc.p7}</p>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
