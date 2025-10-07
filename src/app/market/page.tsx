
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gem, Star, Undo2, Zap, Heart, Wallet, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

const goldPackages = [
  { id: 'gold_6m', duration: '6 Ay', price: 449.99, monthly_price: 74.99, popular: true, savings: '50%' },
  { id: 'gold_1m', duration: '1 Ay', price: 149.99, monthly_price: 149.99, popular: false, savings: null },
  { id: 'gold_1w', duration: '1 Hafta', price: 49.99, monthly_price: null, popular: false, savings: null },
];

const superLikePackages = [
  { id: 'sl_50', count: 50, price: 79.99, pricePer: 1.60, popular: true },
  { id: 'sl_10', count: 10, price: 19.99, pricePer: 2.00, popular: false },
  { id: 'sl_100', count: 100, price: 129.99, pricePer: 1.30, popular: false },
];

const goldFeatures = [
    { icon: Heart, title: "Sınırsız Beğeni", description: "İstediğin kadar profili sağa kaydır, limitlere takılma." },
    { icon: Star, title: "Seni Beğenenleri Gör", description: "Merakına son ver! Seni kimlerin beğendiğini anında gör ve eşleş." },
    { icon: Undo2, title: "Sınırsız Geri Alma", description: "Yanlışlıkla sola kaydırdığın profilleri anında geri al." },
    { icon: Zap, title: "Haftalık Ücretsiz Boost", description: "Profilini 30 dakika boyunca öne çıkararak daha fazla kişi tarafından görül." },
    { icon: Gem, title: "Haftalık Ücretsiz Super Like", description: "Her hafta 5 ücretsiz Super Like ile eşleşme şansını 3 kat artır." },
];

export default function MarketPage() {
  const router = useRouter();
  const [selectedGoldPackage, setSelectedGoldPackage] = useState(goldPackages.find(p => p.popular)?.id || goldPackages[0].id);
  const [selectedSuperLikePackage, setSelectedSuperLikePackage] = useState(superLikePackages.find(p => p.popular)?.id || superLikePackages[0].id);

  const getButtonText = (tab: 'gold' | 'super-like') => {
      if (tab === 'gold') {
          const pkg = goldPackages.find(p => p.id === selectedGoldPackage);
          return `${pkg?.duration || ''} SATIN AL`;
      }
      const pkg = superLikePackages.find(p => p.id === selectedSuperLikePackage);
      return `${pkg?.count || ''} SUPER LIKE AL`;
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Market</h1>
        <Link href="/ayarlar/cuzdanim">
            <Button variant="ghost" className="rounded-full">
                <Wallet className="mr-2 h-4 w-4"/>
                Cüzdanım
            </Button>
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto bg-muted/20">
        <Tabs defaultValue="gold" className="w-full">
            <div className='bg-background pb-4 pt-2 sticky top-0 z-10'>
                <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2">
                    <TabsTrigger value="gold">
                        <Gem className="mr-2 h-4 w-4 text-yellow-500"/> BeMatch Gold
                    </TabsTrigger>
                    <TabsTrigger value="super-like">
                        <Star className="mr-2 h-4 w-4 text-blue-500"/> Super Like
                    </TabsTrigger>
                </TabsList>
            </div>
            
            <div className="p-4 md:p-6 space-y-8">
                <TabsContent value="gold" className="mt-0">
                    <Card className="w-full max-w-md mx-auto text-center shadow-lg border-0 bg-transparent">
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
                            selectedGoldPackage === pkg.id ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'
                            )}
                            onClick={() => setSelectedGoldPackage(pkg.id)}
                        >
                            {pkg.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">EN POPÜLER</div>
                            )}
                            <div className="flex justify-between items-center">
                                <p className="text-xl font-bold">{pkg.duration}</p>
                                {pkg.savings && <p className="text-sm font-bold text-green-500">{pkg.savings} KAZANÇLI</p>}
                            </div>
                            <p className="text-3xl font-extrabold text-foreground mt-1">{pkg.price.toFixed(2)} TL</p>
                            {pkg.monthly_price && <p className="text-sm text-muted-foreground">({pkg.monthly_price.toFixed(2)} TL/ay)</p>}
                        </div>
                        ))}
                    </CardContent>
                    <CardFooter className="flex-col gap-4 px-6 pb-6">
                        <Button size="lg" className="w-full h-12 rounded-full font-bold text-lg">
                            {getButtonText('gold')}
                        </Button>
                    </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="super-like" className="mt-0">
                    <Card className="w-full max-w-md mx-auto text-center shadow-lg border-0 bg-transparent">
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
                        {superLikePackages.map((pkg) => {
                            return (
                                <div
                                    key={pkg.id}
                                    className={cn(
                                    'rounded-lg border-2 p-4 cursor-pointer transition-all relative',
                                    selectedSuperLikePackage === pkg.id ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'
                                    )}
                                    onClick={() => setSelectedSuperLikePackage(pkg.id)}
                                >
                                    {pkg.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">EN POPÜLER</div>
                                    )}
                                    <p className="text-lg font-bold">{pkg.count} Super Like</p>
                                    <p className="text-2xl font-extrabold text-foreground mt-1">{pkg.price.toFixed(2)} TL</p>
                                    <p className="text-sm text-muted-foreground">({pkg.pricePer.toFixed(2)} TL / adet)</p>
                                </div>
                            )
                        })}
                    </CardContent>
                    <CardFooter className="flex-col gap-4 px-6 pb-6">
                        <Button size="lg" className="w-full h-12 rounded-full font-bold text-lg">
                           {getButtonText('super-like')}
                        </Button>
                    </CardFooter>
                    </Card>
                </TabsContent>

                <div className='max-w-md mx-auto space-y-4 pt-8'>
                    <h3 className='text-center font-bold text-xl'>Gold Ayrıcalıkları</h3>
                    <div className='space-y-3'>
                    {goldFeatures.map((feature, index) => (
                        <Card key={index} className='p-4 flex items-center gap-4 bg-background'>
                            <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0'>
                                <feature.icon className='w-6 h-6'/>
                            </div>
                            <div>
                                <h4 className='font-semibold'>{feature.title}</h4>
                                <p className='text-sm text-muted-foreground'>{feature.description}</p>
                            </div>
                        </Card>
                    ))}
                    </div>
                </div>
                
                <div className="mt-8 text-center text-xs text-muted-foreground max-w-md mx-auto">
                    <p>Ödeme, satın alma onayıyla birlikte Google Play Hesabınızdan tahsil edilecektir. Abonelik, mevcut dönemin bitiminden en az 24 saat önce otomatik yenileme kapatılmadığı sürece otomatik olarak yenilenir.</p>
                </div>
            </div>
      </main>
    </div>
  );
}
