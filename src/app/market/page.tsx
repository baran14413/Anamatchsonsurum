'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function MarketPage() {
  const router = useRouter();

  return (
    <div className="flex h-dvh flex-col">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Market</h1>
        <div className="w-9" />
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Market sayfası yakında burada olacak.</p>
        </div>
      </main>
    </div>
  );
}
