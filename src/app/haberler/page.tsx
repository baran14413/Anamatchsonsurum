
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Rss } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Mock data for news articles
const newsArticles = [
    {
        id: '1',
        title: 'BeMatch Gold ile Tanışın!',
        excerpt: 'Sınırsız beğeni, Super Like ve daha birçok premium özellikle tanışma deneyimini bir üst seviyeye taşı. Profilini öne çıkar, seni kimlerin beğendiğini anında gör ve eşleşme şansını katla!',
        date: new Date(2024, 7, 28),
    },
    {
        id: '2',
        title: 'Yeni Topluluk Kuralları ve Güvenlik İpuçları',
        excerpt: 'Topluluğumuzu daha güvenli ve pozitif bir yer haline getirmek için topluluk kurallarımızı güncelledik. Herkes için daha iyi bir deneyim sağlamak adına lütfen yeni kurallara göz atın.',
        date: new Date(2024, 7, 25),
    },
    {
        id: '3',
        title: 'Yaz Etkinlikleri Başlıyor: Şehrindeki BeMatch Buluşmaları',
        excerpt: 'Bu yaz BeMatch, şehrindeki en popüler mekanlarda özel etkinlikler düzenliyor. Yeni insanlarla tanışmak, eğlenmek ve unutulmaz anılar biriktirmek için yerini ayırt!',
        date: new Date(2024, 7, 20),
    }
];

export default function NewsPage() {
    const router = useRouter();

    return (
        <div className="flex h-dvh flex-col bg-background relative overflow-hidden">
            {/* Emoji Background */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none text-4xl leading-none" style={{
                backgroundImage: 'radial-gradient(circle, transparent, hsl(var(--background)) 80%)',
                maskImage: 'radial-gradient(circle, white, transparent 80%)',
            }}>
                <div className="whitespace-nowrap animate-marquee">
                    {'♥️💖💜🤎🖤💛💚'.repeat(50)}
                </div>
                 <div className="whitespace-nowrap animate-marquee-reverse">
                    {'💚💛🖤🤎💜💖♥️'.repeat(50)}
                </div>
                 <div className="whitespace-nowrap animate-marquee">
                    {'💖💜🤎🖤💛💚♥️'.repeat(50)}
                </div>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                @keyframes marquee-reverse {
                    from { transform: translateX(-50%); }
                    to { transform: translateX(0); }
                }
                .animate-marquee {
                    animation: marquee 60s linear infinite;
                }
                .animate-marquee-reverse {
                    animation: marquee-reverse 60s linear infinite;
                }
            `}</style>
            
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Haberler & Duyurular</h1>
                <div className="w-9"></div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
                {newsArticles.map((article) => (
                    <Card key={article.id} className="bg-background/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>{article.title}</CardTitle>
                            <CardDescription>
                                {format(article.date, "d MMMM yyyy, eeee", { locale: tr })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{article.excerpt}</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="link" className="p-0">Devamını Oku →</Button>
                        </CardFooter>
                    </Card>
                ))}
            </main>
        </div>
    );
}
