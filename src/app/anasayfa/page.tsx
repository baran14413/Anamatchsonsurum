
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { langTr } from '@/languages/tr';
import type { UserProfile, Match } from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, doc, getDoc, setDoc, serverTimestamp, QueryConstraint } from 'firebase/firestore';
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
        const queryConstraints: QueryConstraint[] = [where('isBot', '!=', true), limit(50)];
        
        const genderPref = userProfile.genderPreference;
        if (genderPref && genderPref !== 'both') {
            queryConstraints.push(where('gender', '==', genderPref));
        }
        
        const q = query(usersRef, ...queryConstraints);
        const usersSnapshot = await getDocs(q);

        const matchesSnap = await getDocs(collection(firestore, `users/${user.uid}/matches`));
        const interactedUids = new Set(matchesSnap.docs.map(d => d.id.replace(user.uid, '').replace('_', '')));

        const allFetchedUsers = usersSnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
            .filter(p => {
                if (p.uid === user.uid) return false; // Exclude self
                if (interactedUids.has(p.id)) return false;
                
                // Age preference filter
                const age = p.dateOfBirth ? new Date(Date.now() - new Date(p.dateOfBirth).getTime()).getUTCFullYear() - 1970 : 0;
                if(userProfile.ageRange && (age < userProfile.ageRange.min || age > userProfile.ageRange.max)) {
                    return false;
                }

                return true;
            })
            .map(p => {
                let distance: number | undefined = undefined;
                if (userProfile.location?.latitude && userProfile.location?.longitude && p.location?.latitude && p.location?.longitude) {
                    distance = getDistance(userProfile.location.latitude, userProfile.location.longitude, p.location.latitude, p.location.longitude);
                }
                return { ...p, distance };
            })
            .filter(p => {
                // Apply distance filter only if global mode is off
                if (!userProfile.globalModeEnabled && p.distance !== undefined && userProfile.distancePreference && p.distance > userProfile.distancePreference) {
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
    setProfiles(prev => prev.slice(0, prev.length - 1));
  };
  
 const handleSwipe = async (direction: 'left' | 'right' | 'up', swipedProfile: UserProfile) => {
    if (!user || !firestore || !userProfile) return;

    removeTopCard();

    const action = direction === 'right' ? 'liked' : direction === 'up' ? 'superliked' : 'disliked';
    const [user1Id, user2Id] = [user.uid, swipedProfile.uid].sort();
    const matchId = `${user1Id}_${user2Id}`;
    const matchDocRef = doc(firestore, 'matches', matchId);

    try {
        const matchDoc = await getDoc(matchDocRef);
        let status: Match['status'] = 'pending';
        let isMatch = false;

        const updateData: Partial<Match> = {
            id: matchId,
            user1Id: user1Id,
            user2Id: user2Id,
        };

        const isUser1 = user.uid === user1Id;
        if (isUser1) {
            updateData.user1_action = action;
            updateData.user1_timestamp = serverTimestamp();
            if (matchDoc.exists() && (matchDoc.data().user2_action === 'liked' || matchDoc.data().user2_action === 'superliked') && (action === 'liked' || action === 'superliked')) {
                isMatch = true;
            }
        } else { // user.uid === user2Id
            updateData.user2_action = action;
            updateData.user2_timestamp = serverTimestamp();
            if (matchDoc.exists() && (matchDoc.data().user1_action === 'liked' || matchDoc.data().user1_action === 'superliked') && (action === 'liked' || action === 'superliked')) {
                isMatch = true;
            }
        }

        if (isMatch) {
            status = 'matched';
            updateData.matchDate = serverTimestamp();
        } else if (action === 'superliked') {
            status = 'superlike_pending';
            updateData.isSuperLike = true;
            updateData.superLikeInitiator = user.uid;
        }
        
        updateData.status = status;

        await setDoc(matchDocRef, updateData, { merge: true });

        const lastMessage = isMatch ? "Eşleştiniz! Bir merhaba de." : (action === 'liked' ? 'Beğendin' : 'Pas geçtin');
        
        const currentUserMatchRef = doc(firestore, `users/${user.uid}/matches`, matchId);
        await setDoc(currentUserMatchRef, {
            id: matchId,
            matchedWith: swipedProfile.uid,
            status: status,
            fullName: swipedProfile.fullName,
            profilePicture: swipedProfile.profilePicture,
            lastMessage: lastMessage,
            timestamp: serverTimestamp(),
            unreadCount: isMatch ? 1 : 0,
            isSuperLike: action === 'superliked',
            superLikeInitiator: action === 'superliked' ? user.uid : undefined
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
        
        if (status === 'superlike_pending') {
             const otherUserMatchRef = doc(firestore, `users/${swipedProfile.uid}/matches`, matchId);
             await setDoc(otherUserMatchRef, {
                id: matchId,
                matchedWith: user.uid,
                status: status,
                fullName: userProfile?.fullName,
                profilePicture: userProfile?.profilePicture,
                lastMessage: `${userProfile.fullName} sana Super Like gönderdi!`,
                timestamp: serverTimestamp(),
                isSuperLike: true,
                superLikeInitiator: user.uid
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

