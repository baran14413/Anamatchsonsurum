
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Video, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { verifyFace } from '@/ai/flows/verify-face-flow';
import { doc, updateDoc } from 'firebase/firestore';

// Helper function to convert a data URL to a Blob
const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

// Helper function to fetch and convert an image URL to a data URI via a server-side proxy
const toDataURL = async (url: string): Promise<string> => {
    try {
        const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch image via proxy: ${response.statusText}`);
        }
        const { dataUri } = await response.json();
        return dataUri;
    } catch (error) {
        console.error("Error fetching image via proxy:", error);
        throw error;
    }
};


export default function FaceVerificationPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, userProfile } = useUser();
    const firestore = useFirestore();
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

    const captureFrame = (): string | null => {
        if (!videoRef.current) return null;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg');
    };

    const handleVerify = async () => {
        if (!videoRef.current || !hasCameraPermission || !userProfile?.profilePicture || !user || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Doğrulama Başarısız',
                description: 'Kamera erişimi, profil fotoğrafı ve kullanıcı oturumu olmadan doğrulama yapılamaz.',
            });
            return;
        }

        setIsVerifying(true);
        const cameraFrameDataUri = captureFrame();

        if (!cameraFrameDataUri) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Kamera görüntüsü alınamadı.' });
            setIsVerifying(false);
            return;
        }

        try {
            const profileImageDataUri = await toDataURL(userProfile.profilePicture);

            const result = await verifyFace({
                profileImageDataUri: profileImageDataUri,
                cameraFrameDataUri: cameraFrameDataUri,
            });

            if (result.isSamePerson) {
                await updateDoc(doc(firestore, 'users', user.uid), {
                    isPhotoVerified: true
                });
                toast({
                    title: 'Doğrulama Başarılı!',
                    description: 'Profiliniz başarıyla doğrulandı. Artık mavi tik rozetine sahipsiniz.',
                });
                router.back();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Doğrulama Başarısız',
                    description: 'Profil fotoğrafınızla yüzünüz eşleşmedi. Lütfen daha net bir poz deneyin.',
                });
            }
        } catch (error) {
            console.error("Yüz doğrulama hatası:", error);
            toast({
                variant: 'destructive',
                title: 'Bir Hata Oluştu',
                description: 'Yapay zeka doğrulaması sırasında bir sorun yaşandı. Lütfen tekrar deneyin.',
            });
        } finally {
            setIsVerifying(false);
        }
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
                     <p className="text-xs text-muted-foreground mt-2">Doğrulama sistemi yapay zeka ile yönetilmektedir.</p>
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
