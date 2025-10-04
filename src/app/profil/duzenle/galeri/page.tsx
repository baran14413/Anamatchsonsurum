
'use client';

import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { Loader2, Images, Upload, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { langTr } from '@/languages/tr';

export default function GaleriPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  const t = langTr.ayarlarGaleri;
  const commonT = langTr.common;

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading, error } = useDoc(userProfileRef);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentImageCount = userProfile?.images?.length || 0;
    const maxUploadCount = 9 - currentImageCount;

    if (files.length > maxUploadCount) {
      toast({
        title: t.toasts.limitExceededTitle,
        description: t.toasts.limitExceededDesc.replace('{count}', String(currentImageCount)).replace('{maxUploadCount}', String(maxUploadCount)),
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`'${file.name}' yüklenemedi`);
        }
        return response.json();
      });

      const results = await Promise.all(uploadPromises);
      const newUrls = results.map(result => result.url);

      if (userProfileRef && newUrls.length > 0) {
        await updateDoc(userProfileRef, {
          images: arrayUnion(...newUrls)
        });
        toast({
          title: t.toasts.uploadSuccessTitle,
          description: t.toasts.uploadSuccessDesc.replace('{count}', String(newUrls.length)),
        });
      }
    } catch (error: any) {
      toast({
        title: t.toasts.uploadFailedTitle,
        description: error.message || t.toasts.uploadFailedDesc,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete || !userProfileRef) return;
    
    if(userProfile?.images?.length <= 1) {
       toast({
        title: t.toasts.deleteFailedMinRequiredTitle,
        description: t.toasts.deleteFailedMinRequiredDesc,
        variant: "destructive"
       });
       setImageToDelete(null);
       return;
    }

    try {
      await updateDoc(userProfileRef, {
        images: arrayRemove(imageToDelete)
      });
      toast({
        title: t.toasts.deleteSuccessTitle,
        description: t.toasts.deleteSuccessDesc,
      });
    } catch (error) {
       toast({
        title: t.toasts.deleteErrorTitle,
        description: t.toasts.deleteErrorDesc,
        variant: "destructive"
      });
    } finally {
      setImageToDelete(null);
    }
  };

  const images = userProfile?.images || [];
  const imageCount = images.length;

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AlertDialog>
      <div className="p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Images className="h-6 w-6 text-primary" />
              {t.title}
            </CardTitle>
            <CardDescription>
              {t.description.replace('{count}', String(imageCount))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((url, index) => (
                <div key={index} className="relative group aspect-square">
                  <Image
                    src={url}
                    alt={`Galeri fotoğrafı ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="rounded-lg object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <AlertDialogTrigger asChild>
                      <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setImageToDelete(url)}
                          className="h-10 w-10 rounded-full"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                    </AlertDialogTrigger>
                  </div>
                </div>
              ))}
              {imageCount < 9 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8" />
                      <span className="mt-2 text-sm font-medium">{t.upload}</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/gif"
              multiple
            />
          </CardContent>
        </Card>
        
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setImageToDelete(null)}>{commonT.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteImage} className="bg-destructive hover:bg-destructive/90">
              {commonT.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </div>
    </AlertDialog>
  );
}

    