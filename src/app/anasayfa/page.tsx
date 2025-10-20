
'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, limit, doc, setDoc, serverTimestamp, getDoc, updateDoc, increment, deleteDoc, writeBatch } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import ProfileCard from '@/components/profile-card';
import { getDistance } from '@/lib/utils';
import { langTr } from '@/languages/tr';
import type { Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/app-shell';
import { Undo } from 'lucide-react';
import { differenceInCalendarDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Helper function to fetch and filter profiles
const fetchProfiles = async (
    firestore: Firestore,
    user: User,
    userProfile: UserProfile,
    ignoreFilters: boolean = false,
    currentProfileIds: Set<string>
): Promise<UserProfile[]> => {
    try {
        const usersRef = collection(firestore, 'users');
        
        const interactedUids = new Set<string>();
        
        // Only check for previous interactions if we are NOT ignoring filters
        if (!ignoreFilters) {
            const interactedMatchDocsSnap = await getDocs(collection(firestore, 'matches'));
            interactedMatchDocsSnap.forEach(doc => {
                const match = doc.data();
                if (match.user1Id === user.uid) {
                    interactedUids.add(match.user2Id);
                } else if (match.user2Id === user.uid) {
                    interactedUids.add(match.user1Id);
                }
            });
        }


        let q = query(usersRef, limit(100)); // Fetch a larger batch to have more options
        const usersSnapshot = await getDocs(q);

        let fetchedProfiles = usersSnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
            .filter(p => {
                // If it's a bot, always include it (as long as it's not already in the deck)
                if (p.isBot) {
                    return !currentProfileIds.has(p.uid) && p.uid !== user.uid;
                }

                if (!p.uid || !p.images || p.images.length === 0 || !p.fullName || !p.dateOfBirth) return false;
                if (p.uid === user.uid) return false;
                if (interactedUids.has(p.uid)) return false; // This will be empty if ignoreFilters is true
                if (currentProfileIds.has(p.uid)) return false; // Don't add if already in the state
                
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

        // Sort: Real users first, then bots. Then shuffle within each group.
        fetchedProfiles.sort((a, b) => {
            const aIsBot = a.isBot ?? false;
            const bIsBot = b.isBot ?? false;
            if (aIsBot === bIsBot) {
                return Math.random() - 0.5; // Shuffle within the same group
            }
            return aIsBot ? 1 : -1; // Non-bots come first
        });

        return fetchedProfiles.slice(0, 10); // Return a smaller slice to keep the deck fresh
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
  const [showUndoMessage, setShowUndoMessage] = useState(false);
  const isFetching = useRef(false);

  const loadProfiles = useCallback(async (ignoreFilters = false) => {
    if (!user || !firestore || !userProfile || isFetching.current) return;

    isFetching.current = true;
    setIsLoading(true);

    const currentProfileIds = new Set(profiles.map(p => p.uid));
    const newProfiles = await fetchProfiles(firestore, user, userProfile, ignoreFilters, currentProfileIds);
    
    setProfiles(prev => [...prev, ...newProfiles]);

    setIsLoading(false);
    isFetching.current = false;
  }, [user, firestore, userProfile, profiles]);

  // Initial load
  useEffect(() => {
    if (!isUserLoading && user && userProfile && profiles.length === 0) {
      loadProfiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoading, user, userProfile]);

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

        const isInstantBotMatch = profileToSwipe.isBot && action === 'liked';
        const isMatch = isInstantBotMatch || (action === 'liked' && (otherUserAction === 'liked' || otherUserAction === 'superliked')) || 
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
            if (isInstantBotMatch) updateData.user2_action = 'liked'; // Bot likes back instantly
        } else {
            updateData.user2_action = action;
            updateData.user2_timestamp = serverTimestamp();
             if (isInstantBotMatch) updateData.user1_action = 'liked'; // Bot likes back instantly
        }

        if (action === 'superliked') {
            updateData.superLikeInitiator = user.uid;
        }
        if (isMatch) {
            updateData.matchDate = serverTimestamp();
        }
        
        await setDoc(matchDocRef, updateData, { merge: true });

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
            
            if (profileToSwipe.isBot) {
                 try {
                    await fetch('/api/message-webhook', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_WEBHOOK_SECRET}`
                        },
                        body: JSON.stringify({
                            matchId: matchId,
                            type: 'MATCH', 
                            userId: user.uid
                        })
                    });
                } catch (error: any) {
                    console.error("Bot interaction webhook error:", error);
                }
            }

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
        setProfiles(prev => [...prev, lastSwipedProfile.profile]);
        setLastSwipedProfile(null);

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

        setShowUndoMessage(true);
        setTimeout(() => setShowUndoMessage(false), 2000);

    } catch (error: any) {
        console.error("Error undoing swipe:", error);
        toast({ title: 'Hata', description: 'İşlem geri alınırken bir sorun oluştu.', variant: 'destructive'});
    }
  };

  if (isUserLoading || (isLoading && profiles.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
      </div>
    );
  }

  const handleRetry = () => {
      toast({
        title: langTr.anasayfa.resetToastTitle,
        description: langTr.anasayfa.resetToastDescription,
      });
      setProfiles([]);
      loadProfiles(true);
  }
  
  const topCard = profiles.length > 0 ? profiles[profiles.length - 1] : null;

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-background overflow-hidden">
        <div className="relative flex-1 w-full h-full flex items-center justify-center">
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
             <div className="absolute top-2 right-4 z-50 flex flex-col items-center">
                <Button onClick={handleUndo} variant="outline" size="icon" className="w-10 h-10 rounded-full shadow-lg border-2 border-yellow-500 text-yellow-500 bg-background/50 backdrop-blur-sm hover:bg-yellow-500/10 disabled:opacity-50" disabled={!lastSwipedProfile}>
                    <Undo className="w-5 h-5" />
                </Button>
                <AnimatePresence>
                    {showUndoMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.3 }}
                            className="mt-2 text-sm font-semibold text-yellow-600 dark:text-yellow-400"
                        >
                            Geri Alındı
                        </motion.div>
                    )}
                </AnimatePresence>
             </div>
        </div>
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



    

    