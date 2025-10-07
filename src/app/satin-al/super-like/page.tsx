
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const packages = [
  { id: 'sl_10', count: 10, price: '19,99 TL', popular: false },
  { id: 'sl_50', count: 50, price: '79,99 TL', popular: true },
  { id: 'sl_100', count: 100, price: '129,99 TL', popular: false },
];

export default function SuperLikePurchasePage() {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState(packages[1].id);

  return (
    <div className="flex h-dvh flex-col bg-gray-50 dark:bg-black">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Super Like Satın Al</h1>
        <div className="w-9"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        <Card className="w-full max-w-sm mx-auto text-center shadow-lg border-0">
          <CardHeader className="pt-8">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
              <Star className="h-12 w-12 text-blue-500" fill="currentColor" />
            </div>
            <CardTitle className="text-2xl">Eşleşme Şansını 3 Kat Artır</CardTitle>
            <CardDescription>
              Birine Super Like gönderdiğinde, profilin onun profil destesinin en üstünde görünür.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  'rounded-lg border-2 p-4 cursor-pointer transition-all relative',
                  selectedPackage === pkg.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                )}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">EN POPÜLER</div>
                )}
                <p className="text-lg font-bold">{pkg.count} Super Like</p>
                <p className="text-2xl font-extrabold text-primary">{pkg.price}</p>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button size="lg" className="w-full h-12 rounded-full font-bold text-lg">
                Satın Al
            </Button>
             <p className="text-center text-xs text-muted-foreground">
                Satın alma işlemi tamamlandığında, Super Like anında hesabına eklenecektir. Super Like'lar iade edilemez ve geri ödemesi yapılmaz.
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

    