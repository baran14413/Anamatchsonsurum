
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { langTr } from '@/languages/tr';

const rules = [
  {
    title: langTr.rules.rule1Title,
    description: langTr.rules.rule1Desc,
  },
  {
    title: langTr.rules.rule2Title,
    description: langTr.rules.rule2Desc,
  },
  {
    title: langTr.rules.rule3Title,
    description: langTr.rules.rule3Desc,
  },
  {
    title: langTr.rules.rule4Title,
    description: langTr.rules.rule4Desc,
  },
];

export default function RulesPage() {
  const router = useRouter();

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b px-4">
        <Link href="/" className="p-2 -ml-2">
          <ArrowLeft className="h-6 w-6" />
        </Link>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Icons.logo width={40} height={40} />
            <h1 className="text-3xl font-bold">{langTr.rules.welcome}</h1>
          </div>
          <p className="text-muted-foreground">
            {langTr.rules.description}
          </p>
          <div className="space-y-6">
            {rules.map((rule) => (
              <div key={rule.title} className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h2 className="font-semibold text-lg">{rule.title}</h2>
                  <p className="text-muted-foreground">{rule.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <div className="shrink-0 p-6 pt-0">
          <Button
            onClick={() => router.push('/kayit-ol')}
            className="w-full h-14 rounded-full text-lg font-bold"
          >
            {langTr.rules.agree}
          </Button>
      </div>
    </div>
  );
}

    