
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

export default function TosPage() {
  const { lang } = useLanguage();
  const t = lang === 'en' ? langEn : langTr;
  const tt = t.hukuki.tos;

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
                <CardTitle>{tt.title}</CardTitle>
                <CardDescription>{tt.lastUpdated}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <p>{tt.p1}</p>
                        <h4 className="font-semibold text-foreground">{tt.h1}</h4>
                        <p>{tt.p2}</p>
                        <h4 className="font-semibold text-foreground">{tt.h2}</h4>
                        <p>{tt.p3}</p>
                        <h4 className="font-semibold text-foreground">{tt.h3}</h4>
                        <p>{tt.p4}</p>
                        <h4 className="font-semibold text-foreground">{tt.h4}</h4>
                        <p>{tt.p5}</p>
                        <h4 className="font-semibold text-foreground">{tt.h5}</h4>
                        <p>{tt.p6}</p>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
