
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserProfile, Match } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, limit, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { AnimatePresence, motion } from 'framer-motion';
import ProfileCard from '@/components/profile-card';
import { getDistance } from '@/lib/utils';

const CARD_STACK_OFFSET = 10;
const CARD_STACK_SCALE = 0.05;
const SWIPE_CONFIDENCE_THRESHOLD = 10000;

export default function AnasayfaPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  const fetchProfiles = useCallback(async (ignoreInteractions = false) => {
    if (!user || !userProfile || !firestore) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setProfiles([]); // Clear profiles to force a re-render with new data

    try {
      const usersRef = collection(firestore, 'users');
      let q = query(usersRef, limit(50));

      const usersSnapshot = await getDocs(q);

      let interactedUids = new Set<string>();
      if (!ignoreInteractions) {
        // Fetch all interactions, including dislikes, to prevent them from reappearing
        const interactedUsersSnap = await getDocs(collection(firestore, `users/${user.uid}/matches`));
        interactedUids = new Set(interactedUsersSnap.docs.map(doc => doc.id));
      }
      interactedUids.add(user.uid);


      const fetchedProfiles = usersSnapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
        .filter(p => {
          if (!p.uid || !p.images || p.images.length === 0 || !p.fullName) return false;
          
          // Use the matchId format for checking interactions, which is more robust
          const sortedIds = [user.uid, p.uid].sort();
          const matchId = sortedIds.join('_');
          if (interactedUids.has(matchId)) {
              return false;
          }
          
          if (!p.isBot && p.uid === user.uid) return false;


          if (userProfile.location && p.location && !userProfile.globalModeEnabled) {
              const distance = getDistance(
                  userProfile.location.latitude!,
                  userProfile.location.longitude!,
                  p.location.latitude!,
                  p.location.longitude!
              );
              if (distance > (userProfile.distancePreference || 160)) {
                  return false;
              }
              p.distance = distance;
          }

          return true;
        });

      setProfiles(fetchedProfiles);
    } catch (error: any) {
      console.error("Profil getirme hatası:", error);
      toast({ title: "Hata", description: `Profiller getirilemedi: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, userProfile, firestore, toast]);

  const forceRefetchProfiles = () => {
    fetchProfiles(true); // Pass true to ignore previous interactions and "reset" the deck
  };

  useEffect(() => {
    if (user && firestore) {
      fetchProfiles();
    } else if (!user) {
        setIsLoading(false);
    }
  }, [user, firestore, fetchProfiles]);

  const handleSwipe = useCallback(async (profileToSwipe: UserProfile, direction: 'left' | 'right') => {
    if (!user || !firestore || !profileToSwipe) return;

    setExitDirection(direction);
    setProfiles(prev => prev.filter(p => p.uid !== profileToSwipe.uid));

    const action = direction === 'left' ? 'disliked' : 'liked';
    
    try {
        const sortedIds = [user.uid, profileToSwipe.uid].sort();
        const matchId = sortedIds.join('_');
        const matchDocRef = doc(firestore, 'matches', matchId);

        const user1IsCurrentUser = user.uid === sortedIds[0];
        const updateData: Partial<Match> = {
            user1Id: sortedIds[0],
            user2Id: sortedIds[1],
            status: 'pending',
            ...(user1IsCurrentUser 
                ? { user1_action: action, user1_timestamp: serverTimestamp() } 
                : { user2_action: action, user2_timestamp: serverTimestamp() })
        };
        await setDoc(matchDocRef, updateData, { merge: true });

        // Record the interaction in the user's subcollection as well to filter them out easily next time
        const userInteractionRef = doc(firestore, `users/${user.uid}/matches`, matchId);
        await setDoc(userInteractionRef, { 
            matchedWith: profileToSwipe.uid, 
            status: 'pending', // A general status for any interaction
            action: action, // Store the specific action
            timestamp: serverTimestamp(),
            fullName: profileToSwipe.fullName,
            profilePicture: profileToSwipe.profilePicture || '',
        }, { merge: true });

    } catch (error: any) {
        console.error(`Error handling ${action}:`, error);
    }

  }, [user, firestore, toast, userProfile]);


  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
      </div>
    );
  }
  
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="relative w-full h-[600px] max-w-md flex items-center justify-center">
            <AnimatePresence custom={exitDirection}>
                {profiles.length > 0 ? (
                    profiles.map((profile, index) => {
                        const isTopCard = index === profiles.length - 1;
                        return (
                            <motion.div
                                key={profile.uid}
                                className="absolute w-full h-full"
                                style={{
                                    zIndex: index,
                                }}
                                initial={{
                                    scale: 1 - (profiles.length - 1 - index) * CARD_STACK_SCALE,
                                    y: (profiles.length - 1 - index) * CARD_STACK_OFFSET,
                                }}
                                animate={{
                                    scale: 1 - (profiles.length - 1 - index) * CARD_STACK_SCALE,
                                    y: (profiles.length - 1 - index) * CARD_STACK_OFFSET,
                                    transition: { duration: 0.3, ease: "easeOut" }
                                }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={1}
                                onDragEnd={(e, { offset, velocity }) => {
                                    if (!isTopCard) return;

                                    const power = swipePower(offset.x, velocity.x);

                                    if (power < -SWIPE_CONFIDENCE_THRESHOLD) {
                                        handleSwipe(profile, 'left');
                                    } else if (power > SWIPE_CONFIDENCE_THRESHOLD) {
                                        handleSwipe(profile, 'right');
                                    }
                                }}
                                custom={exitDirection}
                                exit={(direction) => ({
                                    x: direction === 'left' ? -500 : 500,
                                    rotate: direction === 'left' ? -45 : 45,
                                    opacity: 0,
                                    transition: { duration: 0.5 }
                                })}
                            >
                                <ProfileCard profile={profile} isTopCard={isTopCard} />
                            </motion.div>
                        );
                    }).reverse()
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4 space-y-4">
                        <h3 className="text-2xl font-bold">Çevrendeki Herkes Tükendi!</h3>
                        <p className="text-muted-foreground">Daha sonra tekrar kontrol et veya arama ayarlarını genişlet.</p>
                        <Button onClick={forceRefetchProfiles}>
                            Tekrar Dene
                        </Button>
                    </div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}
