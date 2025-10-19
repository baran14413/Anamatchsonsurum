'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, limit, doc, setDoc, serverTimestamp, getDoc, updateDoc, increment } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import { motion } from 'framer-motion';
import ProfileCard from '@/components/profile-card';
import { getDistance } from '@/lib/utils';
import { langTr } from '@/languages/tr';
import type { Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// Helper function to fetch and filter profiles
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
        // 1. Fetch all users from Firestore
        const usersRef = collection(firestore, 'users');
        let q = query(usersRef, limit(250)); // Limit to a reasonable number to avoid performance issues
        const usersSnapshot = await getDocs(q);

        // 2. Fetch all user interactions to know who to exclude
        let interactedUids = new Set<string>();
        if (!ignoreFilters) {
            const interactedMatchDocsSnap = await getDocs(collection(firestore, 'matches'));
            interactedMatchDocsSnap.forEach(doc => {
                const match = doc.data();
                // If the current user was involved and took an action, add the other user to the exclusion set
                if (match.user1Id === user.uid && match.user1_action) {
                    interactedUids.add(match.user2Id);
                } else if (match.user2Id === user.uid && match.user2_action) {
                    interactedUids.add(match.user1Id);
                }
            });
        }
        
        // 3. Filter and process the fetched profiles
        let fetchedProfiles = usersSnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
            .filter(p => {
                // Basic sanity checks
                if (!p.uid || !p.images || p.images.length === 0 || !p.fullName || !p.dateOfBirth) return false;
                if (p.uid === user.uid) return false; // Exclude self
                if (!ignoreFilters && interactedUids.has(p.uid)) return false; // Exclude already interacted users
                
                // Bot profiles are always included for matching if not ignored
                if (p.isBot) return true; 

                // Gender Preference Filter
                if (!ignoreFilters && userProfile.genderPreference && userProfile.genderPreference !== 'both') {
                    if (p.gender !== userProfile.genderPreference) {
                        return false;
                    }
                }

                // Calculate distance
                if (userProfile.location && p.location) {
                    p.distance = getDistance(
                        userProfile.location.latitude!,
                        userProfile.location.longitude!,
                        p.location.latitude!,
                        p.location.longitude!
                    );
                } else {
                    p.distance = Infinity; // Assign a high distance if location is not available
                }
                
                if (!ignoreFilters) {
                     // Distance Preference Filter (only if global mode is off)
                     if (!userProfile.globalModeEnabled) {
                         if (p.distance > (userProfile.distancePreference || 160)) {
                             return false;
                         }
                     }
                      // Age Range Filter
                      if(userProfile.ageRange) {
                         const age = new Date().getFullYear() - new Date(p.dateOfBirth!).getFullYear();
                         if (age < userProfile.ageRange.min || age > userProfile.ageRange.max) {
                             // If the user doesn't want to expand the age range, filter them out
                             if(!userProfile.expandAgeRange){
                                 return false;
                             }
                         }
                     }
                }

                return true;
            });
        
        // 4. Sort the profiles
        fetchedProfiles.sort((a, b) => {
            // When global mode is on, sort by distance (nearest first)
            if (userProfile.globalModeEnabled) {
                return (a.distance ?? Infinity) - (b.distance ?? Infinity);
            }
            // Otherwise, randomize the order
            return Math.random() - 0.5;
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
  const router = useRouter();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (user && firestore && userProfile && !isUserLoading) {
      fetchProfiles(firestore, user, userProfile, setProfiles, setIsLoading, toast, false);
    } else if (!isUserLoading) {
        setIsLoading(false);
    }
  }, [user, firestore, userProfile, isUserLoading, toast]);


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
    
    // If the swiped profile is a bot, trigger the webhook for an automatic reply
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
        
        // Denormalize match data for the other user for their "matches" list
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
                superLikeInitiator: updateData.superLikeInitiator,
                lastMessage: lastMessage,
            }, { merge: true });
        }
        
        // Denormalize for the current user as well, to keep the list consistent
        const currentUserInteractionRef = doc(firestore, `users/${user.uid}/matches`, matchId);
        await setDoc(currentUserInteractionRef, {
            id: matchId,
            matchedWith: profileToSwipe.uid,
            status: updateData.status,
            timestamp: serverTimestamp(),
            fullName: profileToSwipe.fullName,
            profilePicture: profileToSwipe.profilePicture || profileToSwipe.images?.[0]?.url || '',
            isSuperLike: updateData.isSuperLike,
            superLikeInitiator: updateData.superLikeInitiator,
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
        // If the backend operation fails, add the profile back to the top of the stack
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
      if (user && firestore && userProfile) {
        // Call fetchProfiles ignoring filters to get a fresh batch of users
        fetchProfiles(firestore, user, userProfile, setProfiles, setIsLoading, toast, true);
      }
  }
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 pt-0 overflow-hidden">
      <div className="relative w-full h-full max-w-md flex items-center justify-center">
        <AnimatePresence>
          {profiles.length > 0 ? (
            profiles.slice(0, 3).reverse().map((profile, index) => {
              const isTopCard = index === profiles.length - 1;
              return (
                <motion.div
                    key={profile.uid}
                    className="absolute w-full h-full"
                    initial={{ scale: 0.95, y: 20, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      y: 0, 
                      opacity: 1,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      transition: { duration: 0.2 }
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <ProfileCard
                    profile={profile}
                    isTopCard={isTopCard}
                    onSwipe={(p, dir) => handleSwipe(p, dir)}
                  />
                </motion.div>
              );
            })
          ) : (
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
        </AnimatePresence>
      </div>
    </div>
  );
}
