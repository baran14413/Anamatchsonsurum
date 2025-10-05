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
import { motion, AnimatePresence } from 'framer-motion';

const cardVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.8,
    rotate: direction > 0 ? 15: -15,
  }),
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.8,
    rotate: direction > 0 ? 15: -15,
    transition: {
      duration: 0.4,
      ease: 'easeIn',
    },
  }),
};

const secondCardVariants = {
    initial: {
        scale: 0.95,
        y: 20,
        opacity: 0.8,
    },
    animate: {
        scale: 1,
        y: 0,
        opacity: 1,
        transition: { duration: 0.4, ease: 'easeOut' },
    },
    exit: {
        scale: 0.95,
        y: 20,
        opacity: 0.8,
        transition: { duration: 0.4, ease: 'easeIn' },
    },
};


export default function AnasayfaPage() {
  const t = langTr;
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [direction, setDirection] = useState(0);

  const activeIndex = profiles.length > 0 ? profiles.length - 1 : 0;
  const nextCardIndex = profiles.length > 1 ? profiles.length - 2 : 0;

  const fetchProfiles = useCallback(async (options?: { resetInteractions?: boolean }) => {
    if (!user || !firestore) return;
    setIsLoading(true);

    try {
        const interactedUids = new Set<string>([user.uid]);
        
        if (!options?.resetInteractions) {
            const interactionsQuery = query(collection(firestore, 'matches'), where('users', 'array-contains', user.uid));
            const interactionsSnapshot = await getDocs(interactionsQuery);

            interactionsSnapshot.forEach(doc => {
                const usersInMatch = doc.data().users as string[];
                const otherUserId = usersInMatch.find(uid => uid !== user.uid);
                if (otherUserId) {
                    interactedUids.add(otherUserId);
                }
            });
        }
        
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
            .filter(p => p.uid && !interactedUids.has(p.uid) && p.fullName && p.images && p.images.length > 0)
            .reverse(); // Reverse to treat the array like a stack

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
    if (user && firestore && userProfile) { // Ensure userProfile is also loaded
      fetchProfiles();
    }
  }, [user, firestore, userProfile, fetchProfiles]);
  
  const removeTopCard = useCallback(() => {
    setProfiles((currentProfiles) => currentProfiles.slice(0, -1));
  }, []);


  const handleSwipe = useCallback(async (action: 'liked' | 'disliked' | 'superlike') => {
    if (profiles.length === 0) return;

    const swipedProfile = profiles[activeIndex];
    if (!user || !firestore || !swipedProfile) return;
    
    // Set swipe direction for animation
    setDirection(action === 'liked' || action === 'superlike' ? 1 : -1);

    // --- Optimistic UI Update ---
    removeTopCard();

    // --- Firestore Logic (runs in the background) ---
    const user1 = user.uid;
    const user2 = swipedProfile.uid;
    
    const matchId = [user1, user2].sort().join('_');
    const matchDocRef = doc(firestore, 'matches', matchId);

    try {
        const theirInteractionRef = doc(firestore, 'matches', [user2, user1].sort().join('_'));
        const theirInteractionSnap = await getDoc(theirInteractionRef);
        const theirInteractionData = theirInteractionSnap.data();

        const theirAction = theirInteractionData?.[`user_${user2}_action`];

        if ((action === 'liked' || action === 'superlike') && (theirAction === 'liked' || theirAction === 'superlike')) {
            
            await setDoc(matchDocRef, {
                status: 'matched',
                users: [user1, user2],
                matchDate: serverTimestamp(),
            }, { merge: true });

            const user1MatchData = {
                id: matchId,
                matchedWith: user2,
                lastMessage: t.eslesmeler.defaultMessage,
                timestamp: serverTimestamp(),
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

            toast({
                title: t.anasayfa.matchToastTitle,
                description: swipedProfile.fullName + " " + t.anasayfa.matchToastDescription,
            });

        } else {
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
  }, [user, firestore, t, toast, profiles, activeIndex, removeTopCard]);


  const handleReset = async () => {
    if (!user || !firestore) return;
    setIsLoading(true);

    try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, {
            genderPreference: 'both'
        });
        
        toast({
            title: "Filtreler Sıfırlandı",
            description: "Tüm filtreleriniz sıfırlandı, baştan başlıyoruz!",
        });

        await fetchProfiles({ resetInteractions: true });

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
  
  return (
    <div className="relative h-full w-full flex flex-col p-4">
        {isLoading ? (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : profiles.length > 0 ? (
          <>
            <div className="flex-1 flex items-center justify-center relative">
                <AnimatePresence initial={false}>
                    {profiles.length > 1 && (
                        <motion.div
                           key={profiles[nextCardIndex].uid}
                           variants={secondCardVariants}
                           initial="initial"
                           animate="animate"
                           exit="exit"
                           className="absolute w-full max-w-sm h-full max-h-[75vh]"
                        >
                            <ProfileCard
                                profile={profiles[nextCardIndex]}
                                onSwipe={() => {}}
                                isTopCard={false}
                            />
                        </motion.div>
                    )}
                    <motion.div
                        key={profiles[activeIndex].uid}
                        custom={direction}
                        variants={cardVariants}
                        initial="animate"
                        exit="exit"
                        className="absolute w-full max-w-sm h-full max-h-[75vh]"
                    >
                        <ProfileCard
                            profile={profiles[activeIndex]}
                            onSwipe={(action) => handleSwipe(action as 'liked' | 'disliked')}
                            isTopCard={true}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
            <div className="flex justify-center items-center gap-4 py-4">
                <motion.button whileHover={{ scale: 1.1 }} className="bg-white rounded-full p-3 shadow-lg">
                    <Undo2 className="w-5 h-5 text-yellow-500" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleSwipe('disliked')} className="bg-white rounded-full p-4 shadow-lg">
                    <X className="w-7 h-7 text-red-500" />
                </motion.button>
                 <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleSwipe('superlike')} className="bg-white rounded-full p-3 shadow-lg">
                    <Star className="w-5 h-5 text-blue-500" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleSwipe('liked')} className="bg-white rounded-full p-4 shadow-lg">
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
