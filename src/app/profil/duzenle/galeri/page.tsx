
'use client';

import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { Loader2, Images, Upload, Trash2, X } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"


export default function GaleriPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading, mutate } = useDoc(userProfileRef);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if ((userProfile?.images?.length || 0) >= 9) {
      toast({
        title: "Galeri Dolu",
        description: "En fazla 9 fotoğraf ekleyebilirsiniz.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error((await response.json()).error || 'Yükleme başarısız');
      }

      const { url } = await response.json();

      if (userProfileRef) {
        await updateDoc(userProfileRef, {
          images: arrayUnion(url)
        });
        mutate();
        toast({
          title: "Fotoğraf Eklendi",
          description: "Yeni fotoğrafınız galerinize eklendi.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Yükleme Başarısız",
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete || !userProfileRef) return;
    
    // You need at least 1 photo in your gallery
    if(userProfile?.images?.length <= 1) {
       toast({
        title: "Silme Başarısız",
        description: "Galerinizde en az 1 fotoğraf bulunmalıdır.",
        variant: "destructive"
       });
       setImageToDelete(null);
       return;
    }


    try {
      await updateDoc(userProfileRef, {
        images: arrayRemove(imageToDelete)
      });
      mutate();
      toast({
        title: "Fotoğraf Silindi",
        description: "Fotoğraf galerinizden kaldırıldı."
      });
    } catch (error) {
       toast({
        title: "Silme Başarısız",
        description: "Fotoğraf silinirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setImageToDelete(null);
    }
  };

  const images = userProfile?.images || [];

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Images className="h-6 w-6 text-primary" />
            Galeri Yönetimi
          </CardTitle>
          <CardDescription>
            Eşleşme ekranında gösterilecek fotoğraflarını buradan yönetebilirsin. En az 1, en fazla 9 fotoğraf ekleyebilirsin.
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
            {images.length < 9 && (
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
                    <span className="mt-2 text-sm font-medium">Fotoğraf Yükle</span>
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
          />
        </CardContent>
      </Card>
      
      <AlertDialog open={!!imageToDelete} onOpenChange={(isOpen) => !isOpen && setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fotoğrafı Silmek İstiyor musun?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu fotoğraf galerinizden kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteImage} className="bg-destructive hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
