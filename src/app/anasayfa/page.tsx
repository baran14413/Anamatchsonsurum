
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Heart, X, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, doc, setDoc, serverTimestamp, updateDoc, getDoc, or } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';
import { getDistance } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const cardVariants = {
  enter: {
    opacity: 0,
    scale: 0.9,
  },
  center: {
    zIndex: 1,
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 0.3,
    },
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? -1000 : 1000,
      opacity: 0,
      transition: {
        duration: 0.5,
      },
    };
  },
};


type ProfileWithDistance = UserProfile & { distance?: number };

export default function AnasayfaPage() {
  const t = langTr;
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<ProfileWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [direction, setDirection] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const removeTopCard = () => {
    setProfiles((prev) => prev.slice(1));
    setIsAnimating(false);
    setDirection(0);
  };
  
  const handleSwipe = useCallback(async (swipedProfile: UserProfile, action: 'liked' | 'disliked') => {
      if (isAnimating || !user || !firestore) return;
  
      // 1. Trigger animation immediately
      setIsAnimating(true);
      setDirection(action === 'liked' ? 1 : -1);
  
      // 2. Perform DB operations in the background
      try {
          const user1Id = user.uid;
          const user2Id = swipedProfile.uid;
          const matchId = [user1Id, user2Id].sort().join('_');
          const matchDocRef = doc(firestore, 'matches', matchId);
  
          // Check if it's a match
          if (action === 'liked') {
              const theirInteractionSnap = await getDoc(matchDocRef);
              const theirInteraction = theirInteractionSnap.data();
              const theirActionKey = `user${[user2Id, user1Id].sort().indexOf(user2Id) + 1}_action`;
              const theirAction = theirInteraction?.[theirActionKey];
  
              if (theirAction === 'liked') {
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
  
          const updateData = {
              [`user${[user1Id, user2Id].sort().indexOf(user1Id) + 1}_action`]: action,
              [`user${[user1Id, user2Id].sort().indexOf(user1Id) + 1}_timestamp`]: serverTimestamp(),
          };
  
          await setDoc(
              matchDocRef,
              {
                  user1Id: [user1Id, user2Id].sort()[0],
                  user2Id: [user1Id, user2Id].sort()[1],
                  status: 'pending',
                  ...updateData,
              },
              { merge: true }
          );
      } catch (error) {
          console.error(`Error handling ${action}:`, error);
          toast({
              title: t.common.error,
              description: "Etkileşim kaydedilemedi.",
              variant: "destructive",
          });
          // If DB fails, revert animation state to allow retry
          setIsAnimating(false);
          setDirection(0);
      }
      // Note: The UI update (removing card) is now handled by onExitComplete
  }, [isAnimating, user, firestore, t, toast, userProfile]);

  const fetchProfiles = useCallback(async (options?: { reset?: boolean }) => {
    if (!user || !firestore || !userProfile?.location?.latitude || !userProfile?.location?.longitude) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);

    try {
        const interactedUids = new Set<string>();
        interactedUids.add(user.uid);
        
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
    <div className="relative h-full w-full flex flex-col p-4 overflow-hidden">
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : profiles.length > 0 ? (
        <div className="flex-1 flex items-center justify-center relative">
          {nextCard && (
             <motion.div
               className="absolute w-full max-w-sm h-full max-h-[75vh]"
               style={{ scale: 0.95, filter: 'blur(4px)' }}
               initial={{ scale: 0.9, filter: 'blur(8px)' }}
               animate={{ scale: 0.95, filter: 'blur(4px)' }}
               transition={{ duration: 0.3 }}
             >
                <ProfileCard
                    profile={nextCard}
                    onSwipe={() => {}} 
                    isDraggable={false}
                />
            </motion.div>
          )}
          <AnimatePresence onExitComplete={removeTopCard}>
            {topCard && (
               <motion.div
                 key={topCard.uid}
                 className="absolute w-full max-w-sm h-full max-h-[75vh]"
                 variants={cardVariants}
                 initial="center"
                 animate="center"
                 exit="exit"
                 custom={direction}
               >
                 <ProfileCard
                   profile={topCard}
                   onSwipe={(swipeAction) => handleSwipe(topCard, swipeAction)}
                   isDraggable={!isAnimating}
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
