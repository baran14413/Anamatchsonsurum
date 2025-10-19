
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, limit, doc, setDoc, serverTimestamp, getDoc, updateDoc, increment } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import ProfileCard from '@/components/profile-card';
import { getDistance } from '@/lib/utils';
import { langTr } from '@/languages/tr';
import type { Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

// Helper function to fetch and filter profiles
const fetchProfiles = async (
    firestore: Firestore,
    user: User,
    userProfile: UserProfile,
    ignoreFilters: boolean = false
): Promise<UserProfile[]> => {
    try {
        const usersRef = collection(firestore, 'users');
        let q = query(usersRef, limit(250));
        const usersSnapshot = await getDocs(q);

        let interactedUids = new Set<string>();
        if (!ignoreFilters) {
            const interactedMatchDocsSnap = await getDocs(collection(firestore, 'matches'));
            interactedMatchDocsSnap.forEach(doc => {
                const match = doc.data();
                if (match.user1Id === user.uid && match.user1_action) {
                    interactedUids.add(match.user2Id);
                } else if (match.user2Id === user.uid && match.user2_action) {
                    interactedUids.add(match.user1Id);
                }
            });
        }

        let fetchedProfiles = usersSnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
            .filter(p => {
                if (!p.uid || !p.images || p.images.length === 0 || !p.fullName || !p.dateOfBirth) return false;
                if (p.uid === user.uid) return false;
                if (!ignoreFilters && interactedUids.has(p.uid)) return false;
                
                if (p.isBot) return true;

                if (!ignoreFilters && userProfile.genderPreference && userProfile.genderPreference !== 'both') {
                    if (p.gender !== userProfile.genderPreference) return false;
                }

                if (userProfile.location && p.location) {
                    p.distance = getDistance(
                        userProfile.location.latitude!,
                        userProfile.location.longitude!,
                        p.location.latitude!,
                        p.location.longitude!
                    );
                } else {
                    p.distance = Infinity;
                }

                if (!ignoreFilters) {
                    if (!userProfile.globalModeEnabled) {
                        if (p.distance > (userProfile.distancePreference || 160)) return false;
                    }
                    if (userProfile.ageRange) {
                        const age = new Date().getFullYear() - new Date(p.dateOfBirth!).getFullYear();
                        if (age < userProfile.ageRange.min || age > userProfile.ageRange.max) {
                            if (!userProfile.expandAgeRange) return false;
                        }
                    }
                }

                return true;
            });

        fetchedProfiles.sort((a, b) => {
            if (userProfile.globalModeEnabled) {
                return (a.distance ?? Infinity) - (b.distance ?? Infinity);
            }
            return Math.random() - 0.5;
        });

        return fetchedProfiles;
    } catch (error: any) {
        console.error("Profil getirme hatası:", error);
        return [];
    }
};

export default function AnasayfaPage() {
  const { user, userProfile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfiles = useCallback(async (ignoreFilters = false) => {
    if (user && firestore && userProfile && !isUserLoading) {
      setIsLoading(true);
      const fetched = await fetchProfiles(firestore, user, userProfile, ignoreFilters);
      setProfiles(fetched);
      setIsLoading(false);
    } else if (!isUserLoading) {
      setIsLoading(false);
    }
  }, [user, firestore, userProfile, isUserLoading]);

  useEffect(() => {
    loadProfiles(false);
  }, [loadProfiles]);


  const handleSwipe = useCallback(async (profileToSwipe: UserProfile, direction: 'left' | 'right' | 'up') => {
    if (!user || !firestore || !profileToSwipe || !userProfile) return;

    // Optimistically remove the profile from the UI
    setProfiles(prev => prev.filter(p => p.uid !== profileToSwipe.uid));

    if (direction === 'up') {
        const currentUserRef = doc(firestore, 'users', user.uid);
        const currentUserSnap = await getDoc(currentUserRef);
        const currentUserData = currentUserSnap.data();
        
        if (!currentUserData || (currentUserData.superLikeBalance ?? 0) < 1) {
            toast({
                title: "Super Like Hakkın Kalmadı!",
                description: "Daha fazla Super Like almak için marketi ziyaret edebilirsin.",
                action: <Button onClick={() => router.push('/market')}>Markete Git</Button>
            });
            // Re-add profile to the top of the stack if the action fails
            setProfiles(prev => [profileToSwipe, ...prev]);
            return;
        }
        await updateDoc(currentUserRef, { superLikeBalance: increment(-1) });
    }
    
    if (profileToSwipe.isBot && (direction === 'right' || direction === 'up')) {
      try {
          const res = await fetch('/api/message-webhook', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.NEXT_PUBLIC_WEBHOOK_SECRET}`
              },
              body: JSON.stringify({
                  matchId: [user.uid, profileToSwipe.uid].sort().join('_'),
                  message: {
                      senderId: user.uid,
                      text: "Initial bot match message"
                  }
              })
          });
          if(!res.ok) throw new Error("Webhook failed");

      } catch (error: any) {
          console.error("Bot interaction error:", error);
      }
    }
    
    try {
        const action = direction === 'up' ? 'superliked' : (direction === 'right' ? 'liked' : 'disliked');
        const sortedIds = [user.uid, profileToSwipe.uid].sort();
        const matchId = sortedIds.join('_');
        const matchDocRef = doc(firestore, 'matches', matchId);

        const matchDoc = await getDoc(matchDocRef);
        let matchData: any = matchDoc.exists() ? matchDoc.data() : {};

        const user1IsCurrentUser = user.uid === sortedIds[0];
        
        const otherUserKey = user1IsCurrentUser ? 'user2_action' : 'user1_action';
        const otherUserAction = matchData[otherUserKey];

        const isMatch = (action === 'liked' && (otherUserAction === 'liked' || otherUserAction === 'superliked')) || (action === 'superliked' && otherUserAction === 'liked');

        const updateData: any = {
            id: matchId,
            user1Id: sortedIds[0],
            user2Id: sortedIds[1],
            isSuperLike: matchData.isSuperLike || action === 'superliked',
            status: isMatch ? 'matched' : (action === 'superliked' ? 'superlike_pending' : (matchData.status || 'pending')),
        };

        if(action === 'superliked') {
            updateData.superLikeInitiator = user.uid;
        }

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
        
        if (profileToSwipe.uid) {
            let lastMessage = '';
            if (isMatch) lastMessage = langTr.eslesmeler.defaultMessage;
            if (action === 'superliked') lastMessage = `${userProfile.fullName} sana bir Super Like gönderdi!`;

            const otherUserInteractionRef = doc(firestore, `users/${profileToSwipe.uid}/matches`, matchId);
            await setDoc(otherUserInteractionRef, { 
                id: matchId,
                matchedWith: user.uid, 
                status: updateData.status,
                timestamp: serverTimestamp(),
                fullName: userProfile?.fullName,
                profilePicture: userProfile?.profilePicture || userProfile?.images?.[0]?.url || '',
                isSuperLike: updateData.isSuperLike,
                superLikeInitiator: updateData.superLikeInitiator || null,
                lastMessage: lastMessage,
            }, { merge: true });
        }
        
        const currentUserInteractionRef = doc(firestore, `users/${user.uid}/matches`, matchId);
        await setDoc(currentUserInteractionRef, {
            id: matchId,
            matchedWith: profileToSwipe.uid,
            status: updateData.status,
            timestamp: serverTimestamp(),
            fullName: profileToSwipe.fullName,
            profilePicture: profileToSwipe.profilePicture || profileToSwipe.images?.[0]?.url || '',
            isSuperLike: updateData.isSuperLike,
            superLikeInitiator: updateData.superLikeInitiator || null,
            lastMessage: isMatch ? langTr.eslesmeler.defaultMessage : (action === 'superliked' ? `Super Like gönderildi` : ''),
        }, { merge: true });


        if (isMatch) {
            toast({
                title: langTr.anasayfa.matchToastTitle,
                description: `${profileToSwipe.fullName} ${langTr.anasayfa.matchToastDescription}`
            })
        }
         if (action === 'superliked') {
            toast({
                title: "Super Like Gönderildi!",
                description: `${profileToSwipe.fullName} kabul ederse eşleşeceksiniz.`
            });
        }

    } catch (error: any) {
        console.error(`Error handling ${direction}:`, error);
        setProfiles(prev => [profileToSwipe, ...prev]);
    }

  }, [user, firestore, toast, userProfile, router]);

  if (isLoading || isUserLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
      </div>
    );
  }

  const handleRetry = () => {
      loadProfiles(true);
  }
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 pt-0 overflow-hidden">
      <div className="relative w-full h-full max-w-md flex items-center justify-center">
        <AnimatePresence>
          {profiles.map((profile, index) => {
            const isTopCard = index === profiles.length - 1;
            return (
              <ProfileCard
                key={profile.uid}
                profile={profile}
                isTopCard={isTopCard}
                onSwipe={(p, dir) => handleSwipe(p, dir)}
              />
            );
          })}
        </AnimatePresence>
        {profiles.length === 0 && !isLoading && (
          <motion.div
            className="flex flex-col items-center justify-center text-center p-4 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 className="text-2xl font-bold">{langTr.anasayfa.outOfProfilesTitle}</h3>
            <p className="text-muted-foreground">
              {langTr.anasayfa.outOfProfilesDescription}
            </p>
            <Button onClick={handleRetry}>Tekrar Dene</Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

