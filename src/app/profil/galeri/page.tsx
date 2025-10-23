
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Pencil, Star } from 'lucide-react';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { langTr } from '@/languages/tr';
import type { UserImage } from "@/lib/types";
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

type ImageSlot = {
    file: File | null;
    preview: string | null;
    public_id?: string | null;
    isUploading: boolean;
};

const getInitialImageSlot = (userProfile: any): ImageSlot => {
    let slot: ImageSlot = { file: null, preview: null, public_id: null, isUploading: false };

    if (userProfile?.images && userProfile.images.length > 0) {
        const mainImage = userProfile.images[0];
        slot = {
            file: null,
            preview: mainImage.url,
            public_id: mainImage.public_id,
            isUploading: false
        };
    }
    return slot;
};


export default function GalleryPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, userProfile, firestore, storage } = useFirebase();
    const t = langTr.ayarlarGaleri;

    const [imageSlot, setImageSlot] = useState<ImageSlot>(() => getInitialImageSlot(userProfile));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isOnboarding, setIsOnboarding] = useState(false);

    useEffect(() => {
        if (userProfile && !userProfile.rulesAgreed) {
            setIsOnboarding(true);
        }
    }, [userProfile]);


    useEffect(() => {
        if (userProfile) {
            setImageSlot(getInitialImageSlot(userProfile));
        }
    }, [userProfile]);

    const uploadedImageCount = useMemo(() => imageSlot.preview ? 1 : 0, [imageSlot]);

    const handleFileSelect = () => {
        if(isSubmitting) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        uploadFile(file);
        if (e.target) e.target.value = '';
    };

    const uploadFile = async (file: File) => {
        if (!storage || !user) return;
        
        // If there's an existing image with a public_id, try to delete it from storage
        if (imageSlot.public_id) {
            const imageRefToDelete = storageRef(storage, imageSlot.public_id);
            // It's safe to try to delete, if it fails because it doesn't exist (e.g. google pfp), it won't throw a critical error.
            await deleteObject(imageRefToDelete).catch(err => {
                if (err.code !== 'storage/object-not-found') {
                    console.error("Failed to delete old image from storage:", err);
                }
            });
        }
        
        handleImageUpload(file);
    }


    const handleImageUpload = async (file: File) => {
        if (!storage || !user) {
            toast({ title: "Hata", description: "Depolama servisi başlatılamadı.", variant: "destructive" });
            return;
        }

        setImageSlot({ file, preview: URL.createObjectURL(file), isUploading: true });

        const uniqueFileName = `bematch_profiles/${user.uid}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const imageRef = storageRef(storage, uniqueFileName);

        try {
            const snapshot = await uploadBytes(imageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            setImageSlot({ isUploading: false, public_id: uniqueFileName, preview: downloadURL, file: null });

        } catch (error: any) {
            toast({ title: t.toasts.uploadFailedTitle, description: error.message, variant: "destructive" });
            setImageSlot(getInitialImageSlot(userProfile));
        }
    };
    
    const handleDeleteImage = async (e: React.MouseEvent) => {
        e.stopPropagation();
        toast({ title: "Profil Fotoğrafı Gerekli", description: "Profilinizde en az 1 fotoğraf bulunmalıdır.", variant: "destructive" });
    };

    const handleSaveChanges = async () => {
        if (!firestore || !user) return;
        if (uploadedImageCount < 1 || !imageSlot.preview || !imageSlot.public_id) {
             toast({ title: "Hata", description: "Lütfen bir profil fotoğrafı yükleyin.", variant: "destructive" });
             return;
        }

        setIsSubmitting(true);
        try {
            const finalImages: UserImage[] = [{ url: imageSlot.preview, public_id: imageSlot.public_id }];

            await updateDoc(doc(firestore, "users", user.uid), {
                images: finalImages,
                profilePicture: finalImages[0].url,
            });
            
            toast({
                title: t.toasts.saveSuccessTitle,
                description: t.toasts.saveSuccessDesc,
            });
            
            if(isOnboarding) {
                router.push('/kurallar');
            } else {
                router.push('/profil');
            }
        } catch (error: any) {
            console.error("Gallery save error:", error);
            toast({ title: t.toasts.saveErrorTitle, description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} disabled={isSubmitting || isOnboarding}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">{isOnboarding ? "Profil Fotoğrafı" : t.title}</h1>
                <Button onClick={handleSaveChanges} disabled={isSubmitting || uploadedImageCount < 1}>
                    {isSubmitting ? <Icons.logo width={24} height={24} className="animate-pulse" /> : (isOnboarding ? langTr.common.next : langTr.common.save)}
                </Button>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-center items-center">
                 <div className="w-full max-w-xs space-y-6">
                    <p className="text-muted-foreground text-sm text-center">
                        {isOnboarding ? "Harika bir profil için ilk adımı at! Profilinde göstereceğin fotoğrafı ekle." : "Profil fotoğrafını buradan yönetebilirsin."}
                    </p>
                    <Alert className="mb-4">
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                            Yüklediğiniz fotoğraf, daha sonra sizin olduğunuzu doğrulamak için kullanılacaktır.
                        </AlertDescription>
                    </Alert>

                    <div className="relative aspect-square w-full">
                         <div onClick={handleFileSelect} className={cn("cursor-pointer w-full h-full border-2 border-dashed bg-card rounded-lg flex items-center justify-center relative overflow-hidden transition-colors hover:bg-muted group", imageSlot.preview && "border-solid border-primary")}>
                            {imageSlot.preview ? (
                                <>
                                    <Image src={imageSlot.preview} alt="Profil Fotoğrafı Önizlemesi" fill style={{ objectFit: "cover" }} className="rounded-lg" />
                                    {imageSlot.isUploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="w-16 h-16">
                                               <Icons.logo width={64} height={64} className="animate-pulse" />
                                            </div>
                                        </div>
                                    )}
                                    <Badge className="absolute top-2 left-2 z-10 bg-primary/80 backdrop-blur-sm gap-1.5 border-none">
                                        <Star className="w-3 h-3"/>
                                        Profil Fotoğrafı
                                    </Badge>
                                    {!isSubmitting && !imageSlot.isUploading && (
                                        <div className="absolute bottom-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <button type="button" onClick={(e) => {e.stopPropagation(); handleFileSelect();}} className="h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 backdrop-blur-sm"><Pencil className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center text-muted-foreground p-2 flex flex-col items-center justify-center gap-2">
                                    <div className='h-16 w-16 rounded-full flex items-center justify-center bg-primary/20 text-primary'>
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <span className="font-semibold">Fotoğraf Yükle</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                 </div>
            </main>
        </div>
    );
}
