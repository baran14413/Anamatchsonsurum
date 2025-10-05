
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Undo, X, Star, Heart, Zap } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { AnimatePresence } from 'framer-motion';
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
      const interactionsQuery1 = query(collection(firestore, 'matches'), where('user1Id', '==', user.uid));
      const interactionsQuery2 = query(collection(firestore, 'matches'), where('user2Id', '==', user.uid));
      
      const [interactionsSnapshot1, interactionsSnapshot2] = await Promise.all([
        getDocs(interactionsQuery1),
        getDocs(interactionsQuery2)
      ]);

      const interactedUserIds = new Set<string>();
      interactedUserIds.add(user.uid); // Add self to avoid showing own profile

      interactionsSnapshot1.forEach(doc => {
          interactedUserIds.add(doc.data().user2Id);
      });
      interactionsSnapshot2.forEach(doc => {
          interactedUserIds.add(doc.data().user1Id);
      });

      // 2. Fetch all users from the 'users' collection.
      const allUsersSnapshot = await getDocs(collection(firestore, 'users'));

      // 3. Filter out the current user and users who have been interacted with.
      const potentialMatches: UserProfile[] = [];
      allUsersSnapshot.forEach(doc => {
          const userData = doc.data();
          if (userData.uid && !interactedUserIds.has(userData.uid)) {
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
      // Record the current user's action
      await setDoc(interactionRef, {
        [user.uid]: action,
        user1Id: [user.uid, swipedProfileId].sort()[0],
        user2Id: [user.uid, swipedProfileId].sort()[1],
        timestamp: serverTimestamp(),
      }, { merge: true });

      if (action === 'liked') {
        // Check if the other user has also liked
        const interactionDoc = await getDoc(interactionRef);
        const interactionData = interactionDoc.data();

        if (interactionData && interactionData[swipedProfileId] === 'liked') {
          // It's a match!
          await setDoc(interactionRef, { status: 'matched', matchDate: serverTimestamp() }, { merge: true });
          
          // Add match to both users' subcollections for easy retrieval
          const user1MatchRef = doc(firestore, `users/${user.uid}/matches`, swipedProfileId);
          const user2MatchRef = doc(firestore, `users/${swipedProfileId}/matches`, user.uid);
          
          const matchData = {
            id: swipedProfileId,
            matchDate: serverTimestamp()
          };
          
          await setDoc(user1MatchRef, matchData);
          await setDoc(user2MatchRef, { ...matchData, id: user.uid });
          
          toast({
            title: t.anasayfa.matchToastTitle,
            description: t.anasayfa.matchToastDescription,
          });
        }
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
        <>
          <div className="flex-1 relative flex items-center justify-center">
            <AnimatePresence>
              {activeProfile ? (
                 <ProfileCard
                    key={activeProfile.uid}
                    profile={activeProfile}
                    onSwipe={handleSwipe}
                  />
              ) : (
                <div className="text-center">
                  <h2 className="text-2xl font-bold">{t.anasayfa.outOfProfilesTitle}</h2>
                  <p className="text-muted-foreground mt-2">{t.anasayfa.outOfProfilesDescription}</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center items-center gap-4 p-4 z-10">
            <button className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-transform transform hover:scale-110">
              <Undo size={28} />
            </button>
            <button 
              onClick={() => handleSwipe('left')}
              className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center text-red-500 hover:bg-red-50 transition-transform transform hover:scale-110">
              <X size={40} strokeWidth={2.5} />
            </button>
            <button className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-400 hover:bg-blue-50 transition-transform transform hover:scale-110">
              <Star size={28} className="fill-current" />
            </button>
            <button 
              onClick={() => handleSwipe('right')}
              className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center text-green-500 hover:bg-green-50 transition-transform transform hover:scale-110">
              <Heart size={40} className="fill-current" />
            </button>
            <button className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-purple-500 hover:bg-purple-50 transition-transform transform hover:scale-110">
              <Zap size={28} className="fill-current" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
