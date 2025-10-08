
'use client';

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Pencil, Images } from "lucide-react";
import { langTr } from "@/languages/tr";
import Image from "next/image";
import { Icons } from "@/components/icons";
import type { UserImage } from "@/lib/types";
import { Progress } from "@/components/ui/progress";

type ImageSlot = {
    file: File | null;
    preview: string | null;
    public_id?: string | null;
    isUploading: boolean;
    isNew: boolean;
};

const MAX_IMAGE_SLOTS = 6;

const getInitialImageSlots = (userProfile: any): ImageSlot[] => {
    const slots: ImageSlot[] = Array.from({ length: MAX_IMAGE_SLOTS }, () => ({ file: null, preview: null, public_id: null, isUploading: false, isNew: false }));

    if (userProfile?.images) {
        userProfile.images.forEach((img: UserImage, index: number) => {
            if (index < MAX_IMAGE_SLOTS) {
                slots[index] = {
                    file: null,
                    preview: img.url,
                    public_id: img.public_id,
                    isUploading: false,
                    isNew: false
                };
            }
        });
    }

    return slots;
};


export default function GalleryEditPage() {
  const router = useRouter();
  const { toast } = useToast();
  const t = langTr.ayarlarGaleri;
  const { user, userProfile } = useUser();
  const firestore = useFirestore();

  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(() => getInitialImageSlots(userProfile));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (userProfile) {
        setImageSlots(getInitialImageSlots(userProfile));
    }
  }, [userProfile]);

  const uploadedImageCount = imageSlots.filter(p => p.preview).length;

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

    const preview = URL.createObjectURL(file);
    setImageSlots(prevSlots => {
        const newSlots = [...prevSlots];
        let targetIndex = newSlots.findIndex(slot => !slot.preview);
        if (targetIndex === -1) targetIndex = MAX_IMAGE_SLOTS -1; // Should not happen if button is disabled

        newSlots[targetIndex] = { file, preview, isUploading: false, isNew: true, public_id: null };
        return newSlots;
    });

    if (e.target) e.target.value = '';
  };


  const handleDeleteImage = (e: React.MouseEvent, index: number) => {
      e.stopPropagation(); 
      if(isSubmitting) return;

      if (uploadedImageCount <= 1) {
        toast({ title: t.toasts.deleteFailedMinRequiredTitle, description: t.toasts.deleteFailedMinRequiredDesc, variant: "destructive" });
        return;
      }
      
      const slotToDelete = imageSlots[index];

      setImageSlots(prevSlots => {
          const newSlots = [...prevSlots];
          if (slotToDelete.file && slotToDelete.preview) URL.revokeObjectURL(slotToDelete.preview);
          
          newSlots[index] = { file: null, preview: null, public_id: null, isUploading: false, isNew: false };

          // Re-organize slots
          const updatedImages = newSlots.filter(s => s.preview);
          const finalSlots = getInitialImageSlots({images: updatedImages});
          return finalSlots;
      });
  };

  const handleSaveChanges = async () => {
    if (!firestore || !user) return;
    setIsSubmitting(true);
    
    try {
        const newFilesToUpload = imageSlots.filter(p => p.isNew && p.file);
        
        setImageSlots(prev => prev.map(slot => newFilesToUpload.some(f => f.file === slot.file) ? { ...slot, isUploading: true } : slot));

        const uploadPromises = newFilesToUpload.map(slot => {
            const file = slot.file!;
            const formData = new FormData();
            formData.append('file', file);
            
            return fetch('/api/upload', { method: 'POST', body: formData })
                .then(async response => {
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `File upload failed for ${file.name}`);
                    }
                    return response.json();
                })
                .then(result => ({ originalFile: file, url: result.url, public_id: result.public_id }));
        });

        const uploadResults = await Promise.all(uploadPromises);

        let finalOrderedImages: UserImage[] = [];
        for (const slot of imageSlots) {
            if (slot.isNew && slot.file) {
                 const uploaded = uploadResults.find(r => r.originalFile === slot.file);
                 if (uploaded) finalOrderedImages.push({ url: uploaded.url, public_id: uploaded.public_id });
            } else if (slot.preview && slot.public_id) {
                 finalOrderedImages.push({ url: slot.preview, public_id: slot.public_id });
            }
        }
        
        await updateDoc(doc(firestore, "users", user.uid), {
            images: finalOrderedImages,
            profilePicture: finalOrderedImages.length > 0 ? finalOrderedImages[0].url : '',
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
        setImageSlots(prev => prev.map(s => ({ ...s, isUploading: false })));
    }
  };

  const getSlotComponent = (slot: ImageSlot, index: number) => (
     <div key={index} className="relative aspect-square">
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
                    <div className='h-10 w-10 rounded-full flex items-center justify-center bg-primary/20 text-primary'>
                        <Plus className="w-6 h-6" />
                    </div>
                </div>
            )}
        </div>
    </div>
  );

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
      
      <main className="flex-1 flex flex-col p-6 overflow-y-auto">
        <div className="shrink-0 space-y-4">
            <div className="flex items-center gap-3">
                <Images className="w-8 h-8 text-primary shrink-0" />
                <p className="text-muted-foreground text-sm">{t.description.replace('{count}', uploadedImageCount.toString()).replace('6', MAX_IMAGE_SLOTS.toString())}</p>
            </div>
             <div className="space-y-2">
                <Progress value={(uploadedImageCount / MAX_IMAGE_SLOTS) * 100} className="h-2" />
                <p className="text-sm font-medium text-muted-foreground text-right">{uploadedImageCount} / {MAX_IMAGE_SLOTS}</p>
            </div>
        </div>
        <div className="space-y-6 pt-6">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-2"><Images className="w-5 h-5"/> Fotoğraflar ({MAX_IMAGE_SLOTS})</h2>
                <div className="grid grid-cols-3 gap-4">
                    {imageSlots.map((slot, index) => getSlotComponent(slot, index))}
                </div>
            </div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      </main>
    </div>
  );
}
