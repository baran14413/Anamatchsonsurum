
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Pencil, Image as ImageIcon, Star } from 'lucide-react';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { langTr } from '@/languages/tr';
import { Progress } from "@/components/ui/progress";
import type { UserImage } from "@/lib/types";
import { Badge } from '@/components/ui/badge';

type ImageSlot = {
    file: File | null;
    preview: string | null;
    public_id?: string | null;
    isUploading: boolean;
};

const getInitialImageSlots = (userProfile: any): ImageSlot[] => {
    const slots: ImageSlot[] = Array.from({ length: 6 }, () => ({ file: null, preview: null, public_id: null, isUploading: false }));

    if (userProfile?.images) {
        userProfile.images.forEach((img: UserImage, index: number) => {
            if (index < 6) {
                slots[index] = {
                    file: null,
                    preview: img.url,
                    public_id: img.public_id,
                    isUploading: false
                };
            }
        });
    }

    return slots;
};


export default function GalleryPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, userProfile } = useUser();
    const firestore = useFirestore();
    const t = langTr.ayarlarGaleri;

    const [imageSlots, setImageSlots] = useState<ImageSlot[]>(() => getInitialImageSlots(userProfile));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (userProfile) {
            setImageSlots(getInitialImageSlots(userProfile));
        }
    }, [userProfile]);

    const uploadedImageCount = useMemo(() => imageSlots.filter(p => p.preview).length, [imageSlots]);

    const handleFileSelect = (index: number) => {
        if(isSubmitting) return;
        fileInputRef.current?.setAttribute('data-slot-index', String(index));
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const slotIndexStr = fileInputRef.current?.getAttribute('data-slot-index');
        const slotIndex = slotIndexStr ? parseInt(slotIndexStr) : -1;

        if (slotIndex === -1) return;
        
        handleImageUpload(file, slotIndex);

        if (e.target) e.target.value = '';
    };

    const handleImageUpload = async (file: File, slotIndex: number) => {
        
        setImageSlots(prev => {
            const newSlots = [...prev];
            const targetIndex = newSlots.findIndex(slot => !slot.preview);
            const finalIndex = targetIndex === -1 ? 5 : targetIndex;

            newSlots[finalIndex] = { ...newSlots[finalIndex], file, preview: URL.createObjectURL(file), isUploading: true };
            return newSlots;
        });

        const formData = new FormData();
        formData.append('file', file);
        const tempPreviewUrl = URL.createObjectURL(file);
        let finalIndex = imageSlots.findIndex(slot => !slot.preview);
        if (finalIndex === -1) finalIndex = 5;

        try {
            const response = await fetch('/api/upload', {
                 method: 'POST',
                 body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Yükleme başarısız');
            }
            const result = await response.json();

            setImageSlots(prev => {
                const newSlots = [...prev];
                newSlots[finalIndex] = { ...newSlots[finalIndex], isUploading: false, public_id: result.public_id, preview: result.url, file: null };
                return newSlots;
            });

        } catch (error: any) {
            toast({ title: t.toasts.uploadFailedTitle, description: error.message, variant: "destructive" });
            setImageSlots(prev => {
                const newSlots = [...prev];
                const slotToClear = newSlots.find(s => s.preview === tempPreviewUrl);
                if (slotToClear) {
                    slotToClear.file = null;
                    slotToClear.preview = null;
                    slotToClear.isUploading = false;
                }
                return newSlots;
            });
        }
    };
    
    const handleDeleteImage = async (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if(isSubmitting) return;

        if (uploadedImageCount <= 1) {
            toast({ title: t.toasts.deleteFailedMinRequiredTitle, description: t.toasts.deleteFailedMinRequiredDesc, variant: "destructive" });
            return;
        }

        const slotToDelete = imageSlots[index];
        if (slotToDelete.public_id) {
            try {
                await fetch('/api/delete-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ public_id: slotToDelete.public_id }),
                });
            } catch (err) {
                 console.error("Failed to delete from Cloudinary but proceeding in UI", err);
            }
        }
        
        setImageSlots(prevSlots => {
            const newSlots = [...prevSlots];
            // Revoke the object URL to free up memory
            if (newSlots[index].preview && newSlots[index].file) {
                 URL.revokeObjectURL(newSlots[index].preview!);
            }
            // Remove the item at the index
            newSlots.splice(index, 1);
            // Add a new empty slot at the end
            newSlots.push({ file: null, preview: null, public_id: null, isUploading: false });
            return newSlots;
        });

        toast({ title: t.toasts.deleteSuccessTitle, description: t.toasts.deleteSuccessDesc });
    };

    const handleSaveChanges = async () => {
        if (!firestore || !user) return;
        if (uploadedImageCount < 1) {
             toast({ title: "Hata", description: "En az 1 fotoğraf yüklemelisiniz.", variant: "destructive" });
             return;
        }

        setIsSubmitting(true);
        try {
            const finalImages = imageSlots
                .filter(p => p.preview && p.public_id)
                .map(p => ({ url: p.preview!, public_id: p.public_id! }));

            await updateDoc(doc(firestore, "users", user.uid), {
                images: finalImages,
                profilePicture: finalImages.length > 0 ? finalImages[0].url : '',
            });
            
            toast({
                title: t.toasts.saveSuccessTitle,
                description: t.toasts.saveSuccessDesc,
            });
            router.push('/profil');
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
                <Button variant="ghost" size="icon" onClick={() => router.back()} disabled={isSubmitting}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">{t.title}</h1>
                <Button onClick={handleSaveChanges} disabled={isSubmitting || uploadedImageCount < 1}>
                    {isSubmitting ? <Icons.logo width={24} height={24} className="animate-pulse" /> : langTr.common.save}
                </Button>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                 <div>
                    <p className="text-muted-foreground text-sm mb-4">{t.description.replace('9', '6')}</p>
                    <div className="space-y-2">
                        <Progress value={(uploadedImageCount / 6) * 100} className="h-2" />
                        <p className="text-sm font-medium text-muted-foreground text-right">{uploadedImageCount} / 6</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {imageSlots.map((slot, index) => (
                        <div key={index} className="relative aspect-square">
                            {index === 0 && slot.preview && (
                                <Badge className="absolute top-2 left-2 z-10 bg-primary/80 backdrop-blur-sm gap-1.5">
                                    <Star className="w-3 h-3"/>
                                    Profil Fotoğrafı
                                </Badge>
                            )}
                            <div onClick={() => handleFileSelect(index)} className="cursor-pointer w-full h-full border-2 border-dashed bg-card rounded-lg flex items-center justify-center relative overflow-hidden transition-colors hover:bg-muted">
                                {slot.preview ? (
                                    <>
                                        <Image src={slot.preview} alt={`Preview ${index}`} fill style={{ objectFit: "cover" }} className="rounded-lg" />
                                        {slot.isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Icons.logo width={48} height={48} className="animate-pulse" /></div>}
                                        {!isSubmitting && (
                                            <div className="absolute bottom-2 right-2 flex gap-2 z-10">
                                                <button type="button" onClick={(e) => {e.stopPropagation(); handleFileSelect(index);}} className="h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"><Pencil className="w-4 h-4" /></button>
                                                {uploadedImageCount > 1 && <button type="button" onClick={(e) => handleDeleteImage(e, index)} className="h-8 w-8 rounded-full bg-red-600/80 text-white flex items-center justify-center hover:bg-red-600"><Trash2 className="w-4 h-4" /></button>}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center text-muted-foreground p-2 flex flex-col items-center justify-center gap-2">
                                        <div className='h-12 w-12 rounded-full flex items-center justify-center bg-primary/20 text-primary'>
                                            <Plus className="w-8 h-8" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </main>
        </div>
    );
}
