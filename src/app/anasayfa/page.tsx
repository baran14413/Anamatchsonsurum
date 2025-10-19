
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserProfile, Match } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, limit, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import { motion, useAnimation } from 'framer-motion';
import ProfileCard from '@/components/profile-card';
import { getDistance } from '@/lib/utils';
import { langTr } from '@/languages/tr';
import type { Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';


// Moved fetchProfiles outside the component to prevent it from being recreated on every render.
const fetchProfiles = async (
    firestore: Firestore,
    user: User,
    userProfile: UserProfile,
    setProfiles: React.Dispatch<React.SetStateAction<UserProfile[]>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    toast: (options: any) => void,
    ignoreFilters: boolean = false
) => {
    setIsLoading(true);
    
    try {
        const usersRef = collection(firestore, 'users');
        let q = query(usersRef, limit(50));

        const usersSnapshot = await getDocs(q);

        const interactedUsersSnap = await getDocs(collection(firestore, `users/${user.uid}/matches`));
        const interactedUids = new Set(interactedUsersSnap.docs.map(doc => doc.id));
        
        const fetchedProfiles = usersSnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
            .filter(p => {
                if (!p.uid || !p.images || p.images.length === 0 || !p.fullName) return false;
                if (p.uid === user.uid) return false;

                if (userProfile.location && p.location) {
                    p.distance = getDistance(
                        userProfile.location.latitude!,
                        userProfile.location.longitude!,
                        p.location.latitude!,
                        p.location.longitude!
                    );
                } else {
                    p.distance = undefined;
                }

                if (!ignoreFilters) {
                    const sortedIds = [user.uid, p.uid].sort();
                    const matchId = sortedIds.join('_');
                    if (interactedUids.has(matchId)) {
                        return false;
                    }

                    if (!userProfile.globalModeEnabled && p.distance !== undefined) {
                        if (p.distance > (userProfile.distancePreference || 160)) {
                            return false;
                        }
                    }
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
};

export default function AnasayfaPage() {
  const { user, userProfile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && firestore && userProfile && !isUserLoading) {
      fetchProfiles(firestore, user, userProfile, setProfiles, setIsLoading, toast);
    } else if (!isUserLoading) {
        setIsLoading(false);
    }
  }, [user, firestore, userProfile, isUserLoading, toast]);


  const handleSwipe = useCallback(async (profileToSwipe: UserProfile, direction: 'left' | 'right') => {
    if (!user || !firestore || !profileToSwipe || !userProfile) return;
    
    // Optimistically remove the profile from the UI
    setProfiles(prev => prev.filter(p => p.uid !== profileToSwipe.uid));
    
    try {
        const action = direction === 'right' ? 'liked' : 'disliked';
        const sortedIds = [user.uid, profileToSwipe.uid].sort();
        const matchId = sortedIds.join('_');
        const matchDocRef = doc(firestore, 'matches', matchId);

        const matchDoc = await getDoc(matchDocRef);
        const matchData = matchDoc.data() as Match | undefined;

        const user1IsCurrentUser = user.uid === sortedIds[0];

        const otherUserAction = user1IsCurrentUser ? matchData?.user2_action : matchData?.user1_action;
        const isMatch = (action === 'liked' && (otherUserAction === 'liked' || otherUserAction === 'superliked'));

        const updateData: any = {
            id: matchId,
            user1Id: sortedIds[0],
            user2Id: sortedIds[1],
            status: isMatch ? 'matched' : (matchData?.status || 'pending'),
        };

        if (isMatch) {
            updateData.matchDate = serverTimestamp();
        }

        if (user1IsCurrentUser) {
            updateData.user1_action = action;
            updateData.user1_timestamp = serverTimestamp();
        } else {
            updateData.user2_action = action;
            updateData.user2_timestamp = serverTimestamp();
        }

        await setDoc(matchDocRef, updateData, { merge: true });

        const userInteractionRef = doc(firestore, `users/${user.uid}/matches`, matchId);
        await setDoc(userInteractionRef, { 
            id: matchId,
            matchedWith: profileToSwipe.uid, 
            status: isMatch ? 'matched' : (matchData?.status || 'pending'),
            action: action, 
            timestamp: serverTimestamp(),
            fullName: profileToSwipe.fullName,
            profilePicture: profileToSwipe.profilePicture || '',
            lastMessage: isMatch ? langTr.eslesmeler.defaultMessage : '',
        }, { merge: true });
        
        if (profileToSwipe.uid) {
            const otherUserInteractionRef = doc(firestore, `users/${profileToSwipe.uid}/matches`, matchId);
            await setDoc(otherUserInteractionRef, { 
                id: matchId,
                matchedWith: user.uid, 
                status: isMatch ? 'matched' : (matchData?.status || 'pending'),
                timestamp: serverTimestamp(),
                fullName: userProfile?.fullName,
                profilePicture: userProfile?.profilePicture || '',
                lastMessage: isMatch ? langTr.eslesmeler.defaultMessage : '',
            }, { merge: true });
        }

        if (isMatch) {
            toast({
                title: langTr.anasayfa.matchToastTitle,
                description: `${profileToSwipe.fullName} ${langTr.anasayfa.matchToastDescription}`
            })
        }

    } catch (error: any) {
        console.error(`Error handling ${action}:`, error);
        // Re-add profile to the list if the action fails
        setProfiles(prev => [profileToSwipe, ...prev]);
    }

  }, [user, firestore, toast, userProfile]);

  if (isLoading || isUserLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
      </div>
    );
  }

  const handleRetry = () => {
      if (user && firestore && userProfile) {
        fetchProfiles(firestore, user, userProfile, setProfiles, setIsLoading, toast, true);
      }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="relative w-full h-[600px] max-w-md flex items-center justify-center">
          {profiles.length > 0 ? (
            profiles.map((profile, index) => {
              const isTopCard = index === profiles.length - 1;
              const controls = useAnimation();

              return (
                <motion.div
                  key={profile.uid}
                  className="absolute w-full h-full"
                  drag={isTopCard}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  onDragEnd={(event, { offset, velocity }) => {
                    if (!isTopCard) return;

                    const swipePower = Math.abs(offset.x) * velocity.x;
                    const swipeConfidenceThreshold = 10000;
                    
                    if (swipePower > swipeConfidenceThreshold) { // Swiped right
                      controls.start({
                        x: 500,
                        opacity: 0,
                        rotate: 30,
                        transition: { duration: 0.5 }
                      }).then(() => handleSwipe(profile, 'right'));
                    } else { // Didn't swipe right with enough force, snap back
                      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
                    }
                  }}
                  initial={{ scale: 1, y: 0, rotate: 0 }}
                  animate={controls}
                  style={{
                    scale: 1 - Math.min(profiles.length - 1 - index, 3) * 0.05,
                    y: Math.min(profiles.length - 1 - index, 3) * 10,
                  }}
                  dragElastic={0.5}
                >
                  <ProfileCard profile={profile} isTopCard={isTopCard} />
                </motion.div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 space-y-4">
              <h3 className="text-2xl font-bold">Çevrendeki Herkes Tükendi!</h3>
              <p className="text-muted-foreground">
                Daha sonra tekrar kontrol et veya arama ayarlarını genişlet.
              </p>
              <Button onClick={handleRetry}>Tekrar Dene</Button>
            </div>
          )}
      </div>
    </div>
  );
}
