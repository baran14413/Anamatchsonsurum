'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, limit, doc, setDoc, serverTimestamp, getDoc, updateDoc, increment, writeBatch, where } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import ProfileCard from '@/components/profile-card';
import { getDistance } from '@/lib/utils';
import { langTr } from '@/languages/tr';
import type { Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/app-shell';
import { Undo, Heart, X as XIcon, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { differenceInCalendarDays } from 'date-fns';

// Helper function to fetch and filter profiles
const fetchProfiles = async (
  firestore: Firestore,
  currentUser: User,
  userProfile: UserProfile,
  interactedUids: Set<string>
): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(firestore, 'users');

    // First, try to get real users
    const realUsersQuery = query(
        usersRef,
        where('isBot', '!=', true),
        limit(100)
    );
    const realUsersSnapshot = await getDocs(realUsersQuery);

    let potentialProfiles = realUsersSnapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
      .filter(p => 
          p.uid && 
          p.uid !== currentUser.uid && 
          !interactedUids.has(p.uid) &&
          p.images && p.images.length > 0
      )
      .filter(p => {
            // Gender preference filter
            if (userProfile.genderPreference && userProfile.genderPreference !== 'both') {
                if (p.gender !== userProfile.genderPreference) return false;
            }
            
            // Age range filter
            if (p.dateOfBirth) {
                const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear();
                if (userProfile.ageRange) {
                    if (age < userProfile.ageRange.min || age > userProfile.ageRange.max) {
                        // If outside range, check if expandAgeRange is false to filter out
                        if (!userProfile.expandAgeRange) return false;
                    }
                }
            } else {
                return false; // Don't show users without a date of birth
            }

            // Distance filter
            if (userProfile.location?.latitude && userProfile.location?.longitude && p.location?.latitude && p.location?.longitude) {
                p.distance = getDistance(userProfile.location.latitude, userProfile.location.longitude, p.location.latitude, p.location.longitude);
                if (!userProfile.globalModeEnabled) {
                    if(p.distance > (userProfile.distancePreference || 160)) return false;
                }
            } else {
                if (userProfile.globalModeEnabled) {
                  p.distance = Math.floor(Math.random() * 5000) + 200;
                } else {
                  return false;
                }
            }
            return true;
      });
      
      // If no real users found, get bots
      if (potentialProfiles.length === 0) {
          const botsQuery = query(
              usersRef,
              where('isBot', '==', true),
              limit(50)
          );
          const botsSnapshot = await getDocs(botsQuery);
          potentialProfiles = botsSnapshot.docs
              .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
              .filter(p => p.uid && !interactedUids.has(p.uid) && p.images && p.images.length > 0)
              .map(p => ({
                    ...p,
                    distance: Math.floor(Math.random() * 140) + 1 // Assign a random distance for bots
              }));
      }


    return potentialProfiles.sort(() => Math.random() - 0.5).slice(0, 25);

  } catch (error: any) {
    console.error("Profil getirme hatası:", error);
    return [];
  }
};


const MemoizedProfileCard = memo(ProfileCard);

function AnasayfaPageContent() {
  const { user, userProfile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSwipedProfile, setLastSwipedProfile] = useState<{profile: UserProfile, direction: 'left' | 'right' | 'up'} | null>(null);
  
  const isFetching = useRef(false);
  const interactedUids = useRef<Set<string>>(new Set());

  const loadProfiles = useCallback(async () => {
    if (!user || !firestore || !userProfile || isFetching.current) return;
  
    isFetching.current = true;
    if(profiles.length === 0) setIsLoading(true);
  
    const newProfiles = await fetchProfiles(firestore, user, userProfile, interactedUids.current);
  
    if (newProfiles.length > 0) {
      setProfiles(prev => [...prev, ...newProfiles]);
    }
    
    setIsLoading(false);
    isFetching.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, firestore, userProfile]);

  // Initial load and fetching interacted UIDs
  useEffect(() => {
    if (!isUserLoading && user && firestore && userProfile) {
      // Clear interacted UIDs on user change, and add self
      interactedUids.current.clear();
      interactedUids.current.add(user.uid);

      // Fetch all matches once to know who to exclude
      const fetchInteracted = async () => {
         const matchCollectionRef = collection(firestore, 'matches');
         const q1 = query(matchCollectionRef, where('user1Id', '==', user.uid));
         const q2 = query(matchCollectionRef, where('user2Id', '==', user.uid));

         const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
         
         snap1.forEach(doc => interactedUids.current.add(doc.data().user2Id));
         snap2.forEach(doc => interactedUids.current.add(doc.data().user1Id));

         // Initial profile load after fetching interactions
         if (profiles.length === 0) {
            loadProfiles();
         }
      };

      fetchInteracted();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoading, user, firestore, userProfile]);

  // Prefetch when deck is low
  useEffect(() => {
    if (profiles.length > 0 && profiles.length < 5 && !isFetching.current) {
        loadProfiles();
    }
  }, [profiles.length, loadProfiles]);

 const handleSwipe = useCallback(async (profileToSwipe: UserProfile, direction: 'left' | 'right' | 'up') => {
    if (!user || !firestore || !profileToSwipe || !userProfile) return;

    setLastSwipedProfile({ profile: profileToSwipe, direction });
    setProfiles(prev => prev.filter(p => p.uid !== profileToSwipe.uid));
    interactedUids.current.add(profileToSwipe.uid); // Add to interacted set

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
            setProfiles(prev => [profileToSwipe, ...prev]);
            interactedUids.current.delete(profileToSwipe.uid); // Revert interaction
            return;
        }
        await updateDoc(currentUserRef, { superLikeBalance: increment(-1) });
    }

    try {
        const action = direction === 'up' ? 'superliked' : (direction === 'right' ? 'liked' : 'disliked');
        const sortedIds = [user.uid, profileToSwipe.uid].sort();
        const matchId = sortedIds.join('_');
        const matchDocRef = doc(firestore, 'matches', matchId);

        const matchDoc = await getDoc(matchDocRef);
        let matchData: any = matchDoc.exists() ? matchDoc.data() : {};

        const user1IsCurrentUser = user.uid === sortedIds[0];
        const otherUserActionKey = user1IsCurrentUser ? 'user2_action' : 'user1_action';
        const otherUserAction = matchData[otherUserActionKey];

        const isMatch = (action === 'liked' && (otherUserAction === 'liked' || otherUserAction === 'superliked')) || 
                        (action === 'superliked' && otherUserAction === 'liked');

        let newStatus: 'pending' | 'matched' | 'superlike_pending' = 'pending';
        if (isMatch) {
            newStatus = 'matched';
        } else if (action === 'superliked') {
            newStatus = 'superlike_pending';
        } else if (matchData.status) {
            newStatus = matchData.status;
        }

        const updateData: any = {
            id: matchId,
            user1Id: sortedIds[0],
            user2Id: sortedIds[1],
            isSuperLike: matchData.isSuperLike || action === 'superliked',
            status: newStatus,
        };

        if (user1IsCurrentUser) {
            updateData.user1_action = action;
            updateData.user1_timestamp = serverTimestamp();
        } else {
            updateData.user2_action = action;
            updateData.user2_timestamp = serverTimestamp();
        }

        if (action === 'superliked') {
            updateData.superLikeInitiator = user.uid;
        }
        if (isMatch) {
            updateData.matchDate = serverTimestamp();
        }
        
        await setDoc(matchDocRef, updateData, { merge: true });
        
        if (profileToSwipe.isBot && isMatch) {
            const webhookUrl = '/api/message-webhook';
            fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_WEBHOOK_SECRET}`
                },
                body: JSON.stringify({
                    type: 'MATCH',
                    matchId: matchId,
                    userId: user.uid,
                }),
            }).catch(error => console.error("Error triggering bot message webhook:", error));
        }


        const defaultLastMessage = langTr.eslesmeler.defaultMessage;
        
        const currentUserMatchData = {
            id: matchId,
            matchedWith: profileToSwipe.uid,
            status: newStatus,
            timestamp: serverTimestamp(),
            fullName: profileToSwipe.fullName || '',
            profilePicture: profileToSwipe.profilePicture || '',
            isSuperLike: updateData.isSuperLike,
            superLikeInitiator: updateData.superLikeInitiator || null,
            lastMessage: isMatch ? defaultLastMessage : '',
        };
        
        const otherUserMatchData = {
            id: matchId,
            matchedWith: user.uid,
            status: newStatus,
            timestamp: serverTimestamp(),
            fullName: userProfile.fullName || '',
            profilePicture: userProfile.profilePicture || '',
            isSuperLike: updateData.isSuperLike,
            superLikeInitiator: updateData.superLikeInitiator || null,
            lastMessage: isMatch ? defaultLastMessage : '',
        };

        if (isMatch) {
            await setDoc(doc(firestore, `users/${user.uid}/matches`, matchId), currentUserMatchData, { merge: true });
            await setDoc(doc(firestore, `users/${profileToSwipe.uid}/matches`, matchId), otherUserMatchData, { merge: true });
            
            toast({
                title: langTr.anasayfa.matchToastTitle,
                description: `${profileToSwipe.fullName} ${langTr.anasayfa.matchToastDescription}`
            });

        } else if (action !== 'disliked') {
             if (profileToSwipe.uid) { 
                await setDoc(doc(firestore, `users/${profileToSwipe.uid}/matches`, matchId), otherUserMatchData, { merge: true });
            }
             if (action === 'superliked') {
                toast({
                    title: "Super Like Gönderildi!",
                    description: `${profileToSwipe.fullName} kabul ederse eşleşeceksiniz.`
                });
            }
        }
        
    } catch (error: any) {
        console.error(`Error handling ${direction}:`, error);
        setProfiles(prev => [profileToSwipe, ...prev]);
        interactedUids.current.delete(profileToSwipe.uid); // Revert interaction
    }
}, [user, firestore, toast, userProfile, router]);
  
  const handleUndo = async () => {
    if (!lastSwipedProfile || !user || !firestore || !userProfile) {
        toast({ title: 'Geri alınacak bir işlem yok.' });
        return;
    }

    const isGoldMember = userProfile.membershipType === 'gold';
    const lastUndoDate = userProfile.lastUndoTimestamp?.toDate();
    const today = new Date();
    const isNewDay = !lastUndoDate || differenceInCalendarDays(today, lastUndoDate) >= 1;
    const canUndo = isGoldMember || isNewDay || (userProfile.dailyUndoCount || 0) < 1;

    if (!canUndo) {
        toast({
            title: 'Günlük Geri Alma Hakkın Bitti',
            description: 'Sınırsız geri alma için Gold üyeliğe geçebilirsin.',
            action: <Button onClick={() => router.push('/market')}>Markete Git</Button>
        });
        return;
    }

    try {
        const batch = writeBatch(firestore);
        const sortedIds = [user.uid, lastSwipedProfile.profile.uid].sort();
        const matchId = sortedIds.join('_');

        const mainMatchRef = doc(firestore, 'matches', matchId);
        
        const matchDoc = await getDoc(mainMatchRef);
        if (matchDoc.exists()) {
             batch.delete(mainMatchRef);
        }

        const currentUserMatchRef = doc(firestore, `users/${user.uid}/matches`, matchId);
        const otherUserMatchRef = doc(firestore, `users/${lastSwipedProfile.profile.uid}/matches`, matchId);
        
        batch.delete(currentUserMatchRef);
        batch.delete(otherUserMatchRef);
        
        if (lastSwipedProfile.direction === 'up') {
             const currentUserRef = doc(firestore, 'users', user.uid);
             batch.update(currentUserRef, { superLikeBalance: increment(1) });
        }

        if (!isGoldMember) {
             const currentUserRef = doc(firestore, 'users', user.uid);
             const updatePayload: { dailyUndoCount: any; lastUndoTimestamp: any } = {
                dailyUndoCount: increment(isNewDay ? -(userProfile.dailyUndoCount || 0) + 1 : 1),
                lastUndoTimestamp: serverTimestamp()
             };
             batch.update(currentUserRef, updatePayload);
        }
        
        await batch.commit();
        
        interactedUids.current.delete(lastSwipedProfile.profile.uid);
        
        setProfiles(prev => [lastSwipedProfile.profile, ...prev]);
        setLastSwipedProfile(null);

    } catch (error: any) {
        console.error("Error undoing swipe:", error);
        toast({ title: 'Hata', description: 'İşlem geri alınırken bir sorun oluştu.', variant: 'destructive'});
    }
  };
  
  const handleRetry = () => {
    toast({
      title: langTr.anasayfa.resetToastTitle,
      description: langTr.anasayfa.resetToastDescription,
    });
    setProfiles([]);
    // Clear the interacted UIDs but keep the current user's UID
    if(user) {
        interactedUids.current.clear();
        interactedUids.current.add(user.uid);
    }
    loadProfiles();
  }

  if (isUserLoading || (isLoading && profiles.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
      </div>
    );
  }
  
  const topCard = profiles.length > 0 ? profiles[profiles.length - 1] : null;

  const handleActionClick = (direction: 'left' | 'right' | 'up') => {
    if (topCard) {
      handleSwipe(topCard, direction);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      <div className="flex-1 relative">
         <div className="absolute inset-0">
          <AnimatePresence>
              {topCard ? (
                <MemoizedProfileCard
                  key={topCard.uid}
                  profile={topCard}
                  onSwipe={handleSwipe}
                />
              ) : !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 space-y-4">
                    <h3 className="text-2xl font-bold">{langTr.anasayfa.outOfProfilesTitle}</h3>
                    <p className="text-muted-foreground">
                    {langTr.anasayfa.outOfProfilesDescription}
                    </p>
                    <Button onClick={handleRetry} disabled={isFetching.current}>
                        {isFetching.current ? "Yükleniyor..." : "Tekrar Dene"}
                    </Button>
                </div>
              )}
          </AnimatePresence>
        </div>
      </div>

      {topCard && (
        <div className="shrink-0 flex justify-center items-center gap-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button onClick={handleUndo} variant="outline" size="icon" className="w-12 h-12 rounded-full shadow-lg bg-background/80 backdrop-blur-sm shadow-yellow-500/50" disabled={!lastSwipedProfile}>
              <Undo className="w-6 h-6 text-yellow-500" />
          </Button>
          <Button onClick={() => handleActionClick('left')} variant="outline" size="icon" className="w-16 h-16 rounded-full shadow-lg bg-background/80 backdrop-blur-sm shadow-red-500/50">
              <XIcon className="w-8 h-8 text-red-500" strokeWidth={3} />
          </Button>
          <Button onClick={() => handleActionClick('up')} variant="outline" size="icon" className="w-12 h-12 rounded-full shadow-lg bg-background/80 backdrop-blur-sm shadow-blue-500/50">
              <Star className="w-6 h-6 text-blue-500" fill="currentColor"/>
          </Button>
          <Button onClick={() => handleActionClick('right')} variant="outline" size="icon" className="w-16 h-16 rounded-full shadow-lg bg-background/80 backdrop-blur-sm shadow-green-500/50">
              <Heart className="w-8 h-8 text-green-500" fill="currentColor"/>
          </Button>
        </div>
      )}
    </div>
  );
}


export default function AnasayfaPage() {
    return (
        <AppShell>
            <AnasayfaPageContent />
        </AppShell>
    );
}
