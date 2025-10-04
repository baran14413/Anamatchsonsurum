
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TosPage() {
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b px-4">
        <Link href="/" className="p-2 -ml-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Geri</span>
          </Button>
        </Link>
        <Icons.logo width={32} height={32} />
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Card className="flex-1 flex flex-col">
            <CardHeader>
                <CardTitle>Kullanım Şartları</CardTitle>
                <CardDescription>Son Güncelleme: 1 Ağustos 2024</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                            BeMatch ("Uygulama") hizmetine hoş geldiniz. Bu Kullanım Şartları ("Şartlar"), Uygulamamıza erişiminizi ve kullanımınızı yönetir. Hizmetlerimizi kullanarak, bu Şartları kabul etmiş olursunuz.
                        </p>

                        <h4 className="font-semibold text-foreground">1. Hesap Uygunluğu ve Sorumlulukları</h4>
                        <p>
                            Hizmetlerimizi kullanmak için en az 18 yaşında olmalısınız. Hesabınızın güvenliğinden ve hesabınız altında gerçekleşen tüm aktivitelerden siz sorumlusunuz. Doğru ve güncel bilgiler vermeyi kabul edersiniz.
                        </p>

                        <h4 className="font-semibold text-foreground">2. Kullanıcı Davranışı</h4>
                        <p>
                            Topluluğumuzun tüm üyelerine saygılı davranmalısınız. Taciz, zorbalık, nefret söylemi veya herhangi bir yasa dışı veya uygunsuz davranışa tolerans gösterilmez. Bu tür davranışlar, hesabınızın derhal sonlandırılmasına neden olabilir.
                        </p>

                        <h4 className="font-semibold text-foreground">3. İçerik Hakları ve Sorumlulukları</h4>
                        <p>
                            Profilinize yüklediğiniz fotoğraflar, metinler ve diğer içerikler ("İçerik") sizin sorumluluğunuzdadır. İçeriğinizin haklarına sahip olduğunuzu veya gerekli izinleri aldığınızı beyan edersiniz. Müstehcen, şiddet içeren veya telif hakkıyla korunan materyalleri izinsiz paylaşamazsınız. BeMatch, bu kuralları ihlal eden içeriği kaldırma hakkını saklı tutar.
                        </p>

                        <h4 className="font-semibold text-foreground">4. Sorumluluğun Sınırlandırılması</h4>
                        <p>
                           Uygulama "olduğu gibi" sunulmaktadır. Diğer kullanıcılarla olan etkileşimlerinizden tamamen siz sorumlusunuz. BeMatch, kullanıcılar arasındaki davranışlardan veya çevrimdışı buluşmalardan kaynaklanan herhangi bir zarardan sorumlu tutulamaz.
                        </p>
                         <h4 className="font-semibold text-foreground">5. Gizlilik</h4>
                        <p>
                            Gizliliğiniz bizim için çok önemlidir. Verilerinizi nasıl topladığımızı ve kullandığımızı anlamak için lütfen Gizlilik Politikamızı dikkatlice okuyun. Hizmetlerimizi kullanarak, Gizlilik Politikamızı da kabul etmiş olursunuz. Her şey gizlidir ve verileriniz asla satılmaz.
                        </p>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
