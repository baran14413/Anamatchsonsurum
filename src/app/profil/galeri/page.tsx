
'use client';

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Pencil, GalleryHorizontal } from "lucide-react";
import { langTr } from "@/languages/tr";
import Image from "next/image";
import { Icons } from "@/components/icons";
import type { UserImage } from "@/lib/types";

type PhotoSlot = {
    file: File | null;
    preview: string | null;
    public_id?: string | null;
    isUploading: boolean;
    isNew: boolean;
};

const getInitialPhotoSlots = (userProfile: any): PhotoSlot[] => {
  const initialSlots: PhotoSlot[] = Array.from({ length: 6 }, () => ({ file: null, preview: null, public_id: null, isUploading: false, isNew: false }));
  if (userProfile?.images) {
    userProfile.images.forEach((img: UserImage, index: number) => {
      if (index < 6) {
        initialSlots[index] = { file: null, preview: img.url, public_id: img.public_id, isUploading: false, isNew: false };
      }
    });
  }
  return initialSlots;
};

export default function GalleryEditPage() {
  const router = useRouter();
  const { toast } = useToast();
  const t = langTr.ayarlarGaleri;
  const { user, userProfile } = useUser();
  const firestore = useFirestore();

  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(() => getInitialPhotoSlots(userProfile));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  useEffect(() => {
    if (userProfile) {
        setPhotoSlots(getInitialPhotoSlots(userProfile));
    }
  }, [userProfile]);

  const uploadedPhotoCount = useMemo(() => photoSlots.filter(p => p.preview).length, [photoSlots]);

  const handleFileSelect = (index: number) => {
      if(isSubmitting) return;
      const targetIndex = photoSlots[index].preview ? index : uploadedPhotoCount;
      setActiveSlot(targetIndex);
      fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeSlot !== null) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      const newSlots = [...photoSlots];
      newSlots[activeSlot] = { file, preview, isUploading: false, isNew: true };
      setPhotoSlots(newSlots);
    }
    setActiveSlot(null);
    e.target.value = ''; 
  };

  const handleDeletePhoto = async (e: React.MouseEvent, index: number) => {
      e.stopPropagation(); 
      if(isSubmitting) return;

      if (uploadedPhotoCount <= 1) {
        toast({
            title: t.toasts.deleteFailedMinRequiredTitle,
            description: t.toasts.deleteFailedMinRequiredDesc,
            variant: "destructive"
        });
        return;
      }
      
      const newSlots = [...photoSlots];
      const deletedSlot = newSlots[index];

      // If it's a previously saved image, delete from Cloudinary
      if (deletedSlot.public_id) {
          try {
              await fetch('/api/delete-image', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ public_id: deletedSlot.public_id }),
              });
          } catch (error) {
              console.error("Failed to delete from cloudinary", error);
              // We can still proceed with removing it from the UI
          }
      }
      
      if (deletedSlot.file && deletedSlot.preview) URL.revokeObjectURL(deletedSlot.preview);
      newSlots.splice(index, 1);
      newSlots.push({ file: null, preview: null, isUploading: false, isNew: false });
      
      setPhotoSlots(newSlots);
  };

  const handleSaveChanges = async () => {
    if (!firestore || !user) return;

    setIsSubmitting(true);
    
    try {
        const newFilesToUpload = photoSlots.filter(p => p.isNew && p.file);
        
        setPhotoSlots(prev => prev.map(slot => newFilesToUpload.some(f => f.file === slot.file) ? { ...slot, isUploading: true } : slot));

        const uploadPromises = newFilesToUpload.map(slot => {
            const file = slot.file!;
            const formData = new FormData();
            formData.append('file', file);
            
            return fetch('/api/upload', { method: 'POST', body: formData })
                .then(response => {
                    if (!response.ok) throw new Error(`File upload failed for ${file.name}`);
                    return response.json();
                })
                .then(result => ({ originalFile: file, url: result.url, public_id: result.public_id }));
        });

        const uploadResults = await Promise.all(uploadPromises);

        let finalImages: UserImage[] = photoSlots
          .filter(p => p.preview && !p.isNew && p.public_id)
          .map(p => ({ url: p.preview!, public_id: p.public_id! }));

        uploadResults.forEach(result => {
           finalImages.push({ url: result.url, public_id: result.public_id });
        });

        // Reorder based on final slot positions
        const finalOrderedImages: UserImage[] = [];
        for (const slot of photoSlots) {
            if (slot.isNew && slot.file) {
                 const uploaded = uploadResults.find(r => r.originalFile === slot.file);
                 if (uploaded) finalOrderedImages.push({ url: uploaded.url, public_id: uploaded.public_id });
            } else if (slot.preview && slot.public_id) {
                 finalOrderedImages.push({ url: slot.preview, public_id: slot.public_id });
            }
        }


        await updateDoc(doc(firestore, "users", user.uid), {
            images: finalOrderedImages,
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
        setPhotoSlots(prev => prev.map(s => ({ ...s, isUploading: false })));
    }
  };


  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} disabled={isSubmitting}>
            <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">{t.title}</h1>
        <Button onClick={handleSaveChanges} disabled={isSubmitting || uploadedPhotoCount < 1}>
          {isSubmitting ? <Icons.logo width={24} height={24} className="animate-pulse" /> : langTr.common.save}
        </Button>
      </header>
      
      <main className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="shrink-0">
            <div className="flex items-center gap-4">
                <GalleryHorizontal className="w-8 h-8 text-primary" />
                <p className="text-muted-foreground flex-1">{t.description.replace('{count}', String(uploadedPhotoCount))}</p>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto -mr-6 pr-5 pt-6">
            <div className="grid grid-cols-3 gap-4">
                {photoSlots.map((slot, index) => (
                    <div key={index} className="relative aspect-square">
                        <div onClick={() => handleFileSelect(index)} className="cursor-pointer w-full h-full border-2 border-dashed bg-card rounded-lg flex items-center justify-center relative overflow-hidden transition-colors hover:bg-muted">
                            {slot.preview ? (
                                <>
                                    <Image src={slot.preview} alt={`Preview ${index}`} fill style={{ objectFit: "cover" }} className="rounded-lg" />
                                    {slot.isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Icons.logo width={48} height={48} className="animate-pulse" /></div>}
                                    {!isSubmitting && (
                                        <div className="absolute bottom-2 right-2 flex gap-2">
                                            <button type="button" onClick={(e) => {e.stopPropagation(); handleFileSelect(index);}} className="h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"><Pencil className="w-4 h-4" /></button>
                                            {uploadedPhotoCount > 1 && <button type="button" onClick={(e) => handleDeletePhoto(e, index)} className="h-8 w-8 rounded-full bg-red-600/80 text-white flex items-center justify-center hover:bg-red-600"><Trash2 className="w-4 h-4" /></button>}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center text-muted-foreground p-2 flex flex-col items-center justify-center gap-2">
                                    <span className="text-xs font-medium block">{t.upload}</span>
                                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Plus className="w-5 h-5" /></div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      </main>
    </div>
  );
}
