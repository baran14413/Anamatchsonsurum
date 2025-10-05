'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RotateCcw, X, Heart, Star, Zap, Undo2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, getDoc, doc, setDoc, serverTimestamp, updateDoc, or } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';
import { Button } from '@/components/ui/button';

export default function AnasayfaPage() {
  const t = langTr;
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const topCard = profiles[currentIndex];
  const nextCard = profiles[currentIndex + 1];

  const fetchProfiles = useCallback(async (options?: { resetInteractions?: boolean }) => {
    if (!user || !firestore) return;
    setIsLoading(true);
    setCurrentIndex(0); // Reset index on new fetch

    try {
        const interactedUids = new Set<string>([user.uid]);
        
        if (!options?.resetInteractions) {
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
        
        let usersQuery;
        const genderPref = userProfile?.genderPreference;
        if (genderPref && genderPref !== 'both') {
            usersQuery = query(
                collection(firestore, 'users'),
                where('gender', '==', genderPref),
                limit(50)
            );
        } else {
            usersQuery = query(
                collection(firestore, 'users'),
                limit(50)
            );
        }

        const querySnapshot = await getDocs(usersQuery);
        
        const fetchedProfiles = querySnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id } as UserProfile))
            .filter(p => p.uid && !interactedUids.has(p.uid) && p.fullName && p.images && p.images.length > 0);

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
  
  const handleInteraction = useCallback(async (action: 'liked' | 'disliked' | 'superlike') => {
    if (!topCard || !user || !firestore) return;
    
    const swipedProfile = topCard;
    const user1Id = user.uid;
    const user2Id = swipedProfile.uid;
    
    const matchId = [user1Id, user2Id].sort().join('_');
    const matchDocRef = doc(firestore, 'matches', matchId);

    // Go to next card immediately (optimistic update)
    setCurrentIndex(prevIndex => prevIndex + 1);

    try {
        const theirInteractionSnap = await getDoc(matchDocRef);
        const theirInteraction = theirInteractionSnap.data();

        // Check if it's a match
        if ((action === 'liked' || action === 'superlike') && theirInteractionSnap.exists()) {
             const theirActionKey = `user${[user2Id, user1Id].sort().indexOf(user2Id) + 1}_action`;
             const theirAction = theirInteraction?.[theirActionKey];

             if (theirAction === 'liked' || theirAction === 'superlike') {
                 // It's a match!
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
                    profilePicture: swipedProfile.images[0]
                };
                const currentUserData = {
                    id: matchId,
                    matchedWith: user1Id,
                    lastMessage: t.eslesmeler.defaultMessage,
                    timestamp: serverTimestamp(),
                    fullName: user.displayName,
                    profilePicture: user.photoURL
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
            [`user${[user1Id, user2Id].sort().indexOf(user1Id) + 1}_timestamp`]: serverTimestamp()
        };

        await setDoc(matchDocRef, {
            user1Id: [user1Id, user2Id].sort()[0],
            user2Id: [user1Id, user2Id].sort()[1],
            status: 'pending',
            ...updateData
        }, { merge: true });

    } catch (error) {
        console.error(`Error handling ${action}:`, error);
        // Optional: Revert optimistic update if something fails
        setCurrentIndex(prevIndex => prevIndex - 1);
        toast({
            title: t.common.error,
            description: "Etkileşim kaydedilemedi.",
            variant: "destructive"
        })
    }
  }, [user, firestore, t, toast, topCard]);


  const handleReset = () => {
    fetchProfiles({ resetInteractions: true });
  };
  
  return (
    <div className="relative h-full w-full flex flex-col p-4">
        {isLoading ? (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : topCard ? (
          <>
            <div className="flex-1 flex items-center justify-center relative">
               {/* Next Card in the background */}
                {nextCard && (
                    <div className="absolute w-full max-w-sm h-full max-h-[75vh] transform scale-95 -translate-y-6">
                        <ProfileCard
                            profile={nextCard}
                            onSwipe={() => {}} // No-op
                            isDraggable={false}
                        />
                    </div>
                )}
                {/* Top Card */}
                <div className="absolute w-full max-w-sm h-full max-h-[75vh]">
                    <ProfileCard
                        profile={topCard}
                        onSwipe={() => {}} // No-op
                        isDraggable={false}
                    />
                </div>
            </div>
            <div className="flex justify-center items-center gap-4 py-4 z-10">
                <button className="bg-white rounded-full p-3 shadow-lg disabled:opacity-50">
                    <Undo2 className="w-5 h-5 text-yellow-500" />
                </button>
                <button onClick={() => handleInteraction('disliked')} className="bg-white rounded-full p-4 shadow-lg disabled:opacity-50">
                    <X className="w-7 h-7 text-red-500" />
                </button>
                 <button onClick={() => handleInteraction('superlike')} className="bg-white rounded-full p-3 shadow-lg disabled:opacity-50">
                    <Star className="w-5 h-5 text-blue-500" />
                </button>
                <button onClick={() => handleInteraction('liked')} className="bg-white rounded-full p-4 shadow-lg disabled:opacity-50">
                    <Heart className="w-7 h-7 text-green-400" />
                </button>
                 <button className="bg-white rounded-full p-3 shadow-lg disabled:opacity-50">
                    <Zap className="w-5 h-5 text-purple-500" />
                </button>
            </div>
          </>
        ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-4">
              <h2 className="text-2xl font-bold">{t.anasayfa.outOfProfilesTitle}</h2>
              <p className="text-muted-foreground mt-2">{t.anasayfa.outOfProfilesDescription}</p>
              <Button onClick={handleReset} className="mt-6 rounded-full" size="lg">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Yeniden Başla
              </Button>
            </div>
        )}
    </div>
  );
}
