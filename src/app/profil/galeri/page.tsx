
'use client';

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Pencil, Images, Video } from "lucide-react";
import { langTr } from "@/languages/tr";
import Image from "next/image";
import { Icons } from "@/components/icons";
import type { UserMedia } from "@/lib/types";
import { Progress } from "@/components/ui/progress";

type MediaSlot = {
    file: File | null;
    preview: string | null;
    public_id?: string | null;
    isUploading: boolean;
    isNew: boolean;
    type: 'image' | 'video';
};

const getInitialMediaSlots = (userProfile: any): MediaSlot[] => {
  const initialSlots: MediaSlot[] = Array.from({ length: 10 }, () => ({ file: null, preview: null, public_id: null, isUploading: false, isNew: false, type: 'image' }));
  if (userProfile?.media) {
    userProfile.media.forEach((media: UserMedia, index: number) => {
      if (index < 10) {
        initialSlots[index] = { file: null, preview: media.url, public_id: media.public_id, isUploading: false, isNew: false, type: media.type };
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

  const [mediaSlots, setMediaSlots] = useState<MediaSlot[]>(() => getInitialMediaSlots(userProfile));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  useEffect(() => {
    if (userProfile) {
        setMediaSlots(getInitialMediaSlots(userProfile));
    }
  }, [userProfile]);

  const uploadedMediaCount = useMemo(() => mediaSlots.filter(p => p.preview).length, [mediaSlots]);

  const handleFileSelect = (index: number) => {
      if(isSubmitting) return;
      const targetIndex = mediaSlots[index].preview ? index : uploadedMediaCount;
      setActiveSlot(targetIndex);
      fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeSlot !== null) {
      const file = e.target.files[0];
      const isVideo = file.type.startsWith('video/');
      const preview = URL.createObjectURL(file);

      if (isVideo) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          if (video.duration > 10) {
            toast({
              title: "Video Çok Uzun",
              description: "Lütfen 10 saniyeden kısa bir video seçin.",
              variant: "destructive"
            });
            URL.revokeObjectURL(preview); // Clean up the object URL
            return;
          }
          const newSlots = [...mediaSlots];
          newSlots[activeSlot] = { file, preview, isUploading: false, isNew: true, public_id: null, type: 'video' };
          setMediaSlots(newSlots);
        };
        video.src = preview;
      } else {
         const newSlots = [...mediaSlots];
         newSlots[activeSlot] = { file, preview, isUploading: false, isNew: true, public_id: null, type: 'image' };
         setMediaSlots(newSlots);
      }
    }
    setActiveSlot(null);
    if (e.target.value) e.target.value = ''; 
  };

  const handleDeleteMedia = async (e: React.MouseEvent, index: number) => {
      e.stopPropagation(); 
      if(isSubmitting) return;

      if (uploadedMediaCount <= 1) {
        toast({
            title: t.toasts.deleteFailedMinRequiredTitle,
            description: t.toasts.deleteFailedMinRequiredDesc,
            variant: "destructive"
        });
        return;
      }
      
      const newSlots = [...mediaSlots];
      const deletedSlot = newSlots[index];
      
      if (deletedSlot.file && deletedSlot.preview) URL.revokeObjectURL(deletedSlot.preview);
      newSlots.splice(index, 1);
      newSlots.push({ file: null, preview: null, public_id: null, isUploading: false, isNew: false, type: 'image' });
      
      setMediaSlots(newSlots);
  };

  const handleSaveChanges = async () => {
    if (!firestore || !user) return;
    setIsSubmitting(true);
    
    try {
        const newFilesToUpload = mediaSlots.filter(p => p.isNew && p.file);
        
        setMediaSlots(prev => prev.map(slot => newFilesToUpload.some(f => f.file === slot.file) ? { ...slot, isUploading: true } : slot));

        const uploadPromises = newFilesToUpload.map(slot => {
            const file = slot.file!;
            const formData = new FormData();
            formData.append('file', file);
            
            return fetch('/api/upload', { method: 'POST', body: formData })
                .then(response => {
                    if (!response.ok) throw new Error(`File upload failed for ${file.name}`);
                    return response.json();
                })
                .then(result => ({ originalFile: file, url: result.url, public_id: result.public_id, type: slot.type }));
        });

        const uploadResults = await Promise.all(uploadPromises);

        const finalOrderedMedia: UserMedia[] = [];
        for (const slot of mediaSlots) {
            if (slot.isNew && slot.file) {
                 const uploaded = uploadResults.find(r => r.originalFile === slot.file);
                 if (uploaded) finalOrderedMedia.push({ url: uploaded.url, public_id: uploaded.public_id, type: uploaded.type });
            } else if (slot.preview && slot.public_id) {
                 finalOrderedMedia.push({ url: slot.preview, public_id: slot.public_id, type: slot.type });
            }
        }
        
        finalOrderedMedia.sort((a, b) => (a.type === 'video' ? -1 : 1) - (b.type === 'video' ? -1 : 1));

        await updateDoc(doc(firestore, "users", user.uid), {
            media: finalOrderedMedia,
            profilePicture: finalOrderedMedia.length > 0 ? finalOrderedMedia[0].url : '',
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
        setMediaSlots(prev => prev.map(s => ({ ...s, isUploading: false })));
    }
  };

  const imageSlots = mediaSlots.slice(0, 6);
  const videoSlots = mediaSlots.slice(6, 10);

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} disabled={isSubmitting}>
            <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">{t.title}</h1>
        <Button onClick={handleSaveChanges} disabled={isSubmitting || uploadedMediaCount < 1}>
          {isSubmitting ? <Icons.logo width={24} height={24} className="animate-pulse" /> : langTr.common.save}
        </Button>
      </header>
      
      <main className="flex-1 flex flex-col p-6 overflow-y-auto">
        <div className="shrink-0 space-y-4">
            <div className="flex items-center gap-3">
                <Images className="w-8 h-8 text-primary shrink-0" />
                <p className="text-muted-foreground text-sm">Profilinde gösterilecek medya içeriklerini buradan yönetebilirsin.</p>
            </div>
             <div className="space-y-2">
                <Progress value={(uploadedMediaCount / 10) * 100} className="h-2" />
                <p className="text-sm font-medium text-muted-foreground text-right">{uploadedMediaCount} / 10</p>
            </div>
        </div>
        <div className="space-y-6 pt-6">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-2"><Images className="w-5 h-5"/> Fotoğraflar (6)</h2>
                <div className="grid grid-cols-3 gap-4">
                    {imageSlots.map((slot, index) => (
                        <div key={index} className="relative aspect-square">
                            <div onClick={() => handleFileSelect(index)} className="cursor-pointer w-full h-full border-2 border-dashed bg-card rounded-lg flex items-center justify-center relative overflow-hidden transition-colors hover:bg-muted">
                                {slot.preview ? (
                                    <>
                                        <Image src={slot.preview} alt={`Preview ${index}`} fill style={{ objectFit: "cover" }} className="rounded-lg" />
                                        {slot.isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Icons.logo width={48} height={48} className="animate-pulse" /></div>}
                                        {!isSubmitting && (
                                            <div className="absolute bottom-2 right-2 flex gap-2">
                                                <button type="button" onClick={(e) => {e.stopPropagation(); handleFileSelect(index);}} className="h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"><Pencil className="w-4 h-4" /></button>
                                                {uploadedMediaCount > 1 && <button type="button" onClick={(e) => handleDeleteMedia(e, index)} className="h-8 w-8 rounded-full bg-red-600/80 text-white flex items-center justify-center hover:bg-red-600"><Trash2 className="w-4 h-4" /></button>}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center text-muted-foreground p-2 flex flex-col items-center justify-center gap-2">
                                        <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center"><Plus className="w-6 h-6" /></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-2"><Video className="w-5 h-5"/> Videolar (4)</h2>
                 <p className="text-sm text-muted-foreground mb-4">Videolar maksimum 10 saniye uzunluğunda olabilir.</p>
                <div className="grid grid-cols-3 gap-4">
                    {videoSlots.map((slot, index) => {
                        const actualIndex = index + 6;
                        return (
                        <div key={actualIndex} className="relative aspect-square">
                            <div onClick={() => handleFileSelect(actualIndex)} className="cursor-pointer w-full h-full border-2 border-dashed bg-card rounded-lg flex items-center justify-center relative overflow-hidden transition-colors hover:bg-muted">
                                {slot.preview ? (
                                    <>
                                        <video src={slot.preview} className="w-full h-full object-cover rounded-lg" loop muted />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                            <Video className="w-8 h-8 text-white/80" />
                                        </div>
                                        {slot.isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Icons.logo width={48} height={48} className="animate-pulse" /></div>}
                                        {!isSubmitting && (
                                            <div className="absolute bottom-2 right-2 flex gap-2">
                                                <button type="button" onClick={(e) => {e.stopPropagation(); handleFileSelect(actualIndex);}} className="h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"><Pencil className="w-4 h-4" /></button>
                                                {uploadedMediaCount > 1 && <button type="button" onClick={(e) => handleDeleteMedia(e, actualIndex)} className="h-8 w-8 rounded-full bg-red-600/80 text-white flex items-center justify-center hover:bg-red-600"><Trash2 className="w-4 h-4" /></button>}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center text-muted-foreground p-2 flex flex-col items-center justify-center gap-2">
                                        <div className="h-10 w-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center"><Plus className="w-6 h-6" /></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
      </main>
    </div>
  );
}
