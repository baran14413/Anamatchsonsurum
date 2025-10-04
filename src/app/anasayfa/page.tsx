
"use client";

import { useState, useEffect } from "react";
import ProfileCard from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import type { UserProfile as UserProfileType } from "@/lib/types";
import { Heart, X, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, doc, writeBatch, serverTimestamp, getDocs, QuerySnapshot, DocumentData } from "firebase/firestore";

type SwipeAction = 'like' | 'nope';

export default function AnasayfaPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  const [allUsers, setAllUsers] = useState<UserProfileType[]>([]);
  const [profiles, setProfiles] = useState<UserProfileType[]>([]);
  const [swipedProfileIds, setSwipedProfileIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !firestore) return;

    setIsLoading(true);

    const usersCollectionRef = collection(firestore, "users");
    const interactionsCollectionRef = collection(firestore, `users/${currentUser.uid}/interactions`);

    Promise.all([
      getDocs(usersCollectionRef).catch(serverError => {
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: usersCollectionRef.path,
        });
        errorEmitter.emit('permission-error', contextualError);
        return { docs: [] } as QuerySnapshot<DocumentData>; // Return an empty snapshot on error
      }),
      getDocs(interactionsCollectionRef).catch(serverError => {
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: interactionsCollectionRef.path,
        });
        errorEmitter.emit('permission-error', contextualError);
        return { docs: [] } as QuerySnapshot<DocumentData>; // Return an empty snapshot on error
      }),
    ]).then(([usersSnapshot, interactionsSnapshot]) => {
      // 1. Process all users
      const allUsersData = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfileType));
      setAllUsers(allUsersData);

      // 2. Process interactions
      const interactedIds = new Set(interactionsSnapshot.docs.map(doc => doc.id));
      setSwipedProfileIds(interactedIds);
      
      // 3. Filter profiles
      const filteredProfiles = allUsersData.filter(p => 
        p.id !== currentUser.uid && !interactedIds.has(p.id)
      );
      setProfiles(filteredProfiles);

    }).catch(error => {
        // Errors are now emitted globally, so a console log here is for debug purposes only if needed.
        // The FirebaseErrorListener will handle displaying the error to the user.
    }).finally(() => {
      setIsLoading(false);
    });

  }, [currentUser, firestore]);

  const handleSwipe = async (profile: UserProfileType, direction: 'left' | 'right') => {
    if (!currentUser || !firestore) return;

    const action: SwipeAction = direction === 'right' ? 'like' : 'nope';

    // Optimistically update UI
    setProfiles(prev => prev.filter(p => p.id !== profile.id));
    setSwipedProfileIds(prev => new Set(prev).add(profile.id));

    const batch = writeBatch(firestore);
    
    // Record the interaction for the current user
    const currentUserInteractionRef = doc(firestore, `users/${currentUser.uid}/interactions`, profile.id);
    batch.set(currentUserInteractionRef, { action, timestamp: serverTimestamp() });

    if (action === 'like') {
      const matchId = [currentUser.uid, profile.id].sort().join('_');
      
      const matchDocForCurrentUser = doc(firestore, `users/${currentUser.uid}/matches`, matchId);
      batch.set(matchDocForCurrentUser, {
        id: matchId,
        user1Id: currentUser.uid,
        user2Id: profile.id,
        matchDate: serverTimestamp(),
        // Add a field to know who this match is with
        matchedWith: profile.id, 
      });
      
      const matchDocForOtherUser = doc(firestore, `users/${profile.id}/matches`, matchId);
      batch.set(matchDocForOtherUser, {
        id: matchId,
        user1Id: currentUser.uid,
        user2Id: profile.id,
        matchDate: serverTimestamp(),
        // Add a field to know who this match is with
        matchedWith: currentUser.uid,
      });
    }

    try {
      await batch.commit();
    } catch (error) {
      // Revert the optimistic UI update on failure
      setProfiles(prev => [profile, ...prev]);
      setSwipedProfileIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(profile.id);
          return newSet;
      });
      // Emit a contextual error for the failed write operation
      const contextualError = new FirestorePermissionError({
        operation: 'write', // 'write' covers set/update in a batch
        path: `users/${currentUser.uid}/interactions/${profile.id}`, // Example path, might need more detail
      });
      errorEmitter.emit('permission-error', contextualError);
    }
  };

  const activeProfile = profiles.length > 0 ? profiles[profiles.length - 1] : null;

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (activeProfile) {
      handleSwipe(activeProfile, direction);
    }
  };

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
