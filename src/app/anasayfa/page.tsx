'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Undo, X, Star, Heart, Send, Loader2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import ProfileCard from '@/components/profile-card';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

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
        // 1. Get IDs of users the current user has already interacted with.
        const interactionsQuery1 = query(collection(firestore, 'matches'), where('user1Id', '==', user.uid));
        const interactionsQuery2 = query(collection(firestore, 'matches'), where('user2Id', '==', user.uid));
        
        const [interactionsSnapshot1, interactionsSnapshot2] = await Promise.all([
          getDocs(interactionsQuery1),
          getDocs(interactionsQuery2)
        ]);

        const interactedUserIds = new Set<string>();
        interactionsSnapshot1.forEach(doc => {
            interactedUserIds.add(doc.data().user2Id);
        });
        interactionsSnapshot2.forEach(doc => {
            interactedUserIds.add(doc.data().user1Id);
        });

        // 2. Fetch all users from the 'users' collection.
        const allUsersSnapshot = await getDocs(collection(firestore, 'users'));

        // 3. Filter out the current user and users who have been interacted with.
        const potentialMatches: UserProfile[] = [];
        allUsersSnapshot.forEach(doc => {
            const userData = doc.data() as Omit<UserProfile, 'id'>;
            // Ensure the user is not the current user and has not been interacted with
            // and has a valid UID and images array.
            if (userData.uid && userData.uid !== user.uid && !interactedUserIds.has(userData.uid)) {
                potentialMatches.push({
                    id: doc.id,
                    ...userData,
                    images: userData.images || [], // Ensure images is always an array
                } as UserProfile);
            }
        });
        
        // 4. Shuffle for randomness
        const shuffledMatches = potentialMatches.sort(() => 0.5 - Math.random());
        setProfiles(shuffledMatches);

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
    }
    
    if (user && firestore) {
      fetchProfiles();
    }
  }, [user, firestore, toast, t.common.error]);

  const recordSwipe = async (swipedProfile: UserProfile, direction: 'left' | 'right') => {
    if (!user || !firestore || !swipedProfile.uid) return;

    try {
        const currentUserId = user.uid;
        const swipedUserId = swipedProfile.uid;

        // Use a consistent ID generation for the match document
        const matchId = [currentUserId, swipedUserId].sort().join('_');
        const matchRef = doc(firestore, 'matches', matchId);
        
        if (direction === 'right') {
            // Check if the other user has already liked the current user.
            const otherUserSwipeDoc = await getDoc(matchRef);

            if (otherUserSwipeDoc.exists() && otherUserSwipeDoc.data()?.user2Id === swipedUserId && otherUserSwipeDoc.data()?.status === 'liked') {
                // It's a match! The other user liked us, and we are liking them back.
                 await setDoc(matchRef, { 
                    ...otherUserSwipeDoc.data(),
                    status: 'matched',
                    matchDate: serverTimestamp() 
                }, { merge: true });

                const matchDataForSubcollection = {
                    id: matchId,
                    users: [currentUserId, swipedUserId].sort(),
                    matchDate: serverTimestamp(),
                    // You can add other relevant info here like names and pictures for the chat list
                };
                const currentUserMatchRef = doc(firestore, `users/${currentUserId}/matches/${matchId}`);
                const otherUserMatchRef = doc(firestore, `users/${swipedUserId}/matches/${matchId}`);
                
                await setDoc(currentUserMatchRef, matchDataForSubcollection);
                await setDoc(otherUserMatchRef, matchDataForSubcollection);
                
                toast({
                    title: t.anasayfa.matchToastTitle,
                    description: t.anasayfa.matchToastDescription
                });

            } else {
                // First "like" in this pair.
                await setDoc(matchRef, {
                    id: matchId,
                    user1Id: currentUserId,
                    user2Id: swipedUserId,
                    status: 'liked',
                    timestamp: serverTimestamp(),
                }, { merge: true });
            }
        } else { // 'left' swipe (dislike)
             await setDoc(matchRef, {
                id: matchId,
                // To track who disliked whom, you can be more specific
                user1Id: currentUserId, 
                user2Id: swipedUserId,
                status: 'disliked',
                timestamp: serverTimestamp(),
            }, { merge: true });
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
