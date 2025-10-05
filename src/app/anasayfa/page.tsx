
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, doc, setDoc, serverTimestamp, updateDoc, or, getDoc } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';
import { Button } from '@/components/ui/button';

const cardVariants = {
  enter: (direction: number) => {
    return {
      x: 0,
      opacity: 0,
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? -1000 : 1000,
      opacity: 0,
    };
  },
};

export default function AnasayfaPage() {
  const t = langTr;
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = useCallback(async (options?: { resetInteractions?: boolean }) => {
    if (!user || !firestore) return;
    setIsLoading(true);

    try {
        const interactedUids = new Set<string>();
        
        // Always add the current user's UID to prevent them from seeing themselves
        interactedUids.add(user.uid);

        if (!options?.resetInteractions) {
            const interactionsQuery = query(
              collection(firestore, 'matches'),
              or(
                where('user1Id', '==', user.uid),
                where('user2Id', '==', user.uid)
              )
            );
            const interactionsSnapshot = await getDocs(interactionsQuery);

            interactionsSnapshot.forEach(doc => {
                const { user1Id, user2Id } = doc.data();
                const otherUserId = user1Id === user.uid ? user2Id : user1Id;
                interactedUids.add(otherUserId);
            });
        }
        
        let usersQuery;
        const genderPref = userProfile?.genderPreference;
        if (genderPref && genderPref !== 'both') {
            usersQuery = query(
                collection(firestore, 'users'),
                where('gender', '==', genderPref),
                limit(50)
            );
        } else {
            usersQuery = query(
                collection(firestore, 'users'),
                limit(50)
            );
        }

        const querySnapshot = await getDocs(usersQuery);
        
        const fetchedProfiles = querySnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
            .filter(p => p.uid && !interactedUids.has(p.uid) && p.fullName && p.images && p.images.length > 0);

        setProfiles(fetchedProfiles);

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
  }, [user, firestore, toast, t.common.error, userProfile]);

  useEffect(() => {
    if (user && firestore && userProfile) {
      fetchProfiles();
    }
  }, [user, firestore, userProfile, fetchProfiles]);
  
  const handleSwipe = useCallback(async (swipedProfile: UserProfile, action: 'liked') => {
    if (!user || !firestore) return;

    // Remove the card from the UI optimistically
    setProfiles((prev) => prev.filter((p) => p.uid !== swipedProfile.uid));
    
    const user1Id = user.uid;
    const user2Id = swipedProfile.uid;
    
    const matchId = [user1Id, user2Id].sort().join('_');
    const matchDocRef = doc(firestore, 'matches', matchId);

    try {
        const theirInteractionSnap = await getDoc(matchDocRef);
        const theirInteraction = theirInteractionSnap.data();

        // Check if it's a match
        if (action === 'liked' && theirInteractionSnap.exists()) {
             const theirActionKey = `user${[user2Id, user1Id].sort().indexOf(user2Id) + 1}_action`;
             const theirAction = theirInteraction?.[theirActionKey];

             if (theirAction === 'liked' || theirAction === 'superlike') {
                 // It's a match!
                await updateDoc(matchDocRef, {
                    status: 'matched',
                    matchDate: serverTimestamp(),
                });

                const user1MatchData = {
                    id: matchId,
                    matchedWith: user2Id,
                    lastMessage: t.eslesmeler.defaultMessage,
                    timestamp: serverTimestamp(),
                    fullName: swipedProfile.fullName,
                    profilePicture: swipedProfile.images[0]
                };
                
                const theirProfileDoc = await getDoc(doc(firestore, `users/${user2Id}`));
                const theirProfileData = theirProfileDoc.data();

                const currentUserData = {
                    id: matchId,
                    matchedWith: user1Id,
                    lastMessage: t.eslesmeler.defaultMessage,
                    timestamp: serverTimestamp(),
                    fullName: userProfile?.fullName || user.displayName,
                    profilePicture: userProfile?.profilePicture || user.photoURL
                };

                await setDoc(doc(firestore, `users/${user1Id}/matches`, matchId), user1MatchData);
                await setDoc(doc(firestore, `users/${user2Id}/matches`, matchId), currentUserData);

                toast({
                    title: t.anasayfa.matchToastTitle,
                    description: `${swipedProfile.fullName} ${t.anasayfa.matchToastDescription}`,
                });
             }
        }
        
        const updateData = {
            [`user${[user1Id, user2Id].sort().indexOf(user1Id) + 1}_action`]: action,
            [`user${[user1Id, user2Id].sort().indexOf(user1Id) + 1}_timestamp`]: serverTimestamp()
        };

        await setDoc(matchDocRef, {
            user1Id: [user1Id, user2Id].sort()[0],
            user2Id: [user1Id, user2Id].sort()[1],
            status: 'pending',
            ...updateData
        }, { merge: true });

    } catch (error) {
        console.error(`Error handling ${action}:`, error);
        // Optional: Revert optimistic update if something fails
        setProfiles((prev) => [swipedProfile, ...prev]);
        toast({
            title: t.common.error,
            description: "Etkileşim kaydedilemedi.",
            variant: "destructive"
        })
    }
  }, [user, firestore, t, toast, userProfile]);


  const handleReset = () => {
    fetchProfiles({ resetInteractions: true });
  };
  
  return (
    <div className="relative h-full w-full flex flex-col p-4 overflow-hidden">
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : profiles.length > 0 ? (
        <div className="flex-1 flex items-center justify-center relative">
          {/* Next card with blur and scale */}
          {profiles.length > 1 && (
            <div className="absolute w-full max-w-sm h-full max-h-[75vh] scale-95 blur-sm">
              <ProfileCard
                profile={profiles[1]}
                onSwipe={() => {}}
                isDraggable={false}
              />
            </div>
          )}
          {/* Top card */}
          <AnimatePresence>
            <motion.div
              key={profiles[0].uid}
              className="absolute w-full max-w-sm h-full max-h-[75vh]"
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              custom={1} // Assuming right swipe
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              <ProfileCard
                profile={profiles[0]}
                onSwipe={(action) => handleSwipe(profiles[0], action)}
                isDraggable={true}
              />
            </motion.div>
          </AnimatePresence>
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
