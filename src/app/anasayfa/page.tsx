'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Heart, X, RefreshCw } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, doc, setDoc, serverTimestamp, updateDoc, getDoc, or } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';
import { getDistance } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

type ProfileWithDistance = UserProfile & { distance?: number };

const cardVariants = {
  hidden: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.8,
  }),
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.3 }
  }),
};

const nextCardVariants = {
  hidden: {
    scale: 0.9,
    y: 20,
    opacity: 0,
  },
  visible: {
    scale: 0.95,
    y: 10,
    opacity: 1,
    filter: 'blur(4px)',
    transition: { duration: 0.3 }
  },
};


export default function AnasayfaPage() {
  const t = langTr;
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<ProfileWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const removeTopCard = () => {
    setProfiles(prev => prev.slice(1));
  };
  
  const handleSwipe = useCallback(async (swipedProfile: UserProfile, action: 'liked' | 'disliked') => {
    if (!user || !firestore) return;

    // Immediately remove the card from UI to make it feel responsive
    removeTopCard();

    try {
        const user1Id = user.uid;
        const user2Id = swipedProfile.uid;
        const matchId = [user1Id, user2Id].sort().join('_');
        const matchDocRef = doc(firestore, 'matches', matchId);

        if (action === 'liked') {
            const theirInteractionSnap = await getDoc(matchDocRef);
            if (theirInteractionSnap.exists()) {
                const theirData = theirInteractionSnap.data();
                // Determine which user key belongs to the other user
                const otherUserKey = `user${[user2Id, user1Id].sort().indexOf(user2Id) + 1}_action`;
                if (theirData[otherUserKey] === 'liked') {
                    // It's a match!
                    await updateDoc(matchDocRef, {
                        status: 'matched',
                        matchDate: serverTimestamp(),
                    });

                    // Create match documents for both users
                    const user1MatchData = {
                      id: matchId,
                      matchedWith: user2Id,
                      lastMessage: t.eslesmeler.defaultMessage,
                      timestamp: serverTimestamp(),
                      fullName: swipedProfile.fullName,
                      profilePicture: swipedProfile.images[0],
                    };

                    const currentUserData = {
                      id: matchId,
                      matchedWith: user1Id,
                      lastMessage: t.eslesmeler.defaultMessage,
                      timestamp: serverTimestamp(),
                      fullName: userProfile?.fullName || user.displayName,
                      profilePicture: userProfile?.profilePicture || user.photoURL,
                    };

                    await setDoc(doc(firestore, `users/${user1Id}/matches`, matchId), user1MatchData);
                    await setDoc(doc(firestore, `users/${user2Id}/matches`, matchId), currentUserData);

                    toast({
                        title: t.anasayfa.matchToastTitle,
                        description: `${swipedProfile.fullName} ${t.anasayfa.matchToastDescription}`,
                    });
                }
            }
        }

        // Record the current user's action
        const updateData = {
            user1Id: [user1Id, user2Id].sort()[0],
            user2Id: [user1Id, user2Id].sort()[1],
            status: 'pending',
            [`user${[user1Id, user2Id].sort().indexOf(user1Id) + 1}_action`]: action,
            [`user${[user1Id, user2Id].sort().indexOf(user1Id) + 1}_timestamp`]: serverTimestamp(),
        };

        await setDoc(matchDocRef, updateData, { merge: true });

    } catch (error) {
        console.error(`Error handling ${action}:`, error);
        toast({
            title: t.common.error,
            description: "Etkileşim kaydedilemedi.",
            variant: "destructive",
        });
    }
  }, [user, firestore, t, toast, userProfile]);

 const fetchProfiles = useCallback(async (options?: { reset?: boolean }) => {
    if (!user || !firestore || !userProfile?.location?.latitude || !userProfile?.location?.longitude) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);

    try {
        const interactedUids = new Set<string>();
        interactedUids.add(user.uid); // Ensure user doesn't see themselves
        
        if (!options?.reset) {
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
        
        const qConstraints = [];
        const genderPref = userProfile?.genderPreference;

        if (genderPref && genderPref !== 'both') {
          qConstraints.push(where('gender', '==', genderPref));
        }

        qConstraints.push(limit(100));

        const usersQuery = query(collection(firestore, 'users'), ...qConstraints);

        const querySnapshot = await getDocs(usersQuery);
        
        const fetchedProfiles = querySnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
            .filter(p => {
                if (!p.uid || interactedUids.has(p.uid)) return false;
                if (!p.fullName || !p.images || p.images.length === 0) return false;
                if (!p.location?.latitude || !p.location?.longitude) return false;

                const distance = getDistance(
                    userProfile.location!.latitude!,
                    userProfile.location!.longitude!,
                    p.location.latitude,
                    p.location.longitude
                );
                
                const userDistancePref = userProfile.distancePreference || 50;
                
                if (distance > userDistancePref) {
                    return false;
                }
                
                (p as ProfileWithDistance).distance = distance;
                return true;
            });
        
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

  const topCard = profiles[0];
  const nextCard = profiles[1];

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-4 overflow-hidden">
      {isLoading ? (
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      ) : profiles.length > 0 ? (
        <div className="relative flex-1 flex flex-col items-center justify-center w-full max-w-sm h-full max-h-[70vh]">
          <AnimatePresence>
            {nextCard && (
              <motion.div
                key={nextCard.uid}
                className="absolute w-full h-full"
                variants={nextCardVariants}
                initial="hidden"
                animate="visible"
              >
                <ProfileCard
                  profile={nextCard}
                  onSwipe={() => {}}
                  isDraggable={false}
                />
              </motion.div>
            )}
          </AnimatePresence>
           <AnimatePresence onExitComplete={removeTopCard}>
            {topCard && (
              <motion.div
                  key={topCard.uid}
                  className="absolute w-full h-full"
                  style={{ zIndex: 2 }} // Ensure top card is always on top
              >
                  <ProfileCard
                    profile={topCard}
                    onSwipe={(action) => handleSwipe(topCard, action)}
                    isDraggable={true}
                  />
              </motion.div>
            )}
           </AnimatePresence>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center text-center">
            <div className='space-y-4'>
                <p>{t.anasayfa.outOfProfilesDescription}</p>
                <Button onClick={() => fetchProfiles({ reset: true })}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tekrar Dene
                </Button>
            </div>
        </div>
      )}
    </div>
  );
}
