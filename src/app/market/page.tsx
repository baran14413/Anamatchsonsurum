'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gem, Star, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { products } from '@/lib/products';
import { getBilling } from '@/lib/billing';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';


// Helper function to check for the native Android interface
const isAndroidInterfaceAvailable = (): boolean => {
  return typeof window !== 'undefined' && (window as any).Android && typeof (window as any).Android.purchase === 'function';
};


export default function MarketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useFirebase();
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const source = searchParams.get('source');
    if (source === 'twa') {
      toast({
        title: 'Markete Erişilemiyor',
        description: 'Ödeme işlemleri yalnızca uygulama mağazası üzerinden yapılabilir.',
      });
      router.replace('/anasayfa');
    } else {
      setIsLoading(false);
    }
  }, [searchParams, router, toast]);


  const goldProducts = products.filter(p => p.type === 'gold');
  const superLikeProducts = products.filter(p => p.type === 'superlike');

  const handlePurchase = async (productId: string) => {
    if (!user) {
      toast({ title: 'Hata', description: 'Satın alım yapmak için giriş yapmalısınız.', variant: 'destructive' });
      return;
    }
    
    setIsPurchasing(productId);

    try {
      if (isAndroidInterfaceAvailable()) {
          console.log(`Attempting purchase via Android interface for product: ${productId}`);
          (window as any).Android.purchase(productId);
          // Android arayüzü sonrası için bir bekleme durumu veya kullanıcı bildirimi eklenebilir.
          // Şimdilik sadece çağrıyı yapıyoruz ve işlemi Android tarafına bırakıyoruz.
          // Native kodun sonucu bildirmesi beklenir.
          toast({
              title: 'Ödeme İşlemi Başlatıldı',
              description: 'Lütfen satın almayı tamamlamak için yönergeleri izleyin.',
          });

      } else {
          // Get the initialized billing plugin. This now waits for initialization.
          const Billing = await getBilling();
          
          toast({
              title: 'Ödeme İşlemi Başlatıldı',
              description: 'Lütfen satın almayı tamamlamak için yönergeleri izleyin.',
          });

          // We only initiate the purchase here. The result is handled by the global listener.
          await Billing.purchase({ productId });
      }

    } catch (error: any) {
      console.error('Satın alma başlatma hatası:', error);
      toast({
          title: 'Satın Alma Başlatılamadı',
          description: 'Ödeme süreci başlatılırken bir sorun oluştu. Lütfen tekrar deneyin.',
          variant: 'destructive',
      });
    } finally {
      // We can stop the loading indicator as our job (initiating) is done.
      setIsPurchasing(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Icons.logo width={48} height={48} className="animate-pulse" />
      </div>
    );
  }


  const ProductCard = ({ product }: { product: typeof products[0] }) => (
    <Card className={cn(
      "flex flex-col text-center transition-transform duration-300 hover:scale-105 hover:shadow-lg",
      product.type === 'gold' && "border-yellow-500 border-2"
    )}>
      <CardHeader>
        <CardTitle className="flex justify-center items-center gap-2 text-xl">
          {product.type === 'gold' ? <Gem className="text-yellow-500" /> : <Star className="text-blue-500" />}
          {product.title}
        </CardTitle>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <p className="text-3xl font-bold">{product.price}</p>
      </CardContent>
      <CardFooter>
        <Button 
          className={cn("w-full", product.type === 'gold' && "bg-yellow-500 hover:bg-yellow-600 text-black")} 
          onClick={() => handlePurchase(product.id)}
          disabled={!!isPurchasing}
        >
          {isPurchasing === product.id ? <Icons.logo width={24} height={24} className="animate-pulse" /> : 'Satın Al'}
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="flex h-dvh flex-col">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Market</h1>
        <div className="w-9" />
      </header>
      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Gold Üyelik Bölümü */}
        <section>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Icons.beGold width={32} height={32}/> BeMatch Gold
            </h2>
            <p className="text-muted-foreground">Sınırsız beğeni, Super Like ve daha fazlasıyla öne çık.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {goldProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* Super Like Bölümü */}
        <section>
           <div className="text-center mb-6">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Star className="text-blue-500 fill-blue-500" /> Super Like Paketleri
            </h2>
            <p className="text-muted-foreground">Normalden 3 kat daha fazla eşleşme şansı yakala.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {superLikeProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
        
      </main>
    </div>
  );
}
