
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
        <div className="flex h-dvh flex-col bg-black text-white">
             <header className="absolute top-0 left-0 right-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 bg-transparent px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} disabled={isVerifying} className="bg-black/30 hover:bg-black/50 text-white hover:text-white rounded-full">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div className='w-9'></div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-between p-8 pt-24 text-center">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Profilini Doğrula</h1>
                    <p className="text-white/80">Yüzünü aşağıdaki oval çerçevenin içine ortala.</p>
                     <p className="text-xs text-white/60 mt-2">Doğrulama sistemi yapay zeka ile yönetilmektedir.</p>
                </div>
                
                <div className="relative w-full max-w-[280px] aspect-[3/4]">
                    <div className="absolute inset-0 flex items-center justify-center">
                         {hasCameraPermission === null && (
                            <Icons.logo className="h-16 w-16 animate-pulse text-white/50" />
                         )}
                         {hasCameraPermission === false && (
                            <Alert variant="destructive" className="bg-red-900/80 border-red-500 text-white">
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                                <AlertTitle>Kamera Erişimi Gerekli</AlertTitle>
                                <AlertDescription>
                                    Lütfen bu özelliği kullanmak için kamera erişimine izin verin.
                                </AlertDescription>
                            </Alert>
                         )}
                         <video 
                            ref={videoRef} 
                            className="h-full w-full object-cover scale-x-[-1] rounded-[48%]" // Flip horizontally and apply oval shape
                            autoPlay 
                            muted 
                            playsInline 
                         />
                    </div>
                </div>

                 <Button 
                    className="h-16 w-16 rounded-full"
                    size="icon"
                    onClick={handleVerify}
                    disabled={!hasCameraPermission || isVerifying}
                >
                    {isVerifying ? (
                        <Icons.logo className="h-6 w-6 animate-pulse" />
                    ) : (
                        <Camera className="h-7 w-7" />
                    )}
                </Button>
            </main>
        </div>
    );
}
