'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const rules = [
  {
    title: 'Kendin ol.',
    description: 'Fotoğraflarının, yaşının ve biyografinin gerçeği yansıttığından emin ol.',
  },
  {
    title: 'Nazik ol.',
    description: 'Diğer kullanıcılara saygı göster ve sana nasıl davranılmasını istiyorsan onlara da öyle davran.',
  },
  {
    title: 'Dikkatli ol.',
    description: 'Kişisel bilgilerini paylaşmadan önce iyi düşün. Güvenliğin bizim için önemli.',
  },
  {
    title: 'Proaktif ol.',
    description: 'Topluluğumuzu güvende tutmak için uygunsuz davranışları mutlaka bize bildir.',
  },
];

export default function RulesPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 items-center px-4">
        <Link href="/" className="p-2 -ml-2">
          <ArrowLeft className="h-6 w-6" />
        </Link>
      </header>
      <main className="flex flex-1 flex-col px-6 pb-8">
        <div className="flex-1 space-y-8">
          <div className="flex items-center gap-3">
            <Icons.logo className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">BeMatch'e Hoş Geldin.</h1>
          </div>
          <p className="text-muted-foreground">
            Harika bir topluluk oluşturmamıza yardımcı olmak için lütfen aşağıdaki kurallara uymayı unutma.
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
        <div className="mt-8 shrink-0">
          <Button
            onClick={() => router.push('/kayit-ol')}
            className="w-full h-14 rounded-full text-lg font-bold"
          >
            Onaylıyorum
          </Button>
        </div>
      </main>
    </div>
  );
}
