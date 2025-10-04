
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, GanttChart } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function KullanimKosullariPage() {
  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Kullanım Koşulları
          </CardTitle>
          <CardDescription>
            Son güncellenme tarihi: 31 Temmuz 2024
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4 text-sm text-muted-foreground">
              <h4 className="font-semibold text-foreground">1. Giriş</h4>
              <p>
                BeMatch'e hoş geldiniz ("Uygulama"). Bu Uygulama, kullanıcıların yeni insanlarla tanışmasını ve sosyal ilişkiler kurmasını sağlamak amacıyla tasarlanmıştır. Bu Kullanım Koşulları ("Koşullar"), Uygulamaya erişiminiz ve kullanımınız için geçerlidir.
              </p>
              
              <h4 className="font-semibold text-foreground">2. Hesap Oluşturma</h4>
              <p>
                Uygulamayı kullanmak için en az 18 yaşında olmanız ve yasal olarak bağlayıcı bir sözleşme yapma ehliyetine sahip olmanız gerekmektedir. Hesap oluştururken sağladığınız bilgilerin doğru, güncel ve eksiksiz olduğunu kabul edersiniz.
              </p>

              <h4 className="font-semibold text-foreground">3. Kullanıcı Davranışı</h4>
              <p>
                Topluluk Kurallarımıza uymayı kabul edersiniz. Taciz, nefret söylemi, yasa dışı faaliyetler veya diğer kullanıcıları rahatsız edici davranışlarda bulunmak kesinlikle yasaktır. Bu tür davranışlar hesabınızın askıya alınmasına veya sonlandırılmasına neden olabilir.
              </p>

              <h4 className="font-semibold text-foreground">4. İçerik</h4>
              <p>
                Uygulamada paylaştığınız tüm fotoğraf, metin ve diğer içeriklerin haklarına sahip olduğunuzu veya gerekli izinleri aldığınızı beyan edersiniz. Yasa dışı, müstehcen veya telif hakkıyla korunan materyalleri paylaşamazsınız. BeMatch, uygunsuz bulduğu içeriği kaldırma hakkını saklı tutar.
              </p>
              
               <h4 className="font-semibold text-foreground">5. Sorumluluğun Sınırlandırılması</h4>
              <p>
                Uygulama "olduğu gibi" sunulmaktadır. BeMatch, kullanıcılar arasındaki etkileşimlerden veya davranışlardan sorumlu tutulamaz. Çevrimdışı buluşmalarınızda kendi güvenliğinizden siz sorumlusunuz.
              </p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
