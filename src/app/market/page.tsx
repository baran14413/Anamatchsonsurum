'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gem, Star, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { products, getProductById } from '@/lib/products';
import { initializeBilling, getBilling } from '@/lib/billing';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, increment, serverTimestamp, Timestamp, addDoc, collection } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { add } from 'date-fns';

export default function MarketPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [isBillingReady, setIsBillingReady] = useState(false);

  const goldProducts = products.filter(p => p.type === 'gold');
  const superLikeProducts = products.filter(p => p.type === 'superlike');

  // Initialize the billing plugin when the component mounts
  useEffect(() => {
    initializeBilling().then(() => {
      setIsBillingReady(true);
      console.log("Billing is now ready.");
    });
  }, []);

  const handlePurchase = async (productId: string) => {
    if (!isBillingReady) {
      toast({ title: 'Hata', description: 'Faturalandırma servisi henüz hazır değil. Lütfen bir an bekleyin.', variant: 'destructive' });
      return;
    }

    if (!user || !firestore) {
      toast({ title: 'Hata', description: 'Satın alım yapmak için giriş yapmalısınız.', variant: 'destructive' });
      return;
    }

    setIsPurchasing(productId);

    try {
      const Billing = getBilling();
      const result = await Billing.purchase({ productId });
      
      const product = getProductById(productId);

      if (result.purchaseState === 'PURCHASED' && product) {
        
        const userDocRef = doc(firestore, 'users', user.uid);
        const updateData: any = {};
        
        if (product.type === 'gold') {
          updateData.membershipType = 'gold';
          let expiryDate: Date | null = new Date();
          if (product.id.includes('1month')) {
            expiryDate = add(new Date(), { months: 1 });
          } else if (product.id.includes('6months')) {
            expiryDate = add(new Date(), { months: 6 });
          } else if (product.id.includes('1year')) {
            expiryDate = add(new Date(), { years: 1 });
          }
          updateData.goldMembershipExpiresAt = Timestamp.fromDate(expiryDate);
        } else if (product.type === 'superlike') {
          const amount = parseInt(product.id.split('.').pop() || '0');
          updateData.superLikeBalance = increment(amount);
        }

        await updateDoc(userDocRef, updateData);
        
        await addDoc(collection(firestore, 'purchases'), {
            userId: user.uid,
            productId: productId,
            purchaseDate: serverTimestamp(),
            ...result
        });

        toast({
          title: 'Satın Alma Başarılı!',
          description: `${product.title} paketi hesabınıza eklendi.`,
        });

      } else if (result.purchaseState === 'CANCELLED') {
        // Do nothing, user cancelled.
      } else {
        // This handles PENDING, FAILED, or UNSPECIFIED states without throwing an error.
        // We just inform the user that the process is not complete.
        // The billing plugin should emit events for final states which should be handled elsewhere.
         console.log(`Purchase ended with state: ${result.purchaseState}`);
      }

    } catch (error: any) {
      console.error('Satın alma hatası:', error);
      if (error.message && !error.message.toLowerCase().includes('cancel')) {
          toast({
              title: 'Satın Alma Başarısız',
              description: 'Ödeme sırasında bir sorun oluştu. Lütfen tekrar deneyin.',
              variant: 'destructive',
          });
      }
    } finally {
      setIsPurchasing(null);
    }
  };

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
          disabled={!!isPurchasing || !isBillingReady}
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
