
'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { Undo2, Star, Heart, X as XIcon, Send } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile, Match } from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, doc, setDoc, serverTimestamp, getDoc, addDoc, writeBatch, DocumentReference, DocumentData, WriteBatch, Firestore, SetOptions, updateDoc, deleteField, increment, orderBy } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';
import { getDistance } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BOT_GREETINGS } from '@/lib/bot-data';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';


type ProfileWithDistance = UserProfile & { distance?: number };

// --- Eşleşme Mantığı Optimizasyonu ---

const createMatch = (batch: WriteBatch, db: Firestore, user1Id: string, user2Id: string, user1Data: any, user2Data: any) => {
    const matchId = [user1Id, user2Id].sort().join('_');
    batch.set(doc(db, `users/${user1Id}/matches`, matchId), user1Data);
    batch.set(doc(db, `users/${user2Id}/matches`, matchId), user2Data);
};


const getRandomGreeting = () => BOT_GREETINGS[Math.floor(Math.random() * BOT_GREETINGS.length)];

const handleLikeAction = async (db: Firestore, currentUser: UserProfile, swipedUser: UserProfile, matchDocRef: DocumentReference<DocumentData>, existingMatchData: Match | undefined) => {
    const isUser1 = currentUser.uid < swipedUser.uid;
    const theirAction = isUser1 ? existingMatchData?.user2_action : existingMatchData?.user1_action;
    const currentUserField = isUser1 ? 'user1' : 'user2';

    let updateData: any = {
        user1Id: [currentUser.uid, swipedUser.uid].sort()[0],
        user2Id: [currentUser.uid, swipedUser.uid].sort()[1],
        [`${currentUserField}_action`]: 'liked',
        [`${currentUserField}_timestamp`]: serverTimestamp(),
    };
    
    // --- BOT AUTO-MATCH LOGIC ---
    if (swipedUser.isBot) {
        updateData.status = 'matched';
        updateData.matchDate = serverTimestamp();
        
        const batch = writeBatch(db);
        const matchId = matchDocRef.id;

        createMatch(
            batch, db, currentUser.uid, swipedUser.uid,
            { id: matchId, matchedWith: swipedUser.uid, lastMessage: '', timestamp: serverTimestamp(), fullName: swipedUser.fullName, profilePicture: swipedUser.images?.[0]?.url || '', status: 'matched', unreadCount: 1 },
            { id: matchId, matchedWith: currentUser.uid, lastMessage: '', timestamp: serverTimestamp(), fullName: currentUser.fullName, profilePicture: currentUser.profilePicture || '', status: 'matched' }
        );
        batch.set(matchDocRef, updateData, { merge: true });

        await batch.commit();

        setTimeout(() => {
            if (!db) return;
            const botGreeting = getRandomGreeting();
            const messageRef = collection(db, `matches/${matchId}/messages`);
            addDoc(messageRef, {
                matchId: matchId,
                senderId: swipedUser.uid,
                text: botGreeting,
                timestamp: serverTimestamp(),
                isRead: false,
                type: 'user',
            });
            const userMatchRef = doc(db, `users/${currentUser.uid}/matches/${matchId}`);
            updateDoc(userMatchRef, { lastMessage: botGreeting, unreadCount: increment(1) });
            const botMatchRef = doc(db, `users/${swipedUser.uid}/matches/${matchId}`);
            updateDoc(botMatchRef, { lastMessage: botGreeting });
        }, 10000); 


        return { matched: true, swipedUserName: swipedUser.fullName };
    }


    if (theirAction === 'liked' || theirAction === 'superliked') {
        // --- EŞLEŞME OLDU (GERÇEK KULLANICI) ---
        updateData.status = 'matched';
        updateData.matchDate = serverTimestamp();
        
        const batch = writeBatch(db);
        createMatch(
            batch, db, currentUser.uid, swipedUser.uid,
            { id: matchDocRef.id, matchedWith: swipedUser.uid, lastMessage: langTr.eslesmeler.defaultMessage, timestamp: serverTimestamp(), fullName: swipedUser.fullName, profilePicture: swipedUser.images?.[0]?.url || '', status: 'matched' },
            { id: matchDocRef.id, matchedWith: currentUser.uid, lastMessage: langTr.eslesmeler.defaultMessage, timestamp: serverTimestamp(), fullName: currentUser.fullName, profilePicture: currentUser.profilePicture || '', status: 'matched' }
        );
        batch.set(matchDocRef, updateData, { merge: true });
        await batch.commit();

        return { matched: true, swipedUserName: swipedUser.fullName };
    } else {
        // --- BEKLEMEDE ---
        await setDoc(matchDocRef, updateData, { merge: true });
        return { matched: false };
    }
};

const handleDislikeAction = async (db: Firestore, currentUserUid: string, swipedUserUid: string, matchDocRef: DocumentReference<DocumentData>) => {
    const isUser1 = currentUserUid < swipedUserUid;
    const currentUserField = isUser1 ? 'user1' : 'user2';
    const updateData = {
        user1Id: [currentUserUid, swipedUserUid].sort()[0],
        user2Id: [currentUserUid, swipedUserUid].sort()[1],
        [`${currentUserField}_action`]: 'disliked',
        [`${currentUserField}_timestamp`]: serverTimestamp(),
    };
    await setDoc(matchDocRef, updateData, { merge: true });
};

const handleSuperlikeAction = async (db: Firestore, currentUser: UserProfile, swipedUser: UserProfile, matchDocRef: DocumentReference<DocumentData>, existingMatchData: Match | undefined) => {
    if (existingMatchData?.status === 'matched') {
        throw new Error("Bu kullanıcıyla zaten eşleştiniz.");
    }
    if (existingMatchData?.status === 'superlike_pending' && existingMatchData?.superLikeInitiator === currentUser.uid) {
        throw new Error("Bu kullanıcıya gönderdiğiniz Super Like henüz yanıtlanmadı.");
    }

    const isUser1 = currentUser.uid < swipedUser.uid;
    const currentUserField = isUser1 ? 'user1' : 'user2';
    
    const batch = writeBatch(db);

    const currentUserMatchData = { id: matchDocRef.id, matchedWith: swipedUser.uid, lastMessage: "Yanıt bekleniyor...", timestamp: serverTimestamp(), fullName: swipedUser.fullName, profilePicture: swipedUser.images?.[0] || '', isSuperLike: true, status: 'superlike_pending', superLikeInitiator: currentUser.uid };
    const swipedUserMatchData = { id: matchDocRef.id, matchedWith: currentUser.uid, lastMessage: `${currentUser.fullName} sana bir Super Like gönderdi!`, timestamp: serverTimestamp(), fullName: currentUser.fullName, profilePicture: currentUser.profilePicture || '', isSuperLike: true, status: 'superlike_pending', superLikeInitiator: currentUser.uid };
    
    createMatch(batch, db, currentUser.uid, swipedUser.uid, currentUserMatchData, swipedUserMatchData);
    
    const updateData = {
        user1Id: [currentUser.uid, swipedUser.uid].sort()[0],
        user2Id: [currentUser.uid, swipedUser.uid].sort()[1],
        status: 'superlike_pending',
        isSuperLike: true,
        superLikeInitiator: currentUser.uid,
        [`${currentUserField}_action`]: 'superliked',
        [`${currentUserField}_timestamp`]: serverTimestamp(),
    };
    batch.set(matchDocRef, updateData, { merge: true });
    
    const systemMessage = { matchId: matchDocRef.id, senderId: 'system', text: `${swipedUser.fullName} merhaba, benim adım ${currentUser.fullName}. Sana bir süper like yolladım, benimle eşleşmek ister misin? ♥️🙊`, timestamp: serverTimestamp(), isRead: false, type: 'system_superlike_prompt', actionTaken: false };
    batch.set(doc(collection(db, `matches/${matchDocRef.id}/messages`)), systemMessage);
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    batch.update(userDocRef, { superLikeBalance: increment(-1) });
    
    await batch.commit();
};


export default function AnasayfaPage() {
  const t = langTr;
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [profiles, setProfiles] = useState<ProfileWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastDislikedProfile, setLastDislikedProfile] = useState<ProfileWithDistance | null>(null);
  const [showUndoLimitModal, setShowUndoLimitModal] = useState(false);
  const [showSuperlikeModal, setShowSuperlikeModal] = useState(false);
  
  const handleSwipeAction = useCallback((swipedProfile: ProfileWithDistance, action: 'liked' | 'disliked' | 'superliked') => {
    if (!user || !firestore || !userProfile) return;

    if (action === 'superliked' && (userProfile.superLikeBalance || 0) <= 0) {
        setShowSuperlikeModal(true);
        return;
    }
    
    setProfiles(currentProfiles => currentProfiles.filter(p => p.id !== swipedProfile.id));


    if (action === 'disliked') {
      setLastDislikedProfile(swipedProfile);
    } else {
      setLastDislikedProfile(null);
    }

    const matchId = [user.uid, swipedProfile.uid].sort().join('_');
    const matchDocRef = doc(firestore, 'matches', matchId);

    // Perform DB action in background
    (async () => {
        try {
            const matchSnap = await getDoc(matchDocRef);
            const existingMatchData = matchSnap.data() as Match | undefined;

            if (action === 'liked') {
                const result = await handleLikeAction(firestore, userProfile, swipedProfile, matchDocRef, existingMatchData);
                if(result.matched){
                     toast({ title: t.anasayfa.matchToastTitle, description: `${result.swipedUserName} ${t.anasayfa.matchToastDescription}` });
                }
            } else if (action === 'disliked') {
                await handleDislikeAction(firestore, user.uid, swipedProfile.uid, matchDocRef);
            } else if (action === 'superliked') {
                await handleSuperlikeAction(firestore, userProfile, swipedProfile, matchDocRef, existingMatchData);
                toast({ title: "Super Like Gönderildi!", description: `${swipedProfile.fullName} profiline Super Like gönderdin.` });
            }
        } catch (error: any) {
            // If something fails, add the profile back to the stack to be swiped again.
            setProfiles(currentProfiles => [swipedProfile, ...currentProfiles]);
            toast({
                title: t.common.error,
                description: error.message || "Etkileşim kaydedilemedi.",
                variant: "destructive",
            });
        }
    })();
  }, [user, firestore, userProfile, toast, t]);
 
  const handleUndo = useCallback(async () => {
    if (!lastDislikedProfile || !user || !firestore || !userProfile) return;
    
    const isGoldMember = userProfile.membershipType === 'gold';
    if (!isGoldMember) {
        const now = new Date();
        const lastUndoTimestamp = userProfile.lastUndoTimestamp;
        const lastUndoDate = lastUndoTimestamp ? lastUndoTimestamp.toDate() : null;
        let currentUndoCount = userProfile.dailyUndoCount || 0;

        if (lastUndoDate && (now.getTime() - lastUndoDate.getTime()) > 24 * 60 * 60 * 1000) {
            currentUndoCount = 0;
        }
        
        if (currentUndoCount >= 3) {
            setShowUndoLimitModal(true);
            return;
        }

         try {
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, {
                dailyUndoCount: currentUndoCount + 1,
                lastUndoTimestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating undo count:", error);
        }
    }
    
    setProfiles(prev => [lastDislikedProfile, ...prev]);

    const matchDocRef = doc(firestore, 'matches', [user.uid, lastDislikedProfile.uid].sort().join('_'));
    const isUser1 = user.uid < lastDislikedProfile.uid;
    const currentUserField = isUser1 ? 'user1' : 'user2';
    try {
      await updateDoc(matchDocRef, {
        [`${currentUserField}_action`]: deleteField(),
        [`${currentUserField}_timestamp`]: deleteField(),
      });
    } catch (error) {
      console.error("Error reverting dislike:", error);
    }
    
    setLastDislikedProfile(null);
  }, [lastDislikedProfile, user, firestore, userProfile]);


 const fetchProfiles = useCallback(async (resetInteractions = false) => {
    if (!user || !firestore || !userProfile) {
        setIsLoading(false);
        return;
    }
    
    if (!userProfile?.location?.latitude || !userProfile?.location?.longitude) {
         if (!userProfile.globalModeEnabled) {
            // User needs location for distance filtering, but doesn't have it
            toast({
                title: t.ayarlarKonum.locationMissingTitle,
                description: t.ayarlarKonum.locationMissingDesc,
                variant: 'destructive'
            });
         }
    }

    setIsLoading(true);
    setLastDislikedProfile(null);
    setProfiles([]);

    try {
        const interactedUids = new Set<string>([user.uid]);
        
        if (!resetInteractions) {
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
        
        const isGlobalMode = userProfile.globalModeEnabled ?? false;
        
        const genderPreference = userProfile.genderPreference;
        if(genderPreference && genderPreference !== 'both'){
          qConstraints.push(where('gender', '==', genderPreference));
        }
        
        qConstraints.push(limit(20));
        
        const usersCollectionRef = collection(firestore, 'users');
        const usersQuery = query(usersCollectionRef, ...qConstraints);

        const querySnapshot = await getDocs(usersQuery);
        
        let fetchedProfiles = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile));

        const currentUserAge = userProfile.dateOfBirth ? new Date().getFullYear() - new Date(userProfile.dateOfBirth).getFullYear() : 0;
        const minAge = userProfile.ageRange?.min ?? 18;
        const maxAge = userProfile.ageRange?.max ?? 99;

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

        let processedProfiles = fetchedProfiles
            .filter(p => {
                // Base filters
                if (interactedUids.has(p.uid)) return false;
                if (!p.fullName || !p.images || p.images.length === 0) return false;
                
                const age = calculateAge(p.dateOfBirth);
                if (age === null || age < minAge || age > maxAge) {
                    if (!userProfile.expandAgeRange) return false;
                }

                // Global vs. Distance filtering
                if (isGlobalMode) {
                    return true; // No distance filter in global mode
                } else {
                    // Distance filter for non-global mode
                    if (p.location?.latitude && p.location?.longitude && userProfile.location?.latitude && userProfile.location.longitude) {
                        const distance = getDistance(userProfile.location.latitude, userProfile.location.longitude, p.location.latitude, p.location.longitude);
                        (p as ProfileWithDistance).distance = distance;
                        return distance <= (userProfile.distancePreference ?? 80);
                    }
                    return false; // No location data, so filter out in non-global mode
                }
            });

        if (isGlobalMode) {
            processedProfiles.sort(() => Math.random() - 0.5);
        } else {
            processedProfiles.sort((a, b) => ((a as ProfileWithDistance).distance ?? Infinity) - ((b as ProfileWithDistance).distance ?? Infinity));
        }

        setProfiles(processedProfiles);

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
  }, [user, firestore, userProfile, toast, t]);


  useEffect(() => {
    if (user && firestore && userProfile) {
      fetchProfiles();
    }
  }, [user, firestore, userProfile, fetchProfiles]);
  
  const currentProfile = profiles.length > 0 ? profiles[profiles.length - 1] : null;

  return (
    <div className="flex flex-1 flex-col items-center p-4">
      <AlertDialog open={showUndoLimitModal || showSuperlikeModal} onOpenChange={(open) => {
          if (!open) {
              setShowUndoLimitModal(false);
              setShowSuperlikeModal(false);
          }
      }}>
           <div className="relative w-full max-w-sm aspect-[3/4]">
              <AnimatePresence>
                  {isLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                          <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
                      </div>
                  ) : profiles.length > 0 ? (
                    profiles.map((profile, index) => {
                       const isTopCard = index === profiles.length - 1;
                       return (
                      <motion.div
                        key={profile.id}
                        className="absolute w-full h-full"
                        style={{
                          zIndex: index,
                        }}
                        drag={isTopCard}
                        onDragEnd={(event, info) => {
                          if (!isTopCard) return;
                          if (info.offset.x > 100) {
                            handleSwipeAction(profile, 'liked');
                          } else if (info.offset.x < -100) {
                            handleSwipeAction(profile, 'disliked');
                          } else if (info.offset.y < -100) {
                            handleSwipeAction(profile, 'superliked');
                          }
                        }}
                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                        dragElastic={0.2}
                      >
                        <ProfileCard profile={profile} isTopCard={isTopCard} />
                      </motion.div>
                       )
                    })
                  ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-center">
                          <div className='space-y-4'>
                              <p>{t.anasayfa.outOfProfilesDescription}</p>
                              <Button onClick={() => fetchProfiles(true)}>
                                  <Undo2 className="mr-2 h-4 w-4" />
                                  Tekrar Dene
                              </Button>
                          </div>
                      </div>
                  )}
               </AnimatePresence>
          </div>
          <div className="flex w-full items-center justify-evenly py-6">
              <Button onClick={handleUndo} disabled={!lastDislikedProfile} variant="ghost" className="h-16 w-16 rounded-full bg-background shadow-lg">
                  <Undo2 className="h-8 w-8 text-yellow-500" />
              </Button>
              <Button onClick={() => currentProfile && handleSwipeAction(currentProfile, 'disliked')} disabled={!currentProfile} variant="ghost" className="h-20 w-20 rounded-full bg-background shadow-lg">
                  <XIcon className="h-10 w-10 text-red-500" />
              </Button>
               <Button onClick={() => currentProfile && handleSwipeAction(currentProfile, 'superliked')} disabled={!currentProfile} variant="ghost" className="h-16 w-16 rounded-full bg-background shadow-lg">
                  <Star className="h-8 w-8 text-blue-500" />
              </Button>
              <Button onClick={() => currentProfile && handleSwipeAction(currentProfile, 'liked')} disabled={!currentProfile} variant="ghost" className="h-20 w-20 rounded-full bg-background shadow-lg">
                  <Heart className="h-10 w-10 text-green-500" />
              </Button>
               <Button variant="ghost" className="h-16 w-16 rounded-full bg-background shadow-lg">
                  <Send className="h-8 w-8 text-purple-500" />
              </Button>
          </div>

           {showUndoLimitModal && (
              <AlertDialogContent>
                  <AlertDialogHeader className="items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-yellow-400/20 flex items-center justify-center mb-4">
                          <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" />
                      </div>
                      <AlertDialogTitle className="text-2xl">Geri Alma Hakkın Doldu!</AlertDialogTitle>
                      <AlertDialogDescription>
                      Sınırsız geri alma hakkı için Gold'a yükselt. Bu sayede yanlışlıkla geçtiğin hiçbir profili kaçırma!
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                      <AlertDialogCancel>Şimdi Değil</AlertDialogCancel>
                      <AlertDialogAction asChild>
                          <Button className='bg-yellow-400 text-yellow-900 hover:bg-yellow-500' onClick={() => router.push('/market')}>
                              <Star className="mr-2 h-4 w-4" /> Gold'a Yükselt
                          </Button>
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
           )}
           {showSuperlikeModal && (
                <AlertDialogContent>
                  <AlertDialogHeader className="items-center text-center">
                       <div className="w-16 h-16 rounded-full bg-blue-400/20 flex items-center justify-center mb-4">
                          <Star className="w-10 h-10 text-blue-400 fill-blue-400" />
                       </div>
                      <AlertDialogTitle className="text-2xl">Super Like Bakiyen Bitti!</AlertDialogTitle>
                      <AlertDialogDescription>
                         Super Like göndererek eşleşme şansını 3 katına çıkarabilirsin. Bakiyeni yenilemek için hemen bir paket seç!
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                      <AlertDialogCancel>Şimdi Değil</AlertDialogCancel>
                      <AlertDialogAction asChild>
                          <Button className='bg-blue-500 text-white hover:bg-blue-600' onClick={() => router.push('/market')}>
                              <Star className="mr-2 h-4 w-4" /> Super Like Satın Al
                          </Button>
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
           )}
      </AlertDialog>
    </div>
  );
}
