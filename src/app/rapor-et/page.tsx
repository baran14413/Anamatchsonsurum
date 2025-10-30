
'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase/provider';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Flag, FileText, Camera, Send, X } from 'lucide-react';
import { langTr } from '@/languages/tr';
import { Icons } from '@/components/icons';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

const reportReasons = [
    { id: 'inappropriate_profile', label: 'Uygunsuz Profil İçeriği' },
    { id: 'harassment', label: 'Taciz veya Zorbalık' },
    { id: 'spam', label: 'Spam veya Dolandırıcılık' },
    { id: 'impersonation', label: 'Taklit veya Sahte Hesap' },
    { id: 'underage', label: 'Reşit Olmayan Kullanıcı' },
    { id: 'other', label: 'Diğer' },
];

export default function ReportPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useUser();
    const firestore = useFirestore();
    const storage = getStorage();
    const { toast } = useToast();

    const reportedUserId = searchParams.get('userId');
    const matchId = searchParams.get('matchId');

    const [reason, setReason] = useState<string>('');
    const [description, setDescription] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setScreenshot(file);
            setScreenshotPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!user || !firestore) {
            toast({ title: 'Hata', description: 'Rapor göndermek için giriş yapmalısınız.', variant: 'destructive' });
            return;
        }
        if (!reportedUserId) {
            toast({ title: 'Hata', description: 'Rapor edilecek kullanıcı bulunamadı.', variant: 'destructive' });
            return;
        }
        if (!reason) {
            toast({ title: 'Hata', description: 'Lütfen bir rapor nedeni seçin.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            let screenshotURL: string | null = null;
            if (screenshot) {
                const uniqueFileName = `reports/${user.uid}/${Date.now()}-${screenshot.name}`;
                const imageRef = storageRef(storage, uniqueFileName);
                const snapshot = await uploadBytes(imageRef, screenshot);
                screenshotURL = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(firestore, 'reports'), {
                reporterId: user.uid,
                reportedId: reportedUserId,
                matchId: matchId,
                reason: reason,
                description: description,
                screenshotURL: screenshotURL,
                status: 'pending', // 'pending', 'resolved', 'banned'
                timestamp: serverTimestamp(),
            });

            toast({
                title: 'Rapor Gönderildi',
                description: 'İnceleme ekibimiz raporunuzu en kısa sürede değerlendirecektir. Teşekkür ederiz.',
            });
            router.back();

        } catch (error: any) {
            console.error("Rapor gönderme hatası:", error);
            toast({
                title: 'Hata',
                description: 'Raporunuz gönderilirken bir sorun oluştu.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-dvh flex-col bg-background">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} disabled={isSubmitting}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold flex items-center gap-2">
                    <Flag className="h-5 w-5" /> Kullanıcıyı Rapor Et
                </h1>
                <div className="w-9"></div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Neden rapor ediyorsun?</h2>
                    <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
                        {reportReasons.map((item) => (
                            <Label
                                key={item.id}
                                htmlFor={item.id}
                                className="flex items-center justify-between rounded-lg border bg-card p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                                <span>{item.label}</span>
                                <RadioGroupItem value={item.id} id={item.id} />
                            </Label>
                        ))}
                    </RadioGroup>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5" /> Açıklama (İsteğe Bağlı)
                    </Label>
                    <Textarea
                        id="description"
                        placeholder="Lütfen durumu detaylı bir şekilde açıklayın..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="space-y-4">
                    <Label htmlFor="screenshot" className="text-lg font-semibold flex items-center gap-2">
                        <Camera className="h-5 w-5" /> Ekran Görüntüsü Ekle (İsteğe Bağlı)
                    </Label>
                    {screenshotPreview ? (
                        <div className="relative w-full max-w-xs aspect-video rounded-lg overflow-hidden">
                            <Image src={screenshotPreview} alt="Ekran görüntüsü önizlemesi" layout="fill" objectFit="cover" />
                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full" onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                            Dosya Seç
                        </Button>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/jpeg"
                    />
                </div>
            </main>

            <footer className="sticky bottom-0 border-t bg-background p-4">
                <Button className="w-full h-12" onClick={handleSubmit} disabled={isSubmitting || !reason}>
                    {isSubmitting ? (
                        <Icons.logo className="mr-2 h-5 w-5 animate-pulse" />
                    ) : (
                        <Send className="mr-2 h-5 w-5" />
                    )}
                    Raporu Gönder
                </Button>
            </footer>
        </div>
    );
}
