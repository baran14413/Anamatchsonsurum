'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Undo, X, Star, Heart, Send, Loader2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import ProfileCard from '@/components/profile-card';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, getDocs, setDoc, getDoc, serverTimestamp, query, where, writeBatch } from 'firebase/firestore';

export default function AnasayfaPage() {
  const t = langTr;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      if (!user || !firestore) return;

      setIsLoading(true);
      try {
        // 1. Get all users except the current one
        const allUsersQuery = query(collection(firestore, 'users'), where('uid', '!=', user.uid));
        const allUsersSnapshot = await getDocs(allUsersQuery);
        const allUsers = allUsersSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
            .filter(profile => profile.uid); // Ensure it's a valid profile

        // 2. Get all interactions (likes, dislikes, matches) involving the current user
        const interactionsQuery1 = query(collection(firestore, 'matches'), where('user1Id', '==', user.uid));
        const interactionsQuery2 = query(collection(firestore, 'matches'), where('user2Id', '==', user.uid));
        
        const [interactions1Snapshot, interactions2Snapshot] = await Promise.all([
            getDocs(interactionsQuery1),
            getDocs(interactionsQuery2)
        ]);

        const interactedUserIds = new Set<string>();
        interactions1Snapshot.forEach(doc => interactedUserIds.add(doc.data().user2Id));
        interactions2Snapshot.forEach(doc => interactedUserIds.add(doc.data().user1Id));

        // 3. Filter out users the current user has already interacted with
        const potentialMatches = allUsers.filter(profile => !interactedUserIds.has(profile.uid));
        
        // 4. Shuffle for randomness
        const shuffledMatches = potentialMatches.sort(() => 0.5 - Math.random());
        
        setProfiles(shuffledMatches);

      } catch (error) {
        console.error("Error fetching profiles from Firestore:", error);
        toast({
            title: t.common.error,
            description: "Potansiyel eşleşmeler getirilemedi.",
            variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfiles();
  }, [user, firestore, toast, t.common.error]);

  const recordSwipe = async (swipedProfile: UserProfile, direction: 'left' | 'right') => {
    if (!user || !firestore || !swipedProfile.uid) return;

    try {
        const swipeId = [user.uid, swipedProfile.uid].sort().join('_');
        const swipeDocRef = doc(firestore, `matches/${swipeId}`);

        if (direction === 'right') {
            const otherUserSwipeId = [swipedProfile.uid, user.uid].sort().join('_');
            const otherUserSwipeDocRef = doc(firestore, `matches/${otherUserSwipeId}`);
            const otherUserSwipeDoc = await getDoc(otherUserSwipeDocRef);

            if (otherUserSwipeDoc.exists() && otherUserSwipeDoc.data()?.user1Id === swipedProfile.uid && otherUserSwipeDoc.data()?.status === 'liked') {
                // It's a match!
                const batch = writeBatch(firestore);
                const matchDate = serverTimestamp();
                const [user1Id, user2Id] = [user.uid, swipedProfile.uid].sort();

                const matchData = {
                    id: swipeId,
                    user1Id,
                    user2Id,
                    matchDate: matchDate,
                    users: [user.uid, swipedProfile.uid],
                    status: 'matched',
                };
                
                // Update the match document in the root collection
                batch.set(swipeDocRef, matchData, { merge: true });

                // Create/update match documents in both users' subcollections
                const user1MatchRef = doc(firestore, `users/${user1Id}/matches/${swipeId}`);
                const user2MatchRef = doc(firestore, `users/${user2Id}/matches/${swipeId}`);
                batch.set(user1MatchRef, matchData);
                batch.set(user2MatchRef, matchData);

                await batch.commit();

                toast({
                    title: t.anasayfa.matchToastTitle,
                    description: t.anasayfa.matchToastDescription
                });
            } else {
                 // First "like"
                await setDoc(swipeDocRef, {
                    user1Id: user.uid,
                    user2Id: swipedProfile.uid,
                    status: 'liked',
                    timestamp: serverTimestamp(),
                });
            }
        } else {
            // Dislike
            await setDoc(swipeDocRef, {
                user1Id: user.uid,
                user2Id: swipedProfile.uid,
                status: 'disliked',
                timestamp: serverTimestamp(),
            });
        }
    } catch (error) {
        console.error('Error recording swipe:', error);
         toast({
            title: t.common.error,
            description: "Kaydırma işlemi kaydedilemedi.",
            variant: "destructive"
        });
    }
  };
  
  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentIndex < profiles.length) {
      const swipedProfile = profiles[currentIndex];
      recordSwipe(swipedProfile, direction);
      
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  };

  const currentProfile = !isLoading && currentIndex < profiles.length ? profiles[currentIndex] : null;

  return (
    <div className="flex-1 flex flex-col bg-gray-100 dark:bg-black overflow-hidden">
        <div className="relative flex-1">
            <AnimatePresence>
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : currentProfile ? (
                    <ProfileCard
                        key={currentProfile.id}
                        profile={currentProfile}
                        onSwipe={handleSwipe}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                        <h2 className="text-2xl font-bold">{t.anasayfa.outOfProfilesTitle}</h2>
                        <p className="text-muted-foreground mt-2">{t.anasayfa.outOfProfilesDescription}</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
        
        <div className="px-4 z-20 shrink-0">
            <div className="flex justify-around items-center h-20 max-w-md mx-auto">
                <button className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-yellow-500 hover:bg-gray-100 transition-transform transform hover:scale-110">
                    <Undo size={24} />
                </button>
                 <button 
                    onClick={() => handleSwipe('left')}
                    className="h-14 w-14 rounded-full bg-white shadow-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-transform transform hover:scale-110 disabled:opacity-50"
                    disabled={!currentProfile}>
                    <X size={36} />
                </button>
                <button className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-transform transform hover:scale-110">
                    <Star size={24} />
                </button>
                <button
                    onClick={() => handleSwipe('right')}
                    className="h-14 w-14 rounded-full bg-white shadow-lg flex items-center justify-center text-green-500 hover:bg-green-50 transition-transform transform hover:scale-110 disabled:opacity-50"
                    disabled={!currentProfile}>
                    <Heart size={32} />
                </button>
                 <button className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-sky-500 hover:bg-sky-50 transition-transform transform hover:scale-110">
                    <Send size={24} />
                </button>
            </div>
        </div>
    </div>
  );
}
