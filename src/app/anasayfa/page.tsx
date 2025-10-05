
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, getDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';
import { Button } from '@/components/ui/button';

export default function AnasayfaPage() {
  const t = langTr;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [seenUserIds, setSeenUserIds] = useState<Set<string>>(new Set());

  const fetchProfiles = useCallback(async () => {
    if (!user || !firestore) return;
    setIsLoading(true);
    
    try {
        const usersQuery = query(
            collection(firestore, 'users'),
            where('uid', '!=', user.uid),
            limit(20)
        );

        const querySnapshot = await getDocs(usersQuery);
        
        let fetchedProfiles = querySnapshot.docs
          .map(doc => ({ ...doc.data(), id: doc.id } as UserProfile))
          .filter(p => p.images && p.images.length > 0);

        // Filter out profiles that have already been swiped in this session
        fetchedProfiles = fetchedProfiles.filter(p => !seenUserIds.has(p.uid));

        setProfiles(fetchedProfiles);
        setCurrentIndex(0);

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
  }, [user, firestore, toast, t.common.error, seenUserIds]);

  useEffect(() => {
    fetchProfiles();
  }, [user]); // Only fetch on user change initially

  const handleSwipe = useCallback(async (action: 'liked' | 'disliked' | 'superlike', swipedProfile: UserProfile) => {
    if (!user || !firestore) return;

    // Add to seen list for this session
    setSeenUserIds(prev => new Set(prev).add(swipedProfile.uid));

    // Move to next card immediately for smooth UI
    setCurrentIndex(prev => prev + 1);

    // --- Firestore Logic ---
    const user1 = user.uid;
    const user2 = swipedProfile.uid;
    
    // Create a consistent ID for the match document
    const matchId = [user1, user2].sort().join('_');
    const matchDocRef = doc(firestore, 'matches', matchId);

    try {
        const theirInteractionRef = doc(firestore, 'matches', [user2, user1].sort().join('_'));
        const theirInteractionSnap = await getDoc(theirInteractionRef);

        // If they liked us and we just liked them = MATCH
        if (action === 'liked' && theirInteractionSnap.exists() && theirInteractionSnap.data()?.status === 'liked') {
            
            // 1. Update the central match document
            await setDoc(matchDocRef, {
                status: 'matched',
                users: [user1, user2],
                matchDate: serverTimestamp(),
            }, { merge: true });

            // 2. Create denormalized match entries for both users for easy querying
            const user1MatchData = {
                id: matchId,
                matchedWith: user2,
                lastMessage: t.eslesmeler.defaultMessage,
                timestamp: serverTimestamp(),
                // Include other user's info for chat list
                fullName: swipedProfile.fullName,
                profilePicture: swipedProfile.profilePicture
            };
             const currentUserData = {
                id: matchId,
                matchedWith: user1,
                lastMessage: t.eslesmeler.defaultMessage,
                timestamp: serverTimestamp(),
                fullName: user.displayName,
                profilePicture: user.photoURL
            };

            await setDoc(doc(firestore, `users/${user1}/matches`, matchId), user1MatchData);
            await setDoc(doc(firestore, `users/${user2}/matches`, matchId), currentUserData);


            // 3. Notify user of the new match
            toast({
                title: t.anasayfa.matchToastTitle,
                description: swipedProfile.fullName + " " + t.anasayfa.matchToastDescription,
            });

        } else {
             // Just record the swipe, no match yet
             await setDoc(matchDocRef, {
                status: action,
                [user1]: action, // Records who did what
                users: [user1, user2],
                timestamp: serverTimestamp()
            }, { merge: true });
        }
    } catch (error) {
        console.error(`Error handling ${action}:`, error);
        toast({
            title: t.common.error,
            description: "Etkileşim kaydedilemedi.",
            variant: "destructive"
        })
    }
  }, [user, firestore, t, toast]);


  const handleReset = () => {
    setIsLoading(true);
    setSeenUserIds(new Set()); // Clear the seen list
    // Refetch all profiles by calling the memoized function again
    // To do this, we need to make `fetchProfiles` depend on a value that we can change.
    // A simple way is to just call it directly.
    fetchProfiles();
  };
  
  const activeProfile = !isLoading && profiles.length > 0 && currentIndex < profiles.length 
    ? profiles[currentIndex] 
    : null;

  return (
    <div className="relative h-full w-full flex flex-col p-4">
        {isLoading ? (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : activeProfile ? (
          <div className="relative w-full h-full flex items-center justify-center">
              <ProfileCard
                  key={activeProfile.uid}
                  profile={activeProfile}
                  onSwipe={handleSwipe}
              />
          </div>
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

    