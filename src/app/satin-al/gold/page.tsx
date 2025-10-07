
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gem, Star, Undo2, Zap, Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Icons } from '@/components/icons';

const packages = [
  { id: 'gold_1m', duration: '1 Ay', price: '149,99 TL', monthly_price: '149,99 TL', popular: false },
  { id: 'gold_6m', duration: '6 Ay', price: '449,99 TL', monthly_price: '74,99 TL', popular: true, savings: '50%' },
  { id: 'gold_1w', duration: '1 Hafta', price: '49,99 TL', monthly_price: '', popular: false },
];

const features = [
    { icon: Heart, text: "Sınırsız Beğeni Hakkı" },
    { icon: Star, text: "Seni Beğenenleri Gör" },
    { icon: Undo2, text: "Sınırsız Geri Alma Hakkı" },
    { icon: Zap, text: "Haftada 1 Ücretsiz Boost" },
    { icon: Star, text: "Her Hafta 5 Ücretsiz Super Like" },
]

export default function GoldPurchasePage() {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState(packages[1].id);

  return (
    <div className="flex h-dvh flex-col bg-gray-50 dark:bg-black">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className='flex items-center gap-2'>
            <Icons.beGold width={32} height={32}/>
            <h1 className="text-lg font-semibold">BeMatch Gold</h1>
        </div>
        <div className="w-9"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        <Card className="w-full max-w-sm mx-auto text-center shadow-lg border-0 bg-transparent">
          <CardHeader className="pt-8">
            <CardTitle className="text-3xl font-extrabold">Gold'a Yükselt</CardTitle>
            <CardDescription>
              Tüm premium özelliklere erişerek eşleşme potansiyelini en üst düzeye çıkar.
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
                <p className="text-xl font-bold">{pkg.duration}</p>
                <p className="text-3xl font-extrabold text-primary">{pkg.price}</p>
                {pkg.monthly_price && <p className="text-sm text-muted-foreground">({pkg.monthly_price}/ay)</p>}
                {pkg.savings && <p className="text-xs font-bold text-green-500 mt-1">{pkg.savings} KAZANÇLI</p>}
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button size="lg" className="w-full h-12 rounded-full font-bold text-lg">
                Satın Al
            </Button>
          </CardFooter>
        </Card>
        
        <div className='max-w-sm mx-auto space-y-4'>
            <h3 className='text-center font-bold text-lg'>Gold Ayrıcalıkları</h3>
            <ul className='space-y-3'>
               {features.map((feature, index) => (
                 <li key={index} className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary'>
                        <feature.icon className='w-5 h-5'/>
                    </div>
                    <span className='font-medium'>{feature.text}</span>
                 </li>
               ))}
            </ul>
        </div>
        
         <div className="mt-8 text-center text-xs text-muted-foreground max-w-sm mx-auto">
            <p>Ödeme, satın alma onayıyla birlikte Google Play Hesabınızdan tahsil edilecektir. Abonelik, mevcut dönemin bitiminden en az 24 saat önce otomatik yenileme kapatılmadığı sürece otomatik olarak yenilenir.</p>
        </div>
      </main>
    </div>
  );
}

    