'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';

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
      // 1. Get all interactions for the current user to find out who they've seen.
      const interactionsAsUser1Query = query(collection(firestore, 'matches'), where('user1Id', '==', user.uid));
      const interactionsAsUser2Query = query(collection(firestore, 'matches'), where('user2Id', '==', user.uid));

      const [interactionsAsUser1Snap, interactionsAsUser2Snap] = await Promise.all([
        getDocs(interactionsAsUser1Query),
        getDocs(interactionsAsUser2Query),
      ]);

      const interactedUserIds = new Set<string>();
      interactedUserIds.add(user.uid); // Add self to avoid showing own profile

      interactionsAsUser1Snap.forEach(doc => interactedUserIds.add(doc.data().user2Id));
      interactionsAsUser2Snap.forEach(doc => interactedUserIds.add(doc.data().user1Id));

      // 2. Fetch all users from the 'users' collection.
      const allUsersSnapshot = await getDocs(collection(firestore, 'users'));

      // 3. Filter out the current user and users who have been interacted with.
      const potentialMatches: UserProfile[] = [];
      allUsersSnapshot.forEach(doc => {
          const userData = doc.data() as Partial<UserProfile>;
          // Ensure the doc is a valid profile and not an interacted one
          if (userData.uid && !interactedUserIds.has(userData.uid) && userData.images && userData.images.length > 0) {
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


  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentIndex >= profiles.length) return;

    const swipedProfile = profiles[currentIndex];
    recordSwipe(swipedProfile.uid, direction === 'right' ? 'liked' : 'disliked');
    
    setCurrentIndex(prev => prev + 1);
  };
  
  const handleReset = () => {
    setCurrentIndex(0);
    fetchProfiles();
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
              onSwipe={handleSwipe}
          />
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold">{t.anasayfa.outOfProfilesTitle}</h2>
          <p className="text-muted-foreground mt-2">{t.anasayfa.outOfProfilesDescription}</p>
          <button onClick={handleReset} className="mt-4 p-2 bg-blue-500 text-white rounded-full">Yeniden Başla</button>
        </div>
      )}
    </div>
  );
}
