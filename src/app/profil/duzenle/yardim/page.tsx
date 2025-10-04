
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ShieldQuestion, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function YardimPage() {
  const faqs = [
    {
      question: 'Profilimi nasıl düzenlerim?',
      answer: 'Profil sayfanızdaki "Profili Düzenle" butonuna veya Ayarlar menüsündeki "Kişisel Bilgiler" seçeneğine tıklayarak bilgilerinizi güncelleyebilirsiniz.',
    },
    {
      question: 'Eşleşmelerimi nerede görebilirim?',
      answer: 'Alt navigasyon menüsündeki "Mesajlar" ikonuna tıklayarak tüm eşleşmelerinizi ve sohbetlerinizi görüntüleyebilirsiniz.',
    },
    {
      question: 'Bir kullanıcıyı nasıl engellerim?',
      answer: 'Kullanıcının profiline gidip sağ üst köşedeki üç nokta menüsünden "Engelle" seçeneğini seçebilirsiniz.',
    },
    {
      question: 'Aboneliğimi nasıl iptal ederim?',
      answer: 'Profil sayfanızdaki "Abonelikler" bölümünden mevcut aboneliğinizi yönetebilir ve iptal edebilirsiniz.',
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldQuestion className="h-6 w-6 text-primary" />
            Yardım Merkezi
          </CardTitle>
          <CardDescription>
            Sorularına yanıt bulamadın mı? Yardım için buradayız.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Aklındaki soru ne?" className="pl-10" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Sıkça Sorulan Sorular</h3>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
