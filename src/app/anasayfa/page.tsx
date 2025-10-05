
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RotateCcw, X, Heart, Star, Zap, Undo2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, getDoc, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';


export default function AnasayfaPage() {
  const t = langTr;
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchProfiles = useCallback(async () => {
    if (!user || !firestore) return;
    setIsLoading(true);
    
    try {
        const interactedUsers = new Set<string>([user.uid]);
        
        // Fetch all interactions the user is part of.
        const interactionsQuery = query(collection(firestore, 'matches'), where('users', 'array-contains', user.uid));
        const interactionsSnapshot = await getDocs(interactionsQuery);

        interactionsSnapshot.forEach(doc => {
            const usersInMatch = doc.data().users as string[];
            const otherUserId = usersInMatch.find(uid => uid !== user.uid);
            if (otherUserId) {
                interactedUsers.add(otherUserId);
            }
        });

        let usersQuery;
        if (userProfile?.genderPreference && userProfile.genderPreference !== 'both') {
            usersQuery = query(
                collection(firestore, 'users'),
                where('gender', '==', userProfile.genderPreference),
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
            .filter(p => p.uid && p.uid !== user.uid && !interactedUsers.has(p.uid) && p.fullName && p.images && p.images.length > 0);

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
  }, [user, firestore, toast, t.common.error, userProfile]);

  useEffect(() => {
    if (user && firestore) {
      fetchProfiles();
    }
  }, [user, firestore, fetchProfiles]);

  const handleSwipe = useCallback(async (action: 'liked' | 'disliked' | 'superlike', swipedProfile: UserProfile) => {
    if (!user || !firestore || !swipedProfile) return;
    
    // Move to next card immediately for smooth UI
    setCurrentIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= profiles.length) {
            // Reached the end, maybe show 'out of profiles' message or refetch
            // For now, we'll just stop
        }
        return nextIndex;
    });

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
        if ((action === 'liked' || action === 'superlike') && theirInteractionSnap.exists()) {
             const theirAction = theirInteractionSnap.data()?.[`user_${user2}_action`];
             if (theirAction === 'liked' || theirAction === 'superlike') {
            
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
                    profilePicture: swipedProfile.images[0]
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
             }

        } else {
             // Just record the swipe, no match yet
             await setDoc(matchDocRef, {
                users: [user1, user2],
                [`user_${user1}_action`]: action,
                [`user_${user1}_timestamp`]: serverTimestamp()
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
  }, [user, firestore, t, toast, profiles]);


  const handleReset = async () => {
    if (!user || !firestore) return;
    setIsLoading(true);

    try {
        // Reset filters in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, {
            genderPreference: 'both' // Reset to default
            // Add other filters to reset here in the future
        });
        
        toast({
            title: "Filtreler Sıfırlandı",
            description: "Tüm filtreleriniz sıfırlandı, baştan başlıyoruz!",
        });

        // Now, refetch profiles with cleared filters
        setCurrentIndex(0);
        // The fetchProfiles function will automatically use the updated userProfile
        // But we might need to manually trigger a re-render or refetch of userProfile.
        // A simple way is to just call fetchProfiles(), which relies on the hook that will update.
        await fetchProfiles();

    } catch (error) {
        console.error("Error resetting filters:", error);
        toast({
            title: "Hata",
            description: "Filtreler sıfırlanırken bir hata oluştu.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
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
          <>
            <div className="flex-1 flex items-center justify-center">
                <ProfileCard
                    key={activeProfile.uid}
                    profile={activeProfile}
                    onSwipe={(action) => handleSwipe(action, activeProfile)}
                />
            </div>
            <div className="flex justify-center items-center gap-4 py-4">
                <motion.button whileHover={{ scale: 1.1 }} className="bg-white rounded-full p-3 shadow-lg">
                    <Undo2 className="w-5 h-5 text-yellow-500" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleSwipe('disliked', activeProfile)} className="bg-white rounded-full p-4 shadow-lg">
                    <X className="w-7 h-7 text-red-500" />
                </motion.button>
                 <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleSwipe('superlike', activeProfile)} className="bg-white rounded-full p-3 shadow-lg">
                    <Star className="w-5 h-5 text-blue-500" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleSwipe('liked', activeProfile)} className="bg-white rounded-full p-4 shadow-lg">
                    <Heart className="w-7 h-7 text-green-400" />
                </motion.button>
                 <motion.button whileHover={{ scale: 1.1 }} className="bg-white rounded-full p-3 shadow-lg">
                    <Zap className="w-5 h-5 text-purple-500" />
                </motion.button>
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
