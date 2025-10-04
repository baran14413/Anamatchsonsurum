
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PrivacyPage() {
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
                <CardTitle>Gizlilik Politikası</CardTitle>
                <CardDescription>Son Güncelleme: 1 Ağustos 2024</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                           BeMatch olarak gizliliğinize son derece önem veriyoruz. Bu Gizlilik Politikası, hizmetlerimizi kullandığınızda hangi bilgileri topladığımızı, bu bilgileri nasıl kullandığımızı ve koruduğumuzu açıklamaktadır.
                        </p>

                        <h4 className="font-semibold text-foreground">1. Topladığımız Bilgiler</h4>
                        <p>
                            <strong>Profil Bilgileri:</strong> Adınız, e-posta adresiniz, doğum tarihiniz, cinsiyetiniz, fotoğraflarınız, ilgi alanlarınız ve biyografiniz gibi kayıt sırasında sağladığınız bilgiler.
                        </p>
                        <p>
                            <strong>Konum Bilgileri:</strong> Size yakın potansiyel eşleşmeleri göstermek için izninizle coğrafi konum bilgilerinizi toplarız.
                        </p>
                        <p>
                            <strong>Kullanım Verileri:</strong> Uygulama içindeki etkileşimleriniz (beğeniler, eşleşmeler, sohbetler) hakkında bilgi toplarız. Bu, hizmetimizi iyileştirmemize yardımcı olur.
                        </p>

                        <h4 className="font-semibold text-foreground">2. Bilgilerinizi Nasıl Kullanıyoruz?</h4>
                        <p>
                           Topladığımız bilgileri şu amaçlarla kullanırız:
                           <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Size hizmetlerimizi sunmak ve yönetmek.</li>
                                <li>Diğer kullanıcılarla eşleşmenizi sağlamak.</li>
                                <li>Uygulamamızı kişiselleştirmek ve geliştirmek.</li>
                                <li>Sizinle iletişim kurmak ve destek sağlamak.</li>
                           </ul>
                        </p>

                        <h4 className="font-semibold text-foreground">3. Bilgilerin Paylaşımı</h4>
                        <p>
                           <strong>Her şey gizlidir.</strong> Kişisel bilgileriniz kesinlikle üçüncü taraflara satılmaz veya kiralanmaz. Bilgileriniz yalnızca profilinizin diğer kullanıcılar tarafından görülebilmesi gibi hizmetin temel işlevleri için kullanılır. Yasal bir zorunluluk olmadıkça verileriniz kimseyle paylaşılmaz.
                        </p>
                        
                        <h4 className="font-semibold text-foreground">4. Veri Güvenliği</h4>
                        <p>
                            Kişisel bilgilerinizi korumak için endüstri standardı güvenlik önlemleri alıyoruz. Ancak, internet üzerinden hiçbir iletim yönteminin %100 güvenli olmadığını unutmamanız önemlidir.
                        </p>

                         <h4 className="font-semibold text-foreground">5. Haklarınız</h4>
                        <p>
                           Profil ayarlarınızdan bilgilerinize erişme, onları düzeltme veya silme hakkına sahipsiniz. Hesabınızı istediğiniz zaman silebilirsiniz.
                        </p>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
