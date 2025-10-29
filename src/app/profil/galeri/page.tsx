
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Pencil, Star, Video } from 'lucide-react';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { langTr } from '@/languages/tr';
import type { UserImage } from "@/lib/types";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const MAX_IMAGES = 10;

type ImageSlot = {
    file: File | null;
    preview: string | null;
    public_id?: string | null;
    isUploading: boolean;
    type: 'image' | 'video';
    // Add a temporary ID for client-side keying
    tempId: string; 
};

const getInitialImageSlots = (userProfile: any): ImageSlot[] => {
    const slots: ImageSlot[] = [];

    if (userProfile?.images) {
        userProfile.images.forEach((img: UserImage, index: number) => {
            if (index < MAX_IMAGES) {
                slots.push({
                    file: null,
                    preview: img.url,
                    public_id: img.public_id,
                    isUploading: false,
                    type: img.type || 'image',
                    tempId: `server-${img.public_id || index}`
                });
            }
        });
    }

    while (slots.length < MAX_IMAGES) {
        slots.push({
            file: null,
            preview: null,
            public_id: null,
            isUploading: false,
            type: 'image',
            tempId: `new-${slots.length}-${Date.now()}`
        });
    }

    return slots;
};


export default function GalleryPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, userProfile, firestore, storage } = useFirebase();
    const t = langTr.ayarlarGaleri;

    const [imageSlots, setImageSlots] = useState<ImageSlot[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeSlotIndex = useRef<number | null>(null);

    const [isOnboarding, setIsOnboarding] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setImageSlots(getInitialImageSlots(userProfile));
            if (!userProfile.rulesAgreed) {
                setIsOnboarding(true);
            }
        }
    }, [userProfile]);

    const uploadedImageCount = useMemo(() => imageSlots.filter(slot => slot.preview).length, [imageSlots]);

    const handleFileSelect = (index: number) => {
        if(isSubmitting) return;
        activeSlotIndex.current = index;
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || activeSlotIndex.current === null) return;
        const file = e.target.files[0];
        const indexToUpdate = activeSlotIndex.current;
        uploadFile(file, indexToUpdate);
        if (e.target) e.target.value = '';
    };

    const uploadFile = async (file: File, index: number) => {
        if (!storage || !user) return;
        
        const fileType = file.type.startsWith('video') ? 'video' : 'image';
        const tempId = `uploading-${index}-${Date.now()}`;
        const previewUrl = URL.createObjectURL(file);

        setImageSlots(prev => prev.map((s, i) => i === index ? { ...s, file, preview: previewUrl, isUploading: true, type: fileType, tempId } : s));

        const uniqueFileName = `bematch_profiles/${user.uid}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const imageRef = storageRef(storage, uniqueFileName);

        try {
            const snapshot = await uploadBytes(imageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Clean up the object URL after upload
            URL.revokeObjectURL(previewUrl);

            setImageSlots(prev => prev.map((s, i) => i === index ? { isUploading: false, public_id: uniqueFileName, preview: downloadURL, file: null, type: fileType, tempId: `server-${uniqueFileName}` } : s));

        } catch (error: any) {
            toast({ title: t.toasts.uploadFailedTitle, description: error.message, variant: "destructive" });
            // Revert on error
            setImageSlots(prev => prev.map((s, i) => i === index ? { ...s, file: null, preview: null, isUploading: false, tempId: `new-${i}-${Date.now()}` } : s));
        }
    };
    
    const handleDeleteImage = async (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if (uploadedImageCount <= 2 && isOnboarding) {
             toast({ title: "En Az 2 Medya Gerekli", description: "Devam etmek için en az 2 fotoğraf veya video yüklemelisin.", variant: "destructive" });
             return;
        }
        if (uploadedImageCount <= 1 && !isOnboarding) {
            toast({ title: "Profil Medyası Gerekli", description: "Profilinizde en az 1 fotoğraf veya video bulunmalıdır.", variant: "destructive" });
            return;
        }

        const slotToDelete = imageSlots[index];
        const newSlots = [...imageSlots];
        newSlots.splice(index, 1);
        newSlots.push({ file: null, preview: null, public_id: null, isUploading: false, type: 'image', tempId: `new-${newSlots.length}-${Date.now()}` });
        setImageSlots(newSlots);

        if (slotToDelete.public_id && storage) {
            try {
                const imageRef = storageRef(storage, slotToDelete.public_id);
                await deleteObject(imageRef);
                 toast({ title: t.toasts.deleteSuccessTitle, description: t.toasts.deleteSuccessDesc });
            } catch (err: any) {
                 if (err.code !== 'storage/object-not-found') {
                     console.error("Failed to delete media from Firebase Storage:", err);
                     toast({ title: t.toasts.deleteErrorTitle, description: t.toasts.deleteErrorDesc, variant: "destructive" });
                     // Revert on error by re-fetching from profile
                     if(userProfile) setImageSlots(getInitialImageSlots(userProfile));
                 }
            }
        }
    };

    const handleSaveChanges = async () => {
        if (!firestore || !user) return;
        if (uploadedImageCount < 1) {
             toast({ title: "Hata", description: "Lütfen en az 1 medya yükleyin.", variant: "destructive" });
             return;
        }
        if (isOnboarding && uploadedImageCount < 2) {
             toast({ title: "Hata", description: "Devam etmek için en az 2 medya yüklemelisiniz.", variant: "destructive" });
             return;
        }

        setIsSubmitting(true);
        try {
            const finalImages: UserImage[] = imageSlots
                .filter(slot => slot.preview && slot.public_id)
                .map(slot => ({ url: slot.preview!, public_id: slot.public_id!, type: slot.type }));

            await updateDoc(doc(firestore, "users", user.uid), {
                images: finalImages,
                profilePicture: finalImages.length > 0 ? (finalImages[0].type === 'image' ? finalImages[0].url : userProfile?.profilePicture) : null,
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
                <h1 className="text-lg font-semibold">{isOnboarding ? "Profil Medyaları" : t.title}</h1>
                <Button onClick={handleSaveChanges} disabled={isSubmitting || (isOnboarding && uploadedImageCount < 2) || (!isOnboarding && uploadedImageCount < 1)}>
                    {isSubmitting ? <Icons.logo width={24} height={24} className="animate-pulse" /> : (isOnboarding ? langTr.common.next : langTr.common.save)}
                </Button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                <p className="text-muted-foreground text-sm text-center">
                    {isOnboarding ? `Harika bir profil için ilk adımı at! Profilinde göstereceğin en az 2 fotoğraf veya video ekle. (${uploadedImageCount}/${MAX_IMAGES})` : `Profil medyalarını buradan yönetebilirsin. (${uploadedImageCount}/${MAX_IMAGES})`}
                </p>
                <div className="grid grid-cols-3 gap-3">
                    {imageSlots.map((slot, index) => (
                        <div key={slot.tempId} onClick={() => !slot.preview && handleFileSelect(index)} className={cn("cursor-pointer w-full aspect-square border-2 border-dashed bg-card rounded-lg flex items-center justify-center relative overflow-hidden transition-colors hover:bg-muted group", slot.preview && "border-solid border-primary")}>
                            {slot.preview ? (
                                <>
                                    {slot.type === 'video' ? (
                                        <video src={slot.preview} className="w-full h-full object-cover rounded-lg" muted loop playsInline />
                                    ) : (
                                        <Image src={slot.preview} alt={`Medya ${index + 1}`} fill style={{ objectFit: "cover" }} className="rounded-lg" />
                                    )}
                                    {slot.isUploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="w-8 h-8">
                                               <Icons.logo width={32} height={32} className="animate-pulse" />
                                            </div>
                                        </div>
                                    )}
                                    {!isSubmitting && !slot.isUploading && (
                                        <>
                                            <div className="absolute bottom-1 right-1 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <button type="button" onClick={(e) => handleDeleteImage(e, index)} className="h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 backdrop-blur-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                                                <button type="button" onClick={(e) => {e.stopPropagation(); handleFileSelect(index);}} className="h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 backdrop-blur-sm"><Pencil className="w-3.5 h-3.5" /></button>
                                            </div>
                                            {slot.type === 'video' && (
                                                <div className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-1.5 backdrop-blur-sm">
                                                    <Video className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {index === 0 && (
                                        <Badge className="absolute top-2 left-2 z-10 bg-primary/80 backdrop-blur-sm gap-1.5 border-none">
                                            <Star className="w-3 h-3"/>
                                            Profil Medyası
                                        </Badge>
                                    )}
                                </>
                            ) : (
                                <div className="text-center text-muted-foreground p-2 flex flex-col items-center justify-center gap-1">
                                    <div className='h-8 w-8 rounded-full flex items-center justify-center bg-primary/20 text-primary'>
                                        <Plus className="w-5 h-5" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/mp4,video/quicktime" />
            </main>
        </div>
    );
}
