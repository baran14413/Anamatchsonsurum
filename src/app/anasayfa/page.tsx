
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, limit, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import { AnimatePresence, motion } from 'framer-motion';
import ProfileCard from '@/components/profile-card';
import { getDistance } from '@/lib/utils';
import { langTr } from '@/languages/tr';
import type { Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';

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
        const usersRef = collection(firestore, 'users');
        let q = query(usersRef, limit(50));

        const usersSnapshot = await getDocs(q);

        let interactedUids = new Set<string>();
        if (!ignoreFilters) {
            const interactedMatchDocsSnap = await getDocs(collection(firestore, 'matches'));
            interactedMatchDocsSnap.forEach(doc => {
                const match = doc.data();
                if (match.user1Id === user.uid && match.user1_action) {
                    interactedUids.add(match.user2Id);
                } else if (match.user2Id === user.uid && match.user2_action) {
                    interactedUids.add(match.user1Id);
                }
            });
        }
        
        const fetchedProfiles = usersSnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
            .filter(p => {
                if (!p.uid || !p.images || p.images.length === 0 || !p.fullName) return false;
                if (p.uid === user.uid) return false;
                if (!ignoreFilters && interactedUids.has(p.uid)) return false; 
                 if (p.isBot) return true; 

                if (userProfile.location && p.location) {
                    p.distance = getDistance(
                        userProfile.location.latitude!,
                        userProfile.location.longitude!,
                        p.location.latitude!,
                        p.location.longitude!
                    );
                } else {
                    p.distance = undefined;
                }
                
                if (!ignoreFilters) {
                     if (userProfile.globalModeEnabled === false && p.distance !== undefined) {
                         if (p.distance > (userProfile.distancePreference || 160)) {
                             return false;
                         }
                     }
                      if(userProfile.ageRange) {
                         const age = new Date().getFullYear() - new Date(p.dateOfBirth!).getFullYear();
                         if (age < userProfile.ageRange.min || age > userProfile.ageRange.max) {
                             if(!userProfile.expandAgeRange){
                                 return false;
                             }
                         }
                     }
                }

                return true;
            });

        setProfiles(fetchedProfiles.sort(() => Math.random() - 0.5));
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

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    if (user && firestore && userProfile && !isUserLoading) {
      fetchProfiles(firestore, user, userProfile, setProfiles, setIsLoading, toast, false);
    } else if (!isUserLoading) {
        setIsLoading(false);
    }
  }, [user, firestore, userProfile, isUserLoading, toast]);


  const handleSwipe = useCallback(async (profileToSwipe: UserProfile, direction: 'left' | 'right') => {
    if (!user || !firestore || !profileToSwipe || !userProfile) return;
    
    setProfiles(prev => prev.filter(p => p.uid !== profileToSwipe.uid));
    
    if (profileToSwipe.isBot) {
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
        const action = direction === 'right' ? 'liked' : 'disliked';
        const sortedIds = [user.uid, profileToSwipe.uid].sort();
        const matchId = sortedIds.join('_');
        const matchDocRef = doc(firestore, 'matches', matchId);

        const matchDoc = await getDoc(matchDocRef);
        let matchData: any = matchDoc.exists() ? matchDoc.data() : {};

        const user1IsCurrentUser = user.uid === sortedIds[0];
        
        const otherUserKey = user1IsCurrentUser ? 'user2_action' : 'user1_action';
        const otherUserAction = matchData[otherUserKey];

        const isMatch = (action === 'liked' && (otherUserAction === 'liked' || otherUserAction === 'superliked'));

        const updateData: any = {
            id: matchId,
            user1Id: sortedIds[0],
            user2Id: sortedIds[1],
            status: isMatch ? 'matched' : (matchData.status || 'pending'),
        };

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
        
        if (profileToSwipe.uid) {
            const otherUserInteractionRef = doc(firestore, `users/${profileToSwipe.uid}/matches`, matchId);
            await setDoc(otherUserInteractionRef, { 
                id: matchId,
                matchedWith: user.uid, 
                status: isMatch ? 'matched' : (matchData.status || 'pending'),
                timestamp: serverTimestamp(),
                fullName: userProfile?.fullName,
                profilePicture: userProfile?.profilePicture || userProfile?.images?.[0]?.url || '',
                lastMessage: isMatch ? langTr.eslesmeler.defaultMessage : '',
            }, { merge: true });
        }

        if (isMatch) {
            toast({
                title: langTr.anasayfa.matchToastTitle,
                description: `${profileToSwipe.fullName} ${langTr.anasayfa.matchToastDescription}`
            })
        }

    } catch (error: any) {
        console.error(`Error handling ${direction}:`, error);
        setProfiles(prev => [profileToSwipe, ...prev]);
    }

  }, [user, firestore, toast, userProfile]);

  if (isLoading || isUserLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
      </div>
    );
  }

  const handleRetry = () => {
      if (user && firestore && userProfile) {
        fetchProfiles(firestore, user, userProfile, setProfiles, setIsLoading, toast, true);
      }
  }
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 pt-0 overflow-hidden">
      <div className="relative w-full h-full max-w-md flex items-center justify-center">
          <AnimatePresence>
          {profiles.length > 0 ? (
            profiles.map((profile, index) => {
              const isTopCard = index === profiles.length - 1;
              return (
                <motion.div
                  key={profile.uid}
                  className="absolute w-full h-full"
                  drag={isTopCard ? "x" : false}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  onDragEnd={(event, { offset, velocity }) => {
                    if (!isTopCard) return;

                    const swipePower = Math.abs(offset.x) * velocity.x;
                    const swipeConfidenceThreshold = 10000;
                    
                    if (swipePower < -swipeConfidenceThreshold) {
                      setExitDirection('left');
                      handleSwipe(profile, 'left');
                    } else if (swipePower > swipeConfidenceThreshold) {
                      setExitDirection('right');
                      handleSwipe(profile, 'right');
                    }
                  }}
                  initial={{ scale: 1, y: 0, opacity: 1 }}
                  animate={{
                    scale: 1 - (profiles.length - 1 - index) * 0.05,
                    y: (profiles.length - 1 - index) * 10,
                    opacity: 1
                  }}
                  exit={{
                    opacity: 0,
                    x: exitDirection === 'left' ? -500 : 500,
                    rotate: exitDirection === 'left' ? -30 : 30,
                    transition: { duration: 0.3 }
                  }}
                  dragElastic={0.5}
                >
                  <ProfileCard profile={profile} />
                </motion.div>
              );
            })
          ) : (
            <motion.div 
              className="flex flex-col items-center justify-center text-center p-4 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3 className="text-2xl font-bold">Çevrendeki Herkes Tükendi!</h3>
              <p className="text-muted-foreground">
                Daha sonra tekrar kontrol et veya arama ayarlarını genişlet.
              </p>
              <Button onClick={handleRetry}>Tekrar Dene</Button>
            </motion.div>
          )}
          </AnimatePresence>
      </div>
    </div>
  );
}

    