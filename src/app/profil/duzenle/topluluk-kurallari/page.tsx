
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HeartHandshake, CheckCircle2 } from 'lucide-react';

export default function ToplulukKurallariPage() {
  const rules = [
    'Herkese karşı saygılı ve nazik ol.',
    'Nefret söylemi, taciz ve zorbalığa tolerans göstermiyoruz.',
    'Çıplaklık, şiddet veya yasa dışı içerikler paylaşma.',
    'Spam yapma veya başkalarını yanıltmaya çalışma.',
    'Kendin ol ve gerçek bilgilerini paylaş.',
    'Diğer kullanıcıların sınırlarına saygı göster.',
  ];

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartHandshake className="h-6 w-6 text-primary" />
            Topluluk Kuralları
          </CardTitle>
          <CardDescription>
            BeMatch'i herkes için güvenli ve pozitif bir yer olarak tutmamıza yardımcı ol.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {rules.map((rule, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
