
'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, PartyPopper, Hourglass } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, doc, setDoc, serverTimestamp, getDoc, addDoc } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';
import { getDistance } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/components/icons';

type ProfileWithDistance = UserProfile & { distance?: number };

const calculateAge = (dateString?: string): number | null => {
    if (!dateString) return null;
    const birthDate = new Date(dateString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};


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
  
  const handleSwipe = useCallback(async (swipedProfile: UserProfile, action: 'liked' | 'disliked' | 'superliked') => {
    if (!user || !firestore || !userProfile) return;
    
    removeTopCard();

    const user1Id = user.uid;
    const user2Id = swipedProfile.uid;
    const matchId = [user1Id, user2Id].sort().join('_');
    const matchDocRef = doc(firestore, 'matches', matchId);

    try {
        if (action === 'superliked') {
            const matchSnap = await getDoc(matchDocRef);
             if (matchSnap.exists()) {
                const matchData = matchSnap.data();
                if (matchData.status === 'matched') {
                    toast({
                        title: "Zaten Eşleştiniz!",
                        description: `${swipedProfile.fullName} ile zaten bir eşleşmeniz bulunuyor.`,
                        icon: <PartyPopper className="h-6 w-6 text-yellow-500" />,
                    });
                } else if (matchData.status === 'superlike_pending') {
                     toast({
                        title: "Super Like Yanıtı Bekleniyor",
                        description: `Bu kullanıcıya gönderdiğiniz Super Like henüz yanıtlanmadı.`,
                        icon: <Hourglass className="h-6 w-6 text-blue-500" />,
                    });
                } else {
                     toast({
                        title: "Etkileşim Zaten Var",
                        description: "Bu kişiyle aranızda zaten bir etkileşim mevcut.",
                    });
                }
                return; 
            }

            // Create denormalized match data for both users with superlike status
            const currentUserMatchData = {
                id: matchId,
                matchedWith: user2Id,
                lastMessage: "Yanıt bekleniyor...",
                timestamp: serverTimestamp(),
                fullName: swipedProfile.fullName,
                profilePicture: swipedProfile.images?.[0]?.url || '',
                isSuperLike: true,
                status: 'superlike_pending',
                superLikeInitiator: user1Id
            };

            const swipedUserMatchData = {
                id: matchId,
                matchedWith: user1Id,
                lastMessage: `${userProfile.fullName} sana bir Super Like gönderdi!`,
                timestamp: serverTimestamp(),
                fullName: userProfile.fullName,
                profilePicture: userProfile.profilePicture || '',
                isSuperLike: true,
                status: 'superlike_pending',
                superLikeInitiator: user1Id
            };
            
            await setDoc(doc(firestore, `users/${user1Id}/matches`, matchId), currentUserMatchData);
            await setDoc(doc(firestore, `users/${user2Id}/matches`, matchId), swipedUserMatchData);
            
            // Create the main match document
            await setDoc(matchDocRef, {
                user1Id: [user1Id, user2Id].sort()[0],
                user2Id: [user1Id, user2Id].sort()[1],
                status: 'superlike_pending',
                isSuperLike: true,
                superLikeInitiator: user1Id,
                [`${user1Id < user2Id ? 'user1' : 'user2'}_action`]: 'superliked',
                [`${user1Id < user2Id ? 'user1' : 'user2'}_timestamp`]: serverTimestamp(),
            }, { merge: true });

             // Create a system message for the recipient
            const systemMessage = {
                matchId: matchId,
                senderId: 'system',
                text: `${swipedProfile.fullName} merhaba, benim adım ${userProfile.fullName}. Sana bir süper like yolladım, benimle eşleşmek ister misin? ♥️🙊`,
                timestamp: serverTimestamp(),
                isRead: false,
                type: 'system_superlike_prompt',
                actionTaken: false,
            };
            await addDoc(collection(firestore, `matches/${matchId}/messages`), systemMessage);

        } else { // Handle normal like/dislike
            const isUser1 = user1Id < user2Id;
            const currentUserField = isUser1 ? 'user1' : 'user2';
            const otherUserField = isUser1 ? 'user2' : 'user1';

            const updateData: any = {
                [`${currentUserField}_action`]: action,
                [`${currentUserField}_timestamp`]: serverTimestamp(),
                user1Id: [user1Id, user2Id].sort()[0],
                user2Id: [user1Id, user2Id].sort()[1],
                status: 'pending',
            };

            const theirInteractionSnap = await getDoc(matchDocRef);
            let theirAction: string | undefined;
            if(theirInteractionSnap.exists()) {
                theirAction = theirInteractionSnap.data()?.[`${otherUserField}_action`];
            }

            if (action === 'liked' && theirAction === 'liked') {
                updateData.status = 'matched';
                updateData.matchDate = serverTimestamp();
                
                toast({
                    title: t.anasayfa.matchToastTitle,
                    description: `${swipedProfile.fullName} ${t.anasayfa.matchToastDescription}`,
                    icon: <PartyPopper className="h-6 w-6 text-green-500" />,
                });

                const currentUserMatchData = {
                    id: matchId,
                    matchedWith: user2Id,
                    lastMessage: t.eslesmeler.defaultMessage,
                    timestamp: serverTimestamp(),
                    fullName: swipedProfile.fullName,
                    profilePicture: swipedProfile.images?.[0].url || '',
                    status: 'matched',
                };

                const swipedUserMatchData = {
                    id: matchId,
                    matchedWith: user1Id,
                    lastMessage: t.eslesmeler.defaultMessage,
                    timestamp: serverTimestamp(),
                    fullName: userProfile.fullName,
                    profilePicture: userProfile.profilePicture || '',
                    status: 'matched',
                };
                
                await setDoc(doc(firestore, `users/${user1Id}/matches`, matchId), currentUserMatchData);
                await setDoc(doc(firestore, `users/${user2Id}/matches`, matchId), swipedUserMatchData);
            }
            await setDoc(matchDocRef, updateData, { merge: true });
        }
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
        const interactedUids = new Set<string>([user.uid]);
        
        if (!options?.reset) {
            const matchesQuery1 = query(collection(firestore, 'matches'), where('user1Id', '==', user.uid));
            const matchesQuery2 = query(collection(firestore, 'matches'), where('user2Id', '==', user.uid));
            
            const [query1Snapshot, query2Snapshot] = await Promise.all([
                getDocs(matchesQuery1),
                getDocs(matchesQuery2)
            ]);

            query1Snapshot.forEach(doc => interactedUids.add(doc.data().user2Id));
            query2Snapshot.forEach(doc => interactedUids.add(doc.data().user1Id));
        }

        const qConstraints = [];
        const genderPref = userProfile?.genderPreference;
        const isGlobalMode = userProfile?.globalModeEnabled;
        const ageRange = userProfile?.ageRange;

        if (genderPref && genderPref !== 'both') {
          qConstraints.push(where('gender', '==', genderPref));
        }
        
        qConstraints.push(limit(100));
        
        const usersCollectionRef = collection(firestore, 'users');
        const usersQuery = query(usersCollectionRef, ...qConstraints);

        const querySnapshot = await getDocs(usersQuery);
        
        let fetchedProfiles = querySnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
            .filter(p => {
                if (!p.uid || (!options?.reset && interactedUids.has(p.uid))) return false;
                if (!p.fullName || !p.images || p.images.length === 0) return false;
                
                // Age filter
                if (ageRange) {
                    const age = calculateAge(p.dateOfBirth);
                    if (age === null) return false;

                    const minAge = userProfile.expandAgeRange ? ageRange.min - 5 : ageRange.min;
                    const maxAge = userProfile.expandAgeRange ? ageRange.max + 5 : ageRange.max;
                    
                    if (age < minAge || age > maxAge) {
                        // If expand is on, check if we should still include them
                        if (userProfile.expandAgeRange && (age >= ageRange.min && age <= ageRange.max)) {
                           // They are within original range, so it's fine.
                        } else if (!userProfile.expandAgeRange) {
                           return false;
                        } else {
                            // If they are outside the expanded range, filter them out
                            if (age < ageRange.min || age > ageRange.max) return false;
                        }
                    }
                }
                
                // Location filter
                if (!isGlobalMode) {
                    if (!p.location?.latitude || !p.location?.longitude) return false;
                    const distance = getDistance(
                        userProfile.location!.latitude!,
                        userProfile.location!.longitude!,
                        p.location.latitude,
                        p.location.longitude
                    );
                    (p as ProfileWithDistance).distance = distance;
                    const userDistancePref = userProfile.distancePreference || 50;
                    if (distance > userDistancePref) {
                        return false;
                    }
                } else {
                     if (p.location?.latitude && p.location?.longitude) {
                        const distance = getDistance(
                            userProfile.location!.latitude!,
                            userProfile.location!.longitude!,
                            p.location.latitude,
                            p.location.longitude
                        );
                        (p as ProfileWithDistance).distance = distance;
                     }
                }
                
                return true;
            });
        
        if (isGlobalMode) {
          fetchedProfiles.sort((a, b) => ((a as ProfileWithDistance).distance || Infinity) - ((b as ProfileWithDistance).distance || Infinity));
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
        <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
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
