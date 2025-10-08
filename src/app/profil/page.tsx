
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { useAuth, useUser, useFirestore } from '@/firebase/provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Heart, Star, ShieldCheckIcon, GalleryHorizontal, ChevronRight, Gem, Plus, Trash2, Pencil, Images } from 'lucide-react';
import { langTr } from '@/languages/tr';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import CircularProgress from '@/components/circular-progress';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import type { UserImage } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

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

export default function ProfilePage() {
  const t = langTr;
  const { user, userProfile } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  // Gallery State
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(() => getInitialImageSlots(userProfile));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const matchesQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'matches'),
      where('status', '==', 'matched')
    );
  }, [user, firestore]);

  useEffect(() => {
    if (userProfile) {
        setImageSlots(getInitialImageSlots(userProfile));
    }
  }, [userProfile]);

  useEffect(() => {
    if (!matchesQuery) return;

    const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
        setMatchCount(snapshot.size);
    }, (error) => {
        console.error("Failed to fetch match count:", error);
    });

    return () => unsubscribe();
  }, [matchesQuery]);

  const handleLogout = async () => {
    if (!auth) return;
    setIsLoggingOut(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: t.ayarlar.toasts.logoutErrorTitle,
        description: t.ayarlar.toasts.logoutErrorDesc,
        variant: "destructive"
      });
      setIsLoggingOut(false);
    }
  };
  
  const calculateAge = (dateOfBirth: string | undefined | null): number | null => {
      if (!dateOfBirth) return null;
      const birthday = new Date(dateOfBirth);
      if (isNaN(birthday.getTime())) return null;
      const ageDifMs = Date.now() - birthday.getTime();
      const ageDate = new Date(ageDifMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
  };
    
  const calculateProfileCompletion = (): number => {
      if (!userProfile) return 0;
      let score = 0;
      const maxScore = 7;
      if (userProfile.fullName) score++;
      if (userProfile.dateOfBirth) score++;
      if (userProfile.gender) score++;
      if (userProfile.location) score++;
      if (userProfile.lookingFor) score++;
      if (userProfile.images && userProfile.images.length >= 2) score++;
      if (userProfile.interests && userProfile.interests.length > 0) score++;
      return Math.round((score / maxScore) * 100);
  }

  const age = calculateAge(userProfile?.dateOfBirth);
  const profileCompletionPercentage = calculateProfileCompletion();
  const superLikeBalance = userProfile?.superLikeBalance ?? 0;
  
  let isGoldMember = userProfile?.membershipType === 'gold';
  if (isGoldMember && userProfile?.goldMembershipExpiresAt) {
    const expiryDate = userProfile.goldMembershipExpiresAt.toDate();
    if (expiryDate < new Date()) {
      isGoldMember = false;
    }
  }

  // --- Gallery Functions ---
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
        if (targetIndex === -1) targetIndex = MAX_IMAGE_SLOTS - 1;
        newSlots[targetIndex] = { file, preview, isUploading: false, isNew: true, public_id: null };
        return newSlots;
    });
    if (e.target) e.target.value = '';
  };

  const handleDeleteImage = (e: React.MouseEvent, index: number) => {
      e.stopPropagation(); 
      if(isSubmitting) return;
      if (uploadedImageCount <= 1) {
        toast({ title: t.ayarlarGaleri.toasts.deleteFailedMinRequiredTitle, description: t.ayarlarGaleri.toasts.deleteFailedMinRequiredDesc, variant: "destructive" });
        return;
      }
      setImageSlots(prevSlots => {
          const newSlots = [...prevSlots];
          URL.revokeObjectURL(newSlots[index].preview!);
          newSlots[index] = { file: null, preview: null, public_id: null, isUploading: false, isNew: false };
          const updatedImages = newSlots.filter(s => s.preview);
          return getInitialImageSlots({images: updatedImages});
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
                    if (!response.ok) throw new Error((await response.json()).error || `File upload failed for ${file.name}`);
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
            title: t.ayarlarGaleri.toasts.saveSuccessTitle,
            description: t.ayarlarGaleri.toasts.saveSuccessDesc,
        });

    } catch (error: any) {
        console.error("Gallery save error:", error);
        toast({ title: t.ayarlarGaleri.toasts.saveErrorTitle, description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
        setImageSlots(prev => prev.map(s => ({ ...s, isUploading: false, isNew: false })));
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
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto max-w-2xl p-4 space-y-6">

        {/* Profile Header */}
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
              <AvatarImage src={userProfile?.profilePicture || user?.photoURL || ''} alt={userProfile?.fullName || 'User'} />
              <AvatarFallback>{userProfile?.fullName?.charAt(0)}</AvatarFallback>
            </Avatar>
             <div className="absolute -bottom-1 -right-1">
                 <CircularProgress progress={profileCompletionPercentage} size={44} />
             </div>
          </div>
          
          <div className="text-center space-y-1">
             <h1 className="text-2xl font-bold flex items-center gap-2">
                {userProfile?.fullName || t.profil.user}{age && `, ${age}`}
                {isGoldMember ? <Icons.beGold width={24} height={24} /> : <ShieldCheckIcon className="h-6 w-6 text-blue-500" />}
            </h1>
            {isGoldMember && <p className="font-semibold text-yellow-500">Gold Üye</p>}
          </div>
        </div>

        {/* Gold Card */}
        {!isGoldMember && (
          <Card className='shadow-md bg-gradient-to-r from-red-500 to-yellow-400 text-white'>
              <CardContent className='p-4 flex items-center gap-4'>
                  <Icons.beGold width={48} height={48} />
                  <div className='flex-1'>
                      <h2 className='font-bold'>BeMatch Gold'a eriş</h2>
                      <p className='text-sm text-white/90'>Eşsiz özellikleri kazan!</p>
                  </div>
                  <Link href="/market">
                    <Button variant='secondary' size='sm' className='rounded-full bg-white text-black hover:bg-gray-200'>
                        {t.profil.upgrade}
                    </Button>
                  </Link>
              </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-center text-sm">
           <Card className="p-3 shadow-md">
              <Heart className="h-6 w-6 text-red-500 mx-auto mb-1 fill-red-500" />
              <p className="font-semibold">Toplam {matchCount} Eşleşme</p>
              <span className="text-xs text-muted-foreground">yakaladınız</span>
          </Card>
           <Card className="p-3 shadow-md">
              <Star className="h-6 w-6 text-blue-400 mx-auto mb-1 fill-blue-400" />
              <p className="font-semibold">Toplam {superLikeBalance} Super Like</p>
               <Link href="/market">
                <span className="text-xs text-blue-500 font-bold cursor-pointer">{t.profil.getMore}</span>
              </Link>
          </Card>
        </div>

        {/* Gallery Edit Section */}
        <div className="space-y-6 pt-6">
            <div>
                 <h2 className="text-xl font-bold flex items-center gap-2 mb-2"><Images className="w-5 h-5"/> Fotoğraflar</h2>
                <p className="text-muted-foreground text-sm mb-4">{t.ayarlarGaleri.description.replace('{count}', uploadedImageCount.toString()).replace('6', MAX_IMAGE_SLOTS.toString())}</p>
                 <div className="space-y-2 mb-4">
                    <Progress value={(uploadedImageCount / MAX_IMAGE_SLOTS) * 100} className="h-2" />
                    <p className="text-sm font-medium text-muted-foreground text-right">{uploadedImageCount} / {MAX_IMAGE_SLOTS}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {imageSlots.map((slot, index) => getSlotComponent(slot, index))}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
            <Button onClick={handleSaveChanges} disabled={isSubmitting || uploadedImageCount < 1} className="w-full">
              {isSubmitting ? <Icons.logo width={24} height={24} className="animate-pulse" /> : "Galeriyi Kaydet"}
            </Button>
        </div>


        {/* Logout */}
        <div className="pt-8">
           <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full text-muted-foreground font-bold">
                        {t.profil.logout}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t.common.logoutConfirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t.common.logoutConfirmDescription}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
                        {isLoggingOut ? <Icons.logo width={16} height={16} className="h-4 w-4 animate-pulse" /> : t.common.logout}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
    </div>
  );
}
