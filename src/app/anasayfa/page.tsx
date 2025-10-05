'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RotateCcw, X, Heart } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';
import { Button } from '@/components/ui/button';

export default function AnasayfaPage() {
  const t = langTr;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchProfiles = useCallback(async () => {
    if (!user || !firestore) return;
    setIsLoading(true);
    try {
      const usersQuery = query(collection(firestore, 'users'));
      const querySnapshot = await getDocs(usersQuery);
      const allUsers = querySnapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as UserProfile))
        .filter(p => p.uid !== user.uid && p.images && p.images.length > 0);
      
      setProfiles(allUsers);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({
          title: t.common.error,
          description: "Potansiyel eşleşmeler getirilemedi.",
          variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore, toast, t.common.error]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleAction = (action: 'liked' | 'disliked') => {
    if (currentIndex >= profiles.length) return;

    const swipedProfile = profiles[currentIndex];
    recordInteraction(swipedProfile.uid, action);
    
    setCurrentIndex(prev => prev + 1);
  };
  
  const recordInteraction = async (swipedProfileId: string, action: 'liked' | 'disliked') => {
    // This function can be expanded later to save to Firestore
    console.log(`User ${user?.uid} ${action} profile ${swipedProfileId}`);
  };

  const handleReset = () => {
    fetchProfiles();
    setCurrentIndex(0);
    toast({
      title: t.anasayfa.resetToastTitle,
      description: t.anasayfa.resetToastDescription,
    });
  };
  
  const activeProfile = !isLoading && currentIndex < profiles.length ? profiles[currentIndex] : null;

  return (
    <div className="relative h-full w-full">
        {isLoading ? (
            <div className="flex h-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : activeProfile ? (
        <div className="flex flex-col h-full items-center justify-center p-4">
             <div className="w-full max-w-sm aspect-[9/16] relative">
                <ProfileCard
                    key={activeProfile.uid}
                    profile={activeProfile}
                />
             </div>
             <div className="flex items-center gap-4 mt-4">
                <Button onClick={() => handleAction('disliked')} variant="outline" size="icon" className="h-16 w-16 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-100">
                    <X className="h-8 w-8" />
                </Button>
                 <Button onClick={() => handleAction('liked')} variant="outline" size="icon" className="h-16 w-16 rounded-full border-2 border-green-500 text-green-500 hover:bg-green-100">
                    <Heart className="h-8 w-8" />
                </Button>
            </div>
        </div>
        ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <h2 className="text-2xl font-bold">{t.anasayfa.outOfProfilesTitle}</h2>
            <p className="text-muted-foreground mt-2">{t.anasayfa.outOfProfilesDescription}</p>
            <Button onClick={handleReset} className="mt-6 rounded-full" size="lg">
                <RotateCcw className="mr-2 h-5 w-5" />
                Yeniden Başla
            </Button>
            </div>
        )}
    </div>
  );
}
