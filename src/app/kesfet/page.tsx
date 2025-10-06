
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, setDoc, getDoc, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { Icons } from '@/components/icons';
import { langTr } from '@/languages/tr';
import { RefreshCw, MapPin, Heart, X, Star, ChevronUp, PartyPopper, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDistance, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

type ProfileWithAgeAndDistance = UserProfile & { age?: number; distance?: number };

const calculateAge = (dateString?: string): number | null => {
    if (!dateString) return null;
    const birthDate = new Date(dateString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const SWIPE_THRESHOLD = -80;

// Component for a single profile in the discovery feed
function DiscoveryProfileItem({ 
    profile, 
    isPriority, 
    onAction,
}: { 
    profile: ProfileWithAgeAndDistance, 
    isPriority: boolean, 
    onAction: (action: 'liked' | 'disliked' | 'superliked') => void, 
}) {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const [actionFeedback, setActionFeedback] = useState<'liked' | 'superliked' | 'disliked' | null>(null);
    
    const y = useMotionValue(0);
    const opacity = useTransform(y, [0, SWIPE_THRESHOLD * 2], [1, 0]);
    const dislikeOpacity = useTransform(y, [0, SWIPE_THRESHOLD], [0, 1]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y < SWIPE_THRESHOLD) {
             triggerAction('disliked');
        }
    };
    
    const triggerAction = (action: 'liked' | 'disliked' | 'superliked') => {
        setActionFeedback(action);
        setTimeout(() => {
            onAction(action);
        }, 300); // Wait for animation to be visible
    };

    useEffect(() => {
        setActiveImageIndex(0);
    }, [profile.uid]);

    const handleNextImage = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (profile.images && profile.images.length > 1) {
            setActiveImageIndex((prev) => (prev + 1) % profile.images.length);
        }
    }, [profile.images]);

    const handlePrevImage = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (profile.images && profile.images.length > 1) {
            setActiveImageIndex((prev) => (prev - 1 + profile.images.length) % profile.images.length);
        }
    }, [profile.images]);

    const currentImage = profile.images?.[activeImageIndex];
    const hasMultipleImages = profile.images && profile.images.length > 1;

    return (
        <div ref={ref} className="h-full w-full snap-start flex-shrink-0 relative">
             <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 z-10 pointer-events-none"
                style={{ opacity: dislikeOpacity }}
                animate={actionFeedback === 'disliked' ? { opacity: 1, scale: [1, 1.2, 1], rotate: 0 } : {}}
            >
                <X className="h-28 w-28" strokeWidth={3} />
            </motion.div>

            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-400 z-10 pointer-events-none"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={actionFeedback === 'liked' ? { opacity: 1, scale: [1, 1.2, 1], rotate: 15 } : {}}
            >
                <Heart className="h-28 w-28 fill-current" strokeWidth={1} />
            </motion.div>

            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 z-10 pointer-events-none"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={actionFeedback === 'superliked' ? { opacity: 1, scale: [1, 1.2, 1] } : {}}
            >
                <Star className="h-28 w-28 fill-current" strokeWidth={1.5} />
            </motion.div>
            
            <motion.div 
                className="w-full h-full" 
                drag="y" 
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.5}
                onDragEnd={handleDragEnd}
                style={{ y, opacity }}
            >
                <div className="absolute inset-0">
                   {currentImage?.url && (
                        <Image
                            src={currentImage.url}
                            alt={profile.fullName || 'Profile'}
                            fill
                            style={{ objectFit: 'cover' }}
                            priority={isPriority}
                        />
                    )}
                </div>

                {hasMultipleImages && (
                    <>
                        <div className='absolute top-2 left-2 right-2 flex gap-1 z-10'>
                            {profile.images.map((img, index) => (
                                <div key={index} className='h-1 flex-1 rounded-full bg-white/40 relative'>
                                    <div className={cn('h-full rounded-full bg-white transition-all duration-300', activeImageIndex === index ? 'w-full' : 'w-0')} />
                                </div>
                            ))}
                        </div>
                        <div className='absolute inset-0 flex z-0'>
                            <div className='flex-1 h-full' onClick={handlePrevImage} />
                            <div className='flex-1 h-full' onClick={handleNextImage} />
                        </div>
                    </>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4 pb-16 bg-gradient-to-t from-black/80 to-transparent text-white">
                     <div className="flex items-end justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                            <h3 className="text-2xl font-bold truncate">{profile.fullName}{profile.age && `, ${profile.age}`}</h3>
                             {profile.distance !== undefined && (
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-4 h-4" />
                                    <span>{langTr.anasayfa.distance.replace('{distance}', String(profile.distance))}</span>
                                </div>
                            )}
                            {profile.bio && <p className="text-base">{profile.bio}</p>}
                        </div>
                         <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm shrink-0 ml-2">
                                    <ChevronUp className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className='h-[90vh] rounded-t-2xl bg-card/80 text-card-foreground border-none p-0 backdrop-blur-sm'>
                                <SheetTitle className='sr-only'>Profil Detayları</SheetTitle>
                                <SheetDescription className='sr-only'>{profile.fullName} kullanıcısının profil detayları.</SheetDescription>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
                
                 <div className="absolute right-4 bottom-24 flex flex-col items-center gap-4 z-20">
                     <Button variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-black/40 backdrop-blur-sm text-green-400 hover:bg-black/50" onClick={() => triggerAction('liked')}>
                        <Heart className="w-9 h-9 fill-current" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-black/40 backdrop-blur-sm text-blue-400 hover:bg-black/50" onClick={() => triggerAction('superliked')}>
                        <Star className="w-8 h-8 fill-current" />
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}


export default function KesfetPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const [profiles, setProfiles] = useState<ProfileWithAgeAndDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = langTr.anasayfa;
  const { toast } = useToast();
  
  const swipedProfilesRef = useRef(new Set<string>());
  const scrollRef = useRef<HTMLDivElement>(null);

 const removeTopProfile = useCallback(() => {
    setProfiles(prev => prev.slice(1));
}, []);

 const handleAction = useCallback(async (swipedProfile: UserProfile, action: 'liked' | 'disliked' | 'superliked') => {
    if (!user || !firestore || !userProfile || swipedProfilesRef.current.has(swipedProfile.uid)) return;
    
    swipedProfilesRef.current.add(swipedProfile.uid);
    removeTopProfile();

    const user1Id = user.uid;
    const user2Id = swipedProfile.uid;
    const matchId = [user1Id, user2Id].sort().join('_');
    const matchDocRef = doc(firestore, 'matches', matchId);

    try {
        if (action === 'superliked') {
            const matchSnap = await getDoc(matchDocRef);
            if (matchSnap.exists()) {
                const matchData = matchSnap.data();
                if (matchData.status === 'matched') {
                    toast({
                        title: "Zaten Eşleştiniz!",
                        description: `${swipedProfile.fullName} ile zaten bir eşleşmeniz bulunuyor.`,
                        icon: <PartyPopper className="h-6 w-6 text-yellow-500" />,
                    });
                } else if (matchData.status === 'superlike_pending') {
                     toast({
                        title: "Super Like Yanıtı Bekleniyor",
                        description: `Bu kullanıcıya gönderdiğiniz Super Like henüz yanıtlanmadı.`,
                        icon: <Hourglass className="h-6 w-6 text-blue-500" />,
                    });
                } else {
                     toast({
                        title: "Etkileşim Zaten Var",
                        description: "Bu kişiyle aranızda zaten bir etkileşim mevcut.",
                    });
                }
                return; 
            }

            const currentUserMatchData = {
                id: matchId,
                matchedWith: user2Id,
                lastMessage: "Yanıt bekleniyor...",
                timestamp: serverTimestamp(),
                fullName: swipedProfile.fullName,
                profilePicture: swipedProfile.images?.[0]?.url || '',
                isSuperLike: true,
                status: 'superlike_pending',
                superLikeInitiator: user1Id
            };

            const swipedUserMatchData = {
                id: matchId,
                matchedWith: user1Id,
                lastMessage: `${userProfile.fullName} sana bir Super Like gönderdi!`,
                timestamp: serverTimestamp(),
                fullName: userProfile.fullName,
                profilePicture: userProfile.profilePicture || '',
                isSuperLike: true,
                status: 'superlike_pending',
                superLikeInitiator: user1Id
            };
            
            await setDoc(doc(firestore, `users/${user1Id}/matches`, matchId), currentUserMatchData);
            await setDoc(doc(firestore, `users/${user2Id}/matches`, matchId), swipedUserMatchData);
            
            await setDoc(matchDocRef, {
                user1Id: [user1Id, user2Id].sort()[0],
                user2Id: [user1Id, user2Id].sort()[1],
                status: 'superlike_pending',
                isSuperLike: true,
                superLikeInitiator: user1Id,
                [`${user1Id < user2Id ? 'user1' : 'user2'}_action`]: 'superliked',
                [`${user1Id < user2Id ? 'user1' : 'user2'}_timestamp`]: serverTimestamp(),
            }, { merge: true });

            const systemMessage = {
                matchId: matchId,
                senderId: 'system',
                text: `${swipedProfile.fullName} merhaba, benim adım ${userProfile.fullName}. Sana bir süper like yolladım, benimle eşleşmek ister misin? ♥️🙊`,
                timestamp: serverTimestamp(),
                isRead: false,
                type: 'system_superlike_prompt',
                actionTaken: false,
            };
            await addDoc(collection(firestore, `matches/${matchId}/messages`), systemMessage);

            toast({
                title: 'Super Like Gönderildi!',
                description: 'Şimdi eşleşme listeni kontrol et.',
                icon: <Star className="h-6 w-6 text-blue-500 fill-current" />
            });


        } else { // Handle normal like/dislike
            const isUser1 = user1Id < user2Id;
            const currentUserField = isUser1 ? 'user1' : 'user2';
            const otherUserField = isUser1 ? 'user2' : 'user1';

            const updateData: any = {
                [`${currentUserField}_action`]: action,
                [`${currentUserField}_timestamp`]: serverTimestamp(),
                user1Id: [user1Id, user2Id].sort()[0],
                user2Id: [user1Id, user2Id].sort()[1],
                status: 'pending',
            };

            const theirInteractionSnap = await getDoc(matchDocRef);
            let theirAction: string | undefined;
            if(theirInteractionSnap.exists()) {
                theirAction = theirInteractionSnap.data()?.[`${otherUserField}_action`];
            }

            if (action === 'liked' && theirAction === 'liked') {
                updateData.status = 'matched';
                updateData.matchDate = serverTimestamp();
                
                toast({
                    title: t.matchToastTitle,
                    description: `${swipedProfile.fullName} ${t.matchToastDescription}`,
                    icon: <PartyPopper className="h-6 w-6 text-green-500" />,
                });

                const currentUserMatchData = {
                    id: matchId,
                    matchedWith: user2Id,
                    lastMessage: langTr.eslesmeler.defaultMessage,
                    timestamp: serverTimestamp(),
                    fullName: swipedProfile.fullName,
                    profilePicture: swipedProfile.images?.[0].url || '',
                    status: 'matched',
                };

                const swipedUserMatchData = {
                    id: matchId,
                    matchedWith: user1Id,
                    lastMessage: langTr.eslesmeler.defaultMessage,
                    timestamp: serverTimestamp(),
                    fullName: userProfile.fullName,
                    profilePicture: userProfile.profilePicture || '',
                    status: 'matched',
                };
                
                await setDoc(doc(firestore, `users/${user1Id}/matches`, matchId), currentUserMatchData);
                await setDoc(doc(firestore, `users/${user2Id}/matches`, matchId), swipedUserMatchData);
            }
            await setDoc(matchDocRef, updateData, { merge: true });
        }
    } catch (error) {
        console.error(`Error handling ${action}:`, error);
        toast({
            title: langTr.common.error,
            description: "Etkileşim kaydedilemedi.",
            variant: "destructive",
        });
    }
  }, [user, firestore, t, toast, userProfile, removeTopProfile]);


 const fetchProfiles = useCallback(async (options?: { reset?: boolean }) => {
    if (!user || !firestore || !userProfile?.location?.latitude || !userProfile?.location?.longitude) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);

    try {
        const interactedUids = new Set<string>([user.uid]);
        
        if (!options?.reset) {
            const matchesQuery1 = query(collection(firestore, 'matches'), where('user1Id', '==', user.uid));
            const matchesQuery2 = query(collection(firestore, 'matches'), where('user2Id', '==', user.uid));
            
            const [query1Snapshot, query2Snapshot] = await Promise.all([
                getDocs(matchesQuery1),
                getDocs(matchesQuery2)
            ]);

            query1Snapshot.forEach(doc => interactedUids.add(doc.data().user2Id));
            query2Snapshot.forEach(doc => interactedUids.add(doc.data().user1Id));
        }
        
        swipedProfilesRef.current.clear();

        const qConstraints = [];
        const genderPref = userProfile?.genderPreference;
        const isGlobalMode = userProfile?.globalModeEnabled;
        const ageRange = userProfile?.ageRange;

        if (genderPref && genderPref !== 'both') {
          qConstraints.push(where('gender', '==', genderPref));
        }
        
        qConstraints.push(limit(100));
        
        const usersCollectionRef = collection(firestore, 'users');
        const usersQuery = query(usersCollectionRef, ...qConstraints);

        const querySnapshot = await getDocs(usersQuery);
        
        let fetchedProfiles = querySnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
            .filter(p => {
                if (!p.uid || (!options?.reset && interactedUids.has(p.uid))) return false;
                if (!p.fullName || !p.images || p.images.length === 0) return false;
                
                const age = calculateAge(p.dateOfBirth);
                (p as ProfileWithAgeAndDistance).age = age ?? undefined;

                if (ageRange && age) {
                    const minAge = userProfile.expandAgeRange ? ageRange.min - 5 : ageRange.min;
                    const maxAge = userProfile.expandAgeRange ? ageRange.max + 5 : ageRange.max;
                    if (age < minAge || age > maxAge) return false;
                }
                
                if (!isGlobalMode) {
                    if (!p.location?.latitude || !p.location?.longitude) return false;
                    const distance = getDistance(
                        userProfile.location!.latitude!,
                        userProfile.location!.longitude!,
                        p.location.latitude,
                        p.location.longitude
                    );
                    (p as ProfileWithAgeAndDistance).distance = distance;
                    const userDistancePref = userProfile.distancePreference || 50;
                    if (distance > userDistancePref) return false;
                } else {
                     if (p.location?.latitude && p.location?.longitude) {
                        const distance = getDistance(
                            userProfile.location!.latitude!,
                            userProfile.location!.longitude!,
                            p.location.latitude,
                            p.location.longitude
                        );
                        (p as ProfileWithAgeAndDistance).distance = distance;
                     }
                }
                
                return true;
            });
        
        if (isGlobalMode) {
          fetchedProfiles.sort((a, b) => ((a as ProfileWithAgeAndDistance).distance || Infinity) - ((b as ProfileWithAgeAndDistance).distance || Infinity));
        } else {
          fetchedProfiles.sort(() => Math.random() - 0.5); // Shuffle for non-global mode
        }
        
        setProfiles(fetchedProfiles);

    } catch (error) {
        console.error("Error fetching profiles for discovery:", error);
        toast({
          title: langTr.common.error,
          description: "Profiller getirilemedi.",
          variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
  }, [user, firestore, userProfile, toast]);


  useEffect(() => {
    if(userProfile){
      fetchProfiles();
    }
  }, [fetchProfiles, userProfile]);


  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="relative h-full w-full overflow-y-auto snap-y snap-mandatory">
      {profiles.length > 0 ? (
        profiles.map((profile, index) => (
          <DiscoveryProfileItem 
              key={profile.uid} 
              profile={profile} 
              isPriority={index < 2} 
              onAction={(action) => handleAction(profile, action)}
          />
        ))
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
             <p>{t.outOfProfilesDescription}</p>
             <Button onClick={() => fetchProfiles({ reset: true })} className="mt-4">
                 <RefreshCw className="mr-2 h-4 w-4" />
                 Tekrar Dene
             </Button>
        </div>
      )}
    </div>
  );
}
