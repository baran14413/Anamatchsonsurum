
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Video, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function FaceVerificationPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        const getCameraPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
    
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } catch (error) {
            console.error('Kameraya erişim hatası:', error);
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Kamera Erişimi Reddedildi',
              description: 'Bu özelliği kullanmak için lütfen tarayıcı ayarlarından kamera izinlerini etkinleştirin.',
            });
          }
        };
    
        getCameraPermission();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        }
      }, [toast]);

    const handleVerify = async () => {
        if (!videoRef.current || !hasCameraPermission) {
            toast({
                variant: 'destructive',
                title: 'Doğrulama Başarısız',
                description: 'Kamera erişimi olmadan doğrulama yapılamaz.',
            });
            return;
        }

        setIsVerifying(true);
        // In a real scenario, you would capture a frame and send it to your AI backend.
        // For now, we will simulate the process.
        await new Promise(resolve => setTimeout(resolve, 2000));

        toast({
            title: 'Doğrulama Başarılı (Simülasyon)',
            description: 'Yüz doğrulama altyapısı hazır. Bir sonraki adımda yapay zeka entegrasyonu yapılacak.',
        });
        setIsVerifying(false);
        router.back();
    };

    return (
        <div className="flex h-dvh flex-col">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} disabled={isVerifying}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Yüz Doğrulama</h1>
                <div className='w-9'></div>
            </header>
            <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center space-y-6">
                <div className="w-full max-w-sm text-center">
                    <h2 className="text-2xl font-bold">Kameraya Bak</h2>
                    <p className="text-muted-foreground">Yüzünü çerçevenin içine ortala ve hazır olduğunda butona bas.</p>
                </div>
                
                <Card className="w-full max-w-sm overflow-hidden">
                    <CardContent className="p-0">
                        <div className="relative aspect-square w-full bg-muted flex items-center justify-center">
                            {hasCameraPermission === null ? (
                                <Icons.logo className="h-12 w-12 animate-pulse text-muted-foreground" />
                            ) : (
                                <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                            )}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        </div>
                    </CardContent>
                </Card>

                {hasCameraPermission === false && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Kamera Erişimi Gerekli</AlertTitle>
                        <AlertDescription>
                            Lütfen bu özelliği kullanmak için kamera erişimine izin verin.
                        </AlertDescription>
                    </Alert>
                )}

                <Button 
                    className="w-full max-w-sm h-14 rounded-full text-lg"
                    onClick={handleVerify}
                    disabled={!hasCameraPermission || isVerifying}
                >
                    {isVerifying ? (
                        <>
                           <Icons.logo className="mr-2 h-5 w-5 animate-pulse" /> Doğrulanıyor...
                        </>
                    ) : (
                        <>
                           <Camera className="mr-2 h-5 w-5" /> Doğrula
                        </>
                    )}
                </Button>
            </main>
        </div>
    );
}