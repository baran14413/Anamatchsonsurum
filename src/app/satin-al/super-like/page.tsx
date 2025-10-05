
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';

export default function SuperLikePurchasePage() {
  const router = useRouter();

  return (
    <div className="flex h-dvh flex-col bg-gray-50 dark:bg-black">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Super Like Satın Al</h1>
        <div className="w-9"></div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <Card className="w-full max-w-sm text-center shadow-lg">
          <CardHeader className="pt-10">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
              <Star className="h-12 w-12 text-blue-500" fill="currentColor" />
            </div>
            <CardTitle className="text-2xl">Eşleşme Şansını Artır</CardTitle>
            <CardDescription>
              Birine Super Like gönderdiğinde, profilin onun profil destesinin en üstünde görünür.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border-2 border-primary bg-primary/10 p-4">
                <p className="text-lg font-bold">1 Super Like</p>
                <p className="text-2xl font-extrabold text-primary">5,99 TL</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button size="lg" className="w-full h-12 rounded-full font-bold text-lg">
                Satın Al
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center text-xs text-muted-foreground max-w-sm">
            <p>Satın alma işlemi tamamlandığında, Super Like anında hesabına eklenecektir. Super Like'lar iade edilemez.</p>
        </div>

      </main>
    </div>
  );
}
