
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, doc, setDoc, serverTimestamp, getDoc, or } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';
import { getDistance } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

type ProfileWithDistance = UserProfile & { distance?: number };

export default function AnasayfaPage() {
  const t = langTr;
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<ProfileWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const removeTopCard = useCallback(() => {
    setProfiles(prev => prev.slice(1));
  }, []);
  
  const handleSwipe = useCallback(async (swipedProfile: UserProfile, action: 'liked' | 'disliked') => {
    if (!user || !firestore) return;
    
    // Optimistic UI update
    removeTopCard();

    try {
        const user1Id = user.uid;
        const user2Id = swipedProfile.uid;
        const matchId = [user1Id, user2Id].sort().join('_');
        const matchDocRef = doc(firestore, 'matches', matchId);

        const updateData: any = {
            user1Id: [user1Id, user2Id].sort()[0],
            user2Id: [user1Id, user2Id].sort()[1],
            status: 'pending',
        };
        
        const userIndex = [user1Id, user2Id].sort().indexOf(user1Id) + 1;
        updateData[`user${userIndex}_action`] = action;
        updateData[`user${userIndex}_timestamp`] = serverTimestamp();
        
        if (action === 'liked') {
            const theirInteractionSnap = await getDoc(matchDocRef);
            if (theirInteractionSnap.exists()) {
                const theirData = theirInteractionSnap.data();
                const otherUserIndex = userIndex === 1 ? 2 : 1;
                if (theirData[`user${otherUserIndex}_action`] === 'liked') {
                    updateData.status = 'matched';
                    updateData.matchDate = serverTimestamp();
                    
                    toast({
                        title: t.anasayfa.matchToastTitle,
                        description: `${swipedProfile.fullName} ${t.anasayfa.matchToastDescription}`,
                    });

                    const user1MatchData = {
                      id: matchId,
                      matchedWith: user2Id,
                      lastMessage: t.eslesmeler.defaultMessage,
                      timestamp: serverTimestamp(),
                      fullName: swipedProfile.fullName,
                      profilePicture: swipedProfile.images[0],
                    };

                    const currentUserProfileData = {
                      id: matchId,
                      matchedWith: user1Id,
                      lastMessage: t.eslesmeler.defaultMessage,
                      timestamp: serverTimestamp(),
                      fullName: userProfile?.fullName || user.displayName || t.eslesmeler.user,
                      profilePicture: userProfile?.profilePicture || user.photoURL || '',
                    };

                    await setDoc(doc(firestore, `users/${user1Id}/matches`, matchId), user1MatchData);
                    await setDoc(doc(firestore, `users/${user2Id}/matches`, matchId), currentUserProfileData);
                }
            }
        }

        await setDoc(matchDocRef, updateData, { merge: true });

    } catch (error) {
        console.error(`Error handling ${action}:`, error);
        toast({
            title: t.common.error,
            description: "Etkileşim kaydedilemedi.",
            variant: "destructive",
        });
    }
  }, [user, firestore, t, toast, userProfile, removeTopCard]);

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
        const isGlobalMode = userProfile?.globalModeEnabled;

        if (genderPref && genderPref !== 'both') {
          qConstraints.push(where('gender', '==', genderPref));
        }

        qConstraints.push(limit(100));

        const usersQuery = query(collection(firestore, 'users'), ...qConstraints);

        const querySnapshot = await getDocs(usersQuery);
        
        let fetchedProfiles = querySnapshot.docs
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
                
                (p as ProfileWithDistance).distance = distance;

                if (isGlobalMode) {
                  return true;
                }

                const userDistancePref = userProfile.distancePreference || 50;
                
                if (distance > userDistancePref) {
                    return false;
                }
                
                return true;
            });
        
        if (isGlobalMode) {
          fetchedProfiles.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        }
        
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

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-4 overflow-hidden">
      {isLoading ? (
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      ) : profiles.length > 0 ? (
        <div className="relative flex-1 flex flex-col items-center justify-center w-full max-w-sm h-full max-h-[80vh]">
          <AnimatePresence>
            {profiles.map((profile, index) => {
              const isTopCard = index === 0;
              
              if (index > 1) return null;

              return (
                <motion.div
                  key={profile.uid}
                  className="absolute w-full h-full"
                  style={{
                    zIndex: profiles.length - index,
                  }}
                  initial={{ 
                    scale: isTopCard ? 1 : 0.95, 
                    y: isTopCard ? 0 : 10,
                  }}
                  animate={{ 
                    scale: 1, 
                    y: 0, 
                    opacity: 1, 
                    transition: { duration: 0.3, ease: 'easeOut' }
                  }}
                >
                  <ProfileCard
                    profile={profile}
                    onSwipe={(action) => handleSwipe(profile, action)}
                    isDraggable={isTopCard}
                  />
                </motion.div>
              );
            }).reverse()}
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
