
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gem, Star, Undo2, Zap, Heart, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

const goldPackages = [
  { id: 'gold_1m', duration: '1 Ay', price: '149,99 TL', monthly_price: '149,99 TL', popular: false },
  { id: 'gold_6m', duration: '6 Ay', price: '449,99 TL', monthly_price: '74,99 TL', popular: true, savings: '50%' },
  { id: 'gold_1w', duration: '1 Hafta', price: '49,99 TL', monthly_price: '', popular: false },
];

const superLikePackages = [
  { id: 'sl_10', count: 10, price: '19,99 TL', popular: false },
  { id: 'sl_50', count: 50, price: '79,99 TL', popular: true },
  { id: 'sl_100', count: 100, price: '129,99 TL', popular: false },
];

const goldFeatures = [
    { icon: Heart, text: "Sınırsız Beğeni Hakkı" },
    { icon: Star, text: "Seni Beğenenleri Gör" },
    { icon: Undo2, text: "Sınırsız Geri Alma Hakkı" },
    { icon: Zap, text: "Haftada 1 Ücretsiz Boost" },
    { icon: Star, text: "Her Hafta 5 Ücretsiz Super Like" },
];

export default function MarketPage() {
  const router = useRouter();
  const [selectedGoldPackage, setSelectedGoldPackage] = useState(goldPackages[1].id);
  const [selectedSuperLikePackage, setSelectedSuperLikePackage] = useState(superLikePackages[1].id);

  return (
    <div className="flex h-dvh flex-col bg-gray-50 dark:bg-black">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Market</h1>
        <Link href="/ayarlar/cuzdanim">
            <Button variant="outline" className="rounded-full">
                <Wallet className="mr-2 h-4 w-4"/>
                Cüzdanım
            </Button>
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
        <Tabs defaultValue="gold" className="w-full max-w-sm mx-auto">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="gold">
                    <Gem className="mr-2 h-4 w-4 text-yellow-500"/> BeMatch Gold
                </TabsTrigger>
                <TabsTrigger value="super-like">
                    <Star className="mr-2 h-4 w-4 text-blue-500"/> Super Like
                </TabsTrigger>
            </TabsList>
            <TabsContent value="gold" className="mt-6">
                <Card className="w-full text-center shadow-lg border-0 bg-transparent">
                  <CardHeader className="pt-8">
                    <Icons.beGold width={80} height={80} className='mx-auto'/>
                    <CardTitle className="text-3xl font-extrabold mt-4">Gold'a Yükselt</CardTitle>
                    <CardDescription>
                      Tüm premium özelliklere erişerek eşleşme potansiyelini en üst düzeye çıkar.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {goldPackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={cn(
                          'rounded-lg border-2 p-4 cursor-pointer transition-all relative',
                          selectedGoldPackage === pkg.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        )}
                        onClick={() => setSelectedGoldPackage(pkg.id)}
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
            </TabsContent>
            <TabsContent value="super-like" className="mt-6">
                 <Card className="w-full text-center shadow-lg border-0 bg-transparent">
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
                    {superLikePackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={cn(
                          'rounded-lg border-2 p-4 cursor-pointer transition-all relative',
                          selectedSuperLikePackage === pkg.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        )}
                        onClick={() => setSelectedSuperLikePackage(pkg.id)}
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
                  </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>

        <div className='max-w-sm mx-auto space-y-4 pt-8'>
            <h3 className='text-center font-bold text-lg'>Gold Ayrıcalıkları</h3>
            <ul className='space-y-3'>
               {goldFeatures.map((feature, index) => (
                 <li key={index} className='flex items-center gap-3 p-2 rounded-lg hover:bg-muted'>
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
