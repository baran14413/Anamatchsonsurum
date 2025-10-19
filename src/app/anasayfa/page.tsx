'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, doc, getDoc, collectionGroup, QueryConstraint, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDistance } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import ProfileCard from '@/components/profile-card';

type ProfileWithDistance = UserProfile & { distance?: number };

const SWIPE_THRESHOLD = 80;

export default function AnasayfaPage() {
  const t = langTr;
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<ProfileWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    if (!user || !firestore || !userProfile) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setProfiles([]);

    try {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, limit(50));
        const usersSnapshot = await getDocs(q);
        
        const matchesSnap = await getDocs(collection(firestore, `users/${user.uid}/matches`));
        const interactedUids = new Set(matchesSnap.docs.map(d => d.id));

        const allFetchedUsers = usersSnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
            .filter(p => {
                if (p.uid === user.uid) return false; // Exclude self
                if (interactedUids.has(p.id)) return false; // Exclude already interacted
                if (!p.images || p.images.length === 0) return false;

                // Gender preference filter
                const userGender = userProfile.gender;
                const userPref = userProfile.genderPreference;
                const profileGender = p.gender;

                if (userPref === 'both') return true;
                if (userPref === 'male' && profileGender === 'male') return true;
                if (userPref === 'female' && profileGender === 'female') return true;

                return false;
            })
            .map(p => {
                let distance: number | undefined = undefined;
                if (userProfile.location?.latitude && userProfile.location?.longitude && p.location?.latitude && p.location?.longitude) {
                    distance = getDistance(userProfile.location.latitude, userProfile.location.longitude, p.location.latitude, p.location.longitude);
                }
                return { ...p, distance };
            })
            .filter(p => {
                // Apply distance filter
                if (userProfile.globalModeEnabled) {
                    return true;
                }
                if (p.distance === undefined) {
                    return false;
                }
                if (userProfile.distancePreference && p.distance > userProfile.distancePreference) {
                    return false;
                }
                return true;
            });


        setProfiles(allFetchedUsers);

    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({ title: t.common.error, description: "Profiller getirilemedi.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore, userProfile, toast, t]);


  useEffect(() => {
    if (user && firestore && userProfile) {
      fetchProfiles();
    }
  }, [user, firestore, userProfile, fetchProfiles]);

  const removeTopCard = () => {
    setProfiles(prev => prev.slice(1));
  };
  
  const handleSwipe = async (direction: 'left' | 'right' | 'up', swipedProfile: UserProfile) => {
    if (!user || !firestore) return;

    removeTopCard();

    const action = direction === 'right' ? 'liked' : direction === 'up' ? 'superliked' : 'disliked';
    const [user1Id, user2Id] = [user.uid, swipedProfile.uid].sort();
    const matchId = `${user1Id}_${user2Id}`;
    const matchDocRef = doc(firestore, 'matches', matchId);

    try {
        const matchDoc = await getDoc(matchDocRef);
        let status = 'pending';
        let isMatch = false;

        const updateData: any = {
            user1Id: user1Id,
            user2Id: user2Id,
        };

        if (user.uid === user1Id) {
            updateData.user1_action = action;
            updateData.user1_timestamp = serverTimestamp();
            if (matchDoc.exists() && (matchDoc.data().user2_action === 'liked' || matchDoc.data().user2_action === 'superliked') && action === 'liked') {
                isMatch = true;
                status = 'matched';
            }
        } else { // user.uid === user2Id
            updateData.user2_action = action;
            updateData.user2_timestamp = serverTimestamp();
            if (matchDoc.exists() && (matchDoc.data().user1_action === 'liked' || matchDoc.data().user1_action === 'superliked') && action === 'liked') {
                isMatch = true;
                status = 'matched';
            }
        }
        
        updateData.status = status;
        if(isMatch) {
          updateData.matchDate = serverTimestamp();
        }

        await setDoc(matchDocRef, updateData, { merge: true });

        // Denormalize for both users' subcollections
        const currentUserMatchRef = doc(firestore, `users/${user.uid}/matches`, matchId);
        await setDoc(currentUserMatchRef, {
            id: matchId,
            matchedWith: swipedProfile.uid,
            status: status,
            fullName: swipedProfile.fullName,
            profilePicture: swipedProfile.profilePicture,
            lastMessage: isMatch ? "Eşleştiniz! Bir merhaba de." : `Beğendin`,
            timestamp: serverTimestamp(),
            unreadCount: isMatch ? 1 : 0
        }, {merge: true});

        if (isMatch) {
            toast({ title: t.anasayfa.matchToastTitle, description: `${swipedProfile.fullName} ${t.anasayfa.matchToastDescription}` });
            const otherUserMatchRef = doc(firestore, `users/${swipedProfile.uid}/matches`, matchId);
             await setDoc(otherUserMatchRef, {
                id: matchId,
                matchedWith: user.uid,
                status: status,
                fullName: userProfile?.fullName,
                profilePicture: userProfile?.profilePicture,
                lastMessage: "Yeni bir eşleşmen var!",
                timestamp: serverTimestamp(),
                unreadCount: 1,
            }, {merge: true});
        }

    } catch (error) {
        console.error("Error handling swipe action:", error);
    }
  };


  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center">
          <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
        </div>
      ) : profiles.length > 0 ? (
        <div className="relative w-full h-[600px] max-w-md max-h-[85vh] flex items-center justify-center">
            <AnimatePresence>
                {profiles.map((profile, index) => {
                    const isTopCard = index === profiles.length - 1;
                    const safeProfile = {
                        ...profile,
                        fullName: profile.fullName || "İsimsiz Kullanıcı",
                        gender: profile.gender || "other",
                        images: profile.images || []
                    };
                    return (
                        <motion.div
                            key={safeProfile.uid}
                            className="absolute w-full h-full"
                            style={{
                                zIndex: index,
                                transform: `scale(${1 - ((profiles.length - 1 - index) * 0.03)}) translateY(${(profiles.length - 1 - index) * 10}px)`,
                            }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            onDragEnd={(event, info: PanInfo) => {
                                if (!isTopCard) return;
                                if (info.offset.x > SWIPE_THRESHOLD) {
                                  handleSwipe('right', safeProfile);
                                } else if (info.offset.x < -SWIPE_THRESHOLD) {
                                  handleSwipe('left', safeProfile);
                                }
                            }}
                            animate={{ 
                                x: 0, 
                                y: (profiles.length - 1 - index) * 10,
                                scale: 1 - ((profiles.length - 1 - index) * 0.03),
                                opacity: 1 
                            }}
                             initial={{ scale: 0.95, y: 30, opacity: 0 }}
                             exit={ (custom) => ({
                                x: custom.direction === 'right' ? 300 : -300,
                                opacity: 0,
                                transition: { duration: 0.3 }
                            })}
                            custom={{ direction: 'left' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            <ProfileCard 
                              profile={safeProfile}
                              isTopCard={isTopCard} 
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-4 space-y-4">
          <h3 className="text-2xl font-bold">{t.anasayfa.outOfProfilesTitle}</h3>
          <p className="text-muted-foreground">{t.anasayfa.outOfProfilesDescription}</p>
          <Button onClick={fetchProfiles}>
            Tekrar Dene
          </Button>
        </div>
      )}
    </div>
  );
}
