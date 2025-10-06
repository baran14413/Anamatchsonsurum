
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, setDoc, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import type { UserProfile, UserMedia } from '@/lib/types';
import Image from 'next/image';
import { Icons } from '@/components/icons';
import { langTr } from '@/languages/tr';
import { RefreshCw, MapPin, Heart, X, Star, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDistance, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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

// Component for a single profile in the discovery feed
function DiscoveryProfileItem({ profile, isPriority, onAction }: { profile: ProfileWithAgeAndDistance, isPriority: boolean, onAction: (action: 'liked' | 'disliked' | 'superliked') => void }) {
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Reset media index when profile changes
    useEffect(() => {
        setActiveMediaIndex(0);
    }, [profile.uid]);

    const handleNextMedia = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (profile.media && profile.media.length > 1) {
            setActiveMediaIndex((prev) => (prev + 1) % profile.media.length);
        }
    }, [profile.media]);

    const handlePrevMedia = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (profile.media && profile.media.length > 1) {
            setActiveMediaIndex((prev) => (prev - 1 + profile.media.length) % profile.media.length);
        }
    }, [profile.media]);

    const currentMedia = profile.media?.[activeMediaIndex];
    const hasMultipleMedia = profile.media && profile.media.length > 1;

    return (
        <div className="h-full w-full snap-start flex-shrink-0 relative">
            <div className="absolute inset-0">
                {currentMedia?.url && currentMedia.type === 'image' && (
                    <Image
                        src={currentMedia.url}
                        alt={profile.fullName || 'Profile'}
                        fill
                        style={{ objectFit: 'cover' }}
                        priority={isPriority}
                    />
                )}
                 {currentMedia?.url && currentMedia.type === 'video' && (
                    <video
                        ref={videoRef}
                        key={currentMedia.url}
                        src={currentMedia.url}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                    />
                )}
            </div>

            {hasMultipleMedia && (
                <>
                    <div className='absolute top-2 left-2 right-2 flex gap-1 z-10'>
                        {profile.media.map((media, index) => (
                            <div key={index} className='h-1 flex-1 rounded-full bg-white/40'>
                                {media.type === 'video' && <Video className='absolute -top-1 -left-1 h-3 w-3 text-white/80'/>}
                                <div className={cn('h-full rounded-full bg-white transition-all duration-300', activeMediaIndex === index ? 'w-full' : 'w-0')} />
                            </div>
                        ))}
                    </div>
                    <div className='absolute inset-0 flex z-0'>
                        <div className='flex-1 h-full' onClick={handlePrevMedia} />
                        <div className='flex-1 h-full' onClick={handleNextMedia} />
                    </div>
                </>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4 pb-16 bg-gradient-to-t from-black/80 to-transparent text-white">
                <div className="space-y-1">
                    <h3 className="text-2xl font-bold">{profile.fullName}{profile.age && `, ${profile.age}`}</h3>
                    {profile.distance !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{langTr.anasayfa.distance.replace('{distance}', String(profile.distance))}</span>
                        </div>
                    )}
                    {profile.bio && <p className="text-base">{profile.bio}</p>}
                </div>
            </div>
            
            <div className="absolute right-4 bottom-20 flex flex-col items-center gap-4 z-20">
                <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm text-red-500 hover:bg-white/30" onClick={() => onAction('disliked')}>
                    <X className="w-8 h-8" />
                </Button>
                 <Button variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm text-green-400 hover:bg-white/30" onClick={() => onAction('liked')}>
                    <Heart className="w-9 h-9 fill-current" />
                </Button>
                <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm text-blue-400 hover:bg-white/30" onClick={() => onAction('superliked')}>
                    <Star className="w-8 h-8 fill-current" />
                </Button>
            </div>
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

  const removeTopProfile = useCallback(() => {
    setProfiles(prev => prev.slice(1));
  }, []);

  const handleAction = useCallback(async (swipedProfile: UserProfile, action: 'liked' | 'disliked' | 'superliked') => {
    if (!user || !firestore || !userProfile) return;
    
    removeTopProfile();

    const user1Id = user.uid;
    const user2Id = swipedProfile.uid;
    const matchId = [user1Id, user2Id].sort().join('_');
    const matchDocRef = doc(firestore, 'matches', matchId);

    try {
        if (action === 'superliked') {
            const matchSnap = await getDoc(matchDocRef);
            if (matchSnap.exists()) {
                toast({
                    title: "Tekrarlanan Eylem",
                    description: "Bu kişiyle zaten bir etkileşiminiz var.",
                    variant: "default"
                });
                return; 
            }

            const currentUserMatchData = {
                id: matchId,
                matchedWith: user2Id,
                lastMessage: "Yanıt bekleniyor...",
                timestamp: serverTimestamp(),
                fullName: swipedProfile.fullName,
                profilePicture: swipedProfile.media?.[0]?.url || '',
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
                });

                const currentUserMatchData = {
                    id: matchId,
                    matchedWith: user2Id,
                    lastMessage: langTr.eslesmeler.defaultMessage,
                    timestamp: serverTimestamp(),
                    fullName: swipedProfile.fullName,
                    profilePicture: swipedProfile.media?.[0].url || '',
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


 const fetchProfiles = useCallback(async () => {
    if (!user || !firestore || !userProfile?.location?.latitude || !userProfile?.location?.longitude) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);

    try {
        const interactedUids = new Set<string>([user.uid]);

        const matchesQuery1 = query(collection(firestore, 'matches'), where('user1Id', '==', user.uid));
        const matchesQuery2 = query(collection(firestore, 'matches'), where('user2Id', '==', user.uid));
        
        const [query1Snapshot, query2Snapshot] = await Promise.all([
            getDocs(matchesQuery1),
            getDocs(matchesQuery2)
        ]);

        query1Snapshot.forEach(doc => interactedUids.add(doc.data().user2Id));
        query2Snapshot.forEach(doc => interactedUids.add(doc.data().user1Id));

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
                if (!p.uid || interactedUids.has(p.uid)) return false;
                if (!p.fullName || !p.media || p.media.length === 0) return false;
                
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
    <div className="relative h-full w-full overflow-y-auto snap-y snap-mandatory">
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
             <Button onClick={() => fetchProfiles()} className="mt-4">
                 <RefreshCw className="mr-2 h-4 w-4" />
                 Tekrar Dene
             </Button>
        </div>
      )}
    </div>
  );
}
