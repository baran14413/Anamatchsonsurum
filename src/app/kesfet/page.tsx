
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, setDoc, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Icons } from '@/components/icons';
import { langTr } from '@/languages/tr';
import { RefreshCw, Compass, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ProfileCard from '@/components/profile-card';
import { getDistance } from '@/lib/utils';

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

const DiscoveryIntro = ({ onDismiss }: { onDismiss: () => void }) => {
    return (
        <div className="absolute inset-0 z-50 flex h-full w-full flex-col items-center justify-center bg-background/95 p-8 text-center backdrop-blur-sm">
            <div className="space-y-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Compass className="h-12 w-12" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Keşfet'e Hoş Geldin!</h1>
                    <p className="text-muted-foreground">
                        Burası profiller arasında dikey olarak kaydırarak gezebileceğin özgür bir alan.
                    </p>
                </div>
                 <div className="flex items-start gap-4 rounded-lg border p-4 text-left">
                    <Sparkles className="h-6 w-6 shrink-0 text-yellow-500" />
                    <div>
                        <h3 className="font-semibold">Günlük Kaydırma Hakları</h3>
                        <p className="text-sm text-muted-foreground">
                            Anasayfada ve keşfet sayfasında günlük toplam 300 + 300, yani 600 adet kaydırma hakkı kazandınız.
                        </p>
                    </div>
                </div>
                <Button size="lg" className="w-full rounded-full font-bold" onClick={onDismiss}>
                    Anladım, Başla!
                </Button>
            </div>
        </div>
    );
};


export default function KesfetPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const [profiles, setProfiles] = useState<ProfileWithAgeAndDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = langTr.anasayfa;
  const { toast } = useToast();
  
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    // This effect runs only on the client.
    const hasSeenIntro = localStorage.getItem('hasSeenKesfetIntro');
    if (!hasSeenIntro) {
      setShowIntro(true);
    }
  }, []);

  const handleDismissIntro = () => {
    localStorage.setItem('hasSeenKesfetIntro', 'true');
    setShowIntro(false);
  };

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
                const matchData = matchSnap.data();
                if (matchData.status === 'matched') {
                    toast({
                        title: "Zaten Eşleştiniz!",
                        description: `${swipedProfile.fullName} ile zaten bir eşleşmeniz bulunuyor.`,
                    });
                } else if (matchData.status === 'superlike_pending') {
                     toast({
                        title: "Super Like Yanıtı Bekleniyor",
                        description: `Bu kullanıcıya gönderdiğiniz Super Like henüz yanıtlanmadı.`,
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
    <div className="relative h-full w-full">
      {showIntro && <DiscoveryIntro onDismiss={handleDismissIntro} />}
      {profiles.length > 0 ? (
          <div className="h-full w-full">
            <ProfileCard
                profile={profiles[0]}
                onSwipe={(action) => handleAction(profiles[0], action)}
                isDraggable={true}
            />
          </div>
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
