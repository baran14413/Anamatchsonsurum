
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CookiesPage() {
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
                <CardTitle>Çerez Politikası</CardTitle>
                <CardDescription>Son Güncelleme: 1 Ağustos 2024</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          Bu Çerez Politikası, BeMatch'in ("biz", "bize" veya "bizim") web sitemizde ve mobil uygulamamızda çerezleri ve benzeri teknolojileri nasıl kullandığını açıklamaktadır.
                        </p>

                        <h4 className="font-semibold text-foreground">1. Çerez Nedir?</h4>
                        <p>
                           Çerezler, bir web sitesini ziyaret ettiğinizde cihazınıza (bilgisayar, tablet veya mobil) indirilen küçük metin dosyalarıdır. Çerezler, web sitelerinin çalışmasını veya daha verimli çalışmasını sağlamanın yanı sıra web sitesi sahiplerine bilgi sağlamak için yaygın olarak kullanılır.
                        </p>

                        <h4 className="font-semibold text-foreground">2. Kullandığımız Çerez Türleri</h4>
                        <p>
                            Uygulamamızın düzgün çalışması için yalnızca kesinlikle gerekli olan çerezleri kullanıyoruz. Bu çerezler, temel işlevleri yerine getirmemizi sağlar.
                        </p>
                        <p>
                           <strong>Oturum Çerezleri:</strong> Bu çerezler, oturumunuzu açık tutmak için gereklidir. Bu çerezler olmadan, her sayfada yeniden giriş yapmanız gerekirdi. Bu, hizmetimizin temel bir parçasıdır.
                        </p>
                         <p>
                           <strong>Güvenlik Çerezleri:</strong> Hesabınızı ve verilerinizi güvende tutmaya yardımcı olan çerezlerdir.
                        </p>

                        <h4 className="font-semibold text-foreground">3. Pazarlama ve Analitik Çerezleri</h4>
                        <p>
                          Şu anda pazarlama, reklam veya üçüncü taraf analitik çerezleri kullanmıyoruz. Gizliliğiniz bizim için önemlidir ve sizi gereksiz yere takip etmiyoruz. Politikamızda bir değişiklik olursa, bu sayfa güncellenecektir.
                        </p>

                        <h4 className="font-semibold text-foreground">4. Çerezleri Yönetme</h4>
                        <p>
                           Kullandığımız çerezler, hizmetimizin çalışması için zorunlu olduğundan, bunları devre dışı bırakma seçeneği sunmuyoruz. Bu çerezleri engellerseniz, uygulamanın bazı bölümleri beklendiği gibi çalışmayabilir.
                        </p>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
