
"use client";

import { useState, useEffect, useMemo } from "react";
import ProfileCard from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import type { UserProfile as UserProfileType } from "@/lib/types";
import { Heart, X, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, doc, writeBatch, serverTimestamp, getDocs, query } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";

type SwipeAction = 'like' | 'nope';

export default function AnasayfaPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  // Fetches all users. In a real-world secure app, this would be a Cloud Function.
  // We accept the security risk of fetching all users for this project's scope.
  const usersCollectionRef = useMemoFirebase(() => 
    firestore ? collection(firestore, "users") : null, 
    [firestore]
  );
  const { data: allUsers, isLoading: areUsersLoading } = useCollection<UserProfileType>(usersCollectionRef);

  const [profiles, setProfiles] = useState<UserProfileType[]>([]);
  const [swipedProfileIds, setSwipedProfileIds] = useState<Set<string>>(new Set());
  const [isFetchingInteractions, setIsFetchingInteractions] = useState(true);

  // Fetch profiles the current user has already interacted with
  useEffect(() => {
    async function fetchInteractions() {
      if (!currentUser || !firestore) return;

      setIsFetchingInteractions(true);
      const interactionsCollectionRef = collection(firestore, `users/${currentUser.uid}/interactions`);
      try {
        const interactionsSnapshot = await getDocs(interactionsCollectionRef);
        const interactedIds = new Set(interactionsSnapshot.docs.map(doc => doc.id));
        setSwipedProfileIds(interactedIds);
      } catch (error) {
        console.error("Failed to fetch interactions:", error);
        // In a real app, you might want to show a toast here.
      } finally {
        setIsFetchingInteractions(false);
      }
    }
    fetchInteractions();
  }, [currentUser, firestore]);

  // Filter profiles once all data is loaded
  useEffect(() => {
    if (!areUsersLoading && !isFetchingInteractions && allUsers && currentUser) {
      const filteredProfiles = allUsers.filter(p => 
        p.id !== currentUser.uid && !swipedProfileIds.has(p.id)
      );
      setProfiles(filteredProfiles);
    }
  }, [allUsers, areUsersLoading, isFetchingInteractions, currentUser, swipedProfileIds]);

  const handleSwipe = async (profile: UserProfileType, direction: 'left' | 'right') => {
    if (!currentUser || !firestore) return;

    const action: SwipeAction = direction === 'right' ? 'like' : 'nope';

    // Optimistically update UI
    setProfiles(prev => prev.filter(p => p.id !== profile.id));
    setSwipedProfileIds(prev => new Set(prev).add(profile.id));

    // Perform Firestore write
    const batch = writeBatch(firestore);
    
    // Add to current user's interactions subcollection
    const currentUserInteractionRef = doc(firestore, `users/${currentUser.uid}/interactions`, profile.id);
    batch.set(currentUserInteractionRef, { action, timestamp: serverTimestamp() });

    if (action === 'like') {
      // In a real app, you would check if the other user has also liked the current user.
      // For this project, we'll create a match directly for simplicity.
      const matchId = [currentUser.uid, profile.id].sort().join('_');
      
      const matchDocForCurrentUser = doc(firestore, `users/${currentUser.uid}/matches`, matchId);
      batch.set(matchDocForCurrentUser, {
        id: matchId,
        user1Id: currentUser.uid,
        user2Id: profile.id,
        matchDate: serverTimestamp(),
      });
      
      const matchDocForOtherUser = doc(firestore, `users/${profile.id}/matches`, matchId);
      batch.set(matchDocForOtherUser, {
        id: matchId,
        user1Id: currentUser.uid,
        user2Id: profile.id,
        matchDate: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
    } catch (error) {
      console.error("Failed to save swipe action:", error);
      // Optional: Revert optimistic UI update on failure
      setProfiles(prev => [profile, ...prev]);
      setSwipedProfileIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(profile.id);
          return newSet;
      });
      // Here you might want to use a toast to inform the user
    }
  };

  const activeProfile = profiles.length > 0 ? profiles[profiles.length - 1] : null;

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (activeProfile) {
      handleSwipe(activeProfile, direction);
    }
  };

  const isLoading = areUsersLoading || isFetchingInteractions;

  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/20 dark:bg-black overflow-hidden">
      <div className="relative flex-1 flex flex-col items-center justify-center pb-16">
        <div className="relative w-full h-full max-w-md">
          <AnimatePresence>
            {activeProfile ? (
              profiles.map((profile, index) => {
                const isTopCard = index === profiles.length - 1;
                return (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    onSwipe={(dir) => handleSwipe(profile, dir)}
                    isTopCard={isTopCard}
                  />
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground px-8">
                <Heart className="h-16 w-16 mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold text-foreground">Herkes Tükendi!</h2>
                <p>Çevrendeki tüm profilleri gördün. Daha sonra tekrar kontrol et.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {activeProfile && (
        <div className="absolute bottom-6 left-0 right-0 z-20 flex w-full items-center justify-center gap-x-4 py-4 shrink-0">
          <Button onClick={() => triggerSwipe('left')} variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white text-rose-500 shadow-xl hover:bg-gray-100 transform transition-transform hover:scale-110">
            <X className="h-8 w-8" />
          </Button>
          <Button onClick={() => triggerSwipe('right')} variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white text-teal-400 shadow-xl hover:bg-gray-100 transform transition-transform hover:scale-110">
            <Heart className="h-8 w-8 fill-current" />
          </Button>
        </div>
      )}
    </div>
  );
}
