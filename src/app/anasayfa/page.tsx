
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
      // 1. Get IDs of users the current user has already interacted with.
      const interactionsQuery = query(
        collection(firestore, 'matches'), 
        where('user1Id', '==', user.uid)
      );
      const interactionsSnapshot = await getDocs(interactionsQuery);

      const interactedUserIds = new Set<string>();
      interactedUserIds.add(user.uid); // Add self to avoid showing own profile

      interactionsSnapshot.forEach(doc => {
          interactedUserIds.add(doc.data().user2Id);
      });
      
      // Also check where the current user is user2
      const interactionsQuery2 = query(
        collection(firestore, 'matches'),
        where('user2Id', '==', user.uid)
      );
      const interactionsSnapshot2 = await getDocs(interactionsQuery2);
       interactionsSnapshot2.forEach(doc => {
          interactedUserIds.add(doc.data().user1Id);
      });

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

    // Use a consistent ID format by sorting UIDs
    const interactionId = [user.uid, swipedProfileId].sort().join('_');
    const interactionRef = doc(firestore, 'matches', interactionId);

    try {
        const interactionDoc = await getDoc(interactionRef);

        if (action === 'liked') {
            if (interactionDoc.exists() && interactionDoc.data().user2Id === user.uid) {
                // The other user (user1) liked us (user2). It's a match!
                await setDoc(interactionRef, { 
                    status: 'matched', 
                    matchDate: serverTimestamp() 
                }, { merge: true });

                // Add match to both users' subcollections
                const user1MatchRef = doc(firestore, `users/${user.uid}/matches`, swipedProfileId);
                const user2MatchRef = doc(firestore, `users/${swipedProfileId}/matches`, user.uid);
                const matchData = { matchDate: serverTimestamp() };
                await setDoc(user1MatchRef, { ...matchData, matchedUserId: swipedProfileId });
                await setDoc(user2MatchRef, { ...matchData, matchedUserId: user.uid });

                toast({
                    title: t.anasayfa.matchToastTitle,
                    description: t.anasayfa.matchToastDescription,
                });
            } else {
                // Other user hasn't interacted or we are user1, so just record our like
                 await setDoc(interactionRef, {
                    user1Id: user.uid,
                    user2Id: swipedProfileId,
                    status: 'liked',
                    timestamp: serverTimestamp(),
                }, { merge: true });
            }
        } else { // disliked
            // Just record the dislike action
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
    
    // Move to the next card
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
    <div className="flex-1 flex flex-col bg-gray-100 dark:bg-black overflow-hidden">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="relative h-full w-full p-4">
              {activeProfile ? (
                 <div className="absolute inset-0 p-4">
                    <ProfileCard
                        key={activeProfile.uid}
                        profile={activeProfile}
                        onSwipe={handleSwipe}
                    />
                 </div>
              ) : (
                <div className="text-center self-center flex flex-col items-center justify-center h-full">
                  <h2 className="text-2xl font-bold">{t.anasayfa.outOfProfilesTitle}</h2>
                  <p className="text-muted-foreground mt-2">{t.anasayfa.outOfProfilesDescription}</p>
                   <button onClick={handleReset} className="mt-4 p-2 bg-blue-500 text-white rounded-full">Yeniden Başla</button>
                </div>
              )}
        </div>
      )}
    </div>
  );
}
