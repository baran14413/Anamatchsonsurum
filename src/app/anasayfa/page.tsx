'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RotateCcw, X, Heart, Zap, Undo2, Star } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

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
      // Fetch all users except the current one.
      const usersQuery = query(collection(firestore, 'users'), where('uid', '!=', user.uid));
      const allUsersSnapshot = await getDocs(usersQuery);

      const potentialMatches: UserProfile[] = [];
      allUsersSnapshot.forEach(doc => {
          const userData = doc.data() as Partial<UserProfile>;
          if (userData.uid && userData.images && userData.images.length > 0) {
              potentialMatches.push({
                  id: doc.id,
                  ...userData,
                  images: userData.images || [],
              } as UserProfile);
          }
      });
      
      setProfiles(potentialMatches);

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
  
  const recordSwipe = async (swipedProfileId: string, action: 'liked' | 'disliked') => {
    if (!user || !firestore) return;

    const interactionId = [user.uid, swipedProfileId].sort().join('_');
    const interactionRef = doc(firestore, 'matches', interactionId);

    try {
        const interactionDoc = await getDoc(interactionRef);

        if (action === 'liked') {
            if (interactionDoc.exists() && (
                (interactionDoc.data().user2Id === user.uid && interactionDoc.data().status === 'liked') || 
                (interactionDoc.data().user1Id === user.uid && interactionDoc.data().status === 'liked')
            )) {
                await setDoc(interactionRef, { 
                    status: 'matched', 
                    matchDate: serverTimestamp() 
                }, { merge: true });

                const userMatchRef = doc(firestore, `users/${user.uid}/matches`, swipedProfileId);
                const otherUserMatchRef = doc(firestore, `users/${swipedProfileId}/matches`, user.uid);
                
                await setDoc(userMatchRef, { matchDate: serverTimestamp(), matchedUserId: swipedProfileId });
                await setDoc(otherUserMatchRef, { matchDate: serverTimestamp(), matchedUserId: user.uid });

                toast({
                    title: t.anasayfa.matchToastTitle,
                    description: t.anasayfa.matchToastDescription,
                });
            } else {
                 await setDoc(interactionRef, {
                    user1Id: user.uid,
                    user2Id: swipedProfileId,
                    status: 'liked',
                    timestamp: serverTimestamp(),
                }, { merge: true });
            }
        } else { // disliked
            await setDoc(interactionRef, {
                user1Id: user.uid,
                user2Id: swipedProfileId,
                status: 'disliked',
                timestamp: serverTimestamp(),
            }, { merge: true });
        }
    } catch (error) {
        console.error("Error recording swipe:", error);
        toast({
            title: "Hata",
            description: "İşlem kaydedilemedi.",
            variant: "destructive"
        });
    }
  };


  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    if (currentIndex >= profiles.length) return;

    const swipedProfile = profiles[currentIndex];
    
    if (direction === 'up') {
        // Handle Super Like logic here if needed
    } else {
        recordSwipe(swipedProfile.uid, direction === 'right' ? 'liked' : 'disliked');
    }
    
    setCurrentIndex(prev => prev + 1);
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
        <div className="absolute inset-0 p-4">
             <ProfileCard
                key={activeProfile.uid}
                profile={activeProfile}
                onSwipe={(dir) => handleSwipe(dir as 'left' | 'right')}
             />
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
