'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { Undo2, Star } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile, Match } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, doc, setDoc, serverTimestamp, getDoc, addDoc, writeBatch, DocumentReference, DocumentData, WriteBatch, Firestore, SetOptions, updateDoc, deleteField, increment } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';
import { getDistance, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BOT_GREETINGS } from '@/lib/bot-data';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';


type ProfileWithDistance = UserProfile & { distance?: number };

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

// --- Eşleşme Mantığı Optimizasyonu ---

const updateMatchData = async (db: Firestore, ref: DocumentReference<DocumentData>, data: any, options: SetOptions = {}) => {
    try {
        await setDoc(ref, data, options);
    } catch (error: any) {
        const errorMessage = error.message || "Etkileşim kaydedilemedi.";
        throw new Error(errorMessage);
    }
};

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
        await updateMatchData(db, matchDocRef, updateData, { merge: true });
        return { matched: false };
    }
};

const handleDislikeAction = async (db: Firestore, currentUserUid: string, swipedUserUid: string, matchDocRef: DocumentReference<DocumentData>) => {
    const isUser1 = currentUserUid < swipedUserUid;
    const currentUserField = isUser1 ? 'user1' : 'user2';
    const updateData = {
        [`${currentUserField}_action`]: 'disliked',
        [`${currentUserField}_timestamp`]: serverTimestamp(),
    };
    await updateMatchData(db, matchDocRef, updateData, { merge: true });
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
  
  const removeTopCard = useCallback((action: 'liked' | 'disliked' | 'superliked') => {
    setProfiles(prevProfiles => {
      if (prevProfiles.length === 0) return [];
      const swipedProfile = prevProfiles[prevProfiles.length - 1];
      const newProfiles = prevProfiles.slice(0, prevProfiles.length - 1);
      
      if (action === 'disliked') {
        setLastDislikedProfile(swipedProfile);
      } else {
        setLastDislikedProfile(null); // Clear undo on like or superlike
      }
      
      return newProfiles;
    });
  }, []);
  
 const handleSwipe = useCallback(async (swipedProfile: UserProfile, action: 'liked' | 'disliked' | 'superliked') => {
    if (!user || !firestore || !userProfile) return;

    if (action === 'superliked') {
        if ((userProfile.superLikeBalance || 0) <= 0) {
            setShowSuperlikeModal(true);
            return;
        }
    }

    removeTopCard(action);

    const user1Id = user.uid;
    const user2Id = swipedProfile.uid;
    const matchId = [user1Id, user2Id].sort().join('_');
    const matchDocRef = doc(firestore, 'matches', matchId);

    try {
        const matchSnap = await getDoc(matchDocRef);
        const existingMatchData = matchSnap.data() as Match | undefined;
        
        const baseUpdateData = {
             user1Id: [user1Id, user2Id].sort()[0],
             user2Id: [user1Id, user2Id].sort()[1],
        };
        await updateMatchData(firestore, matchDocRef, baseUpdateData, { merge: true });

        if (action === 'liked') {
            const result = await handleLikeAction(firestore, userProfile, swipedProfile, matchDocRef, existingMatchData);
            if(result.matched){
                 toast({ title: t.anasayfa.matchToastTitle, description: `${result.swipedUserName} ${t.anasayfa.matchToastDescription}` });
            }
        } else if (action === 'disliked') {
            await handleDislikeAction(firestore, user1Id, user2Id, matchDocRef);
        } else if (action === 'superliked') {
            await handleSuperlikeAction(firestore, userProfile, swipedProfile, matchDocRef, existingMatchData);
            toast({ title: "Super Like Gönderildi!", description: `${swipedProfile.fullName} profiline Super Like gönderdin.` });
        }

    } catch (error: any) {
        toast({
            title: t.common.error,
            description: error.message || "Etkileşim kaydedilemedi.",
            variant: "destructive",
        });
    }
 }, [user, firestore, t, toast, userProfile, removeTopCard]);
 
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, profile: UserProfile) => {
    const SWIPE_THRESHOLD = 80;
    if (info.offset.y < -SWIPE_THRESHOLD) {
      handleSwipe(profile, 'superliked');
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      handleSwipe(profile, 'liked');
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      handleSwipe(profile, 'disliked');
    }
  };


  const handleUndo = async () => {
    if (!lastDislikedProfile || !user || !firestore || !userProfile) return;
    
    // Check user membership and undo limits
    const isGoldMember = userProfile.membershipType === 'gold';
    if (!isGoldMember) {
        const now = new Date();
        const lastUndoTimestamp = userProfile.lastUndoTimestamp;
        const lastUndoDate = lastUndoTimestamp ? lastUndoTimestamp.toDate() : null;
        let currentUndoCount = userProfile.dailyUndoCount || 0;

        // Reset count if it's a new day (24 hours passed)
        if (lastUndoDate && (now.getTime() - lastUndoDate.getTime()) > 24 * 60 * 60 * 1000) {
            currentUndoCount = 0;
        }
        
        if (currentUndoCount >= 3) {
            setShowUndoLimitModal(true);
            return;
        }

        // Increment count and update timestamp
         try {
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, {
                dailyUndoCount: currentUndoCount + 1,
                lastUndoTimestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating undo count:", error);
            // Don't block the UI for this, just log it.
        }
    }
    
    // UI: Add the profile back to the stack
    setProfiles(prev => [...prev, lastDislikedProfile]);

    // DB: Revert the dislike action
    const matchId = [user.uid, lastDislikedProfile.uid].sort().join('_');
    const matchDocRef = doc(firestore, 'matches', matchId);
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
  };


 const fetchProfiles = useCallback(async (resetInteractions = false) => {
    if (!user || !firestore || !userProfile?.location?.latitude || !userProfile?.location?.longitude) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setLastDislikedProfile(null); // Reset undo on new fetch

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
                
                // Age filter
                if (ageRange) {
                    const age = calculateAge(p.dateOfBirth);
                    if (age === null) return false;

                    const minAge = userProfile.expandAgeRange ? ageRange.min - 5 : ageRange.min;
                    const maxAge = userProfile.expandAgeRange ? ageRange.max + 5 : ageRange.max;
                    
                    if (age < minAge || age > maxAge) {
                        return false;
                    }
                }
                
                // Location filter for non-bot users
                if (!p.isBot && !isGlobalMode) {
                    if (!p.location?.latitude || !p.location?.longitude) return false;
                    const distance = getDistance(
                        userProfile.location!.latitude!,
                        userProfile.location!.longitude!,
                        p.location.latitude,
                        p.location.longitude
                    );
                    (p as ProfileWithDistance).distance = distance;
                    const userDistancePref = userProfile.distancePreference || 50;
                    if (distance > userDistancePref) {
                        return false;
                    }
                } else {
                     // For bots or global mode users, calculate distance for display but don't filter
                     if (p.location?.latitude && p.location?.longitude) {
                        const distance = getDistance(
                            userProfile.location!.latitude!,
                            userProfile.location!.longitude!,
                            p.location.latitude,
                            p.location.longitude
                        );
                        // Make bots appear close
                        (p as ProfileWithDistance).distance = p.isBot ? Math.floor(Math.random() * 15) + 1 : distance;
                     }
                }
                
                return true;
            });
        
        // Sort bots to appear first, then sort by distance if applicable
        fetchedProfiles.sort((a, b) => {
            if (a.isBot && !b.isBot) return -1;
            if (!a.isBot && b.isBot) return 1;
            if (isGlobalMode) {
              return ((a as ProfileWithDistance).distance || Infinity) - ((b as ProfileWithDistance).distance || Infinity);
            }
            return Math.random() - 0.5; // Shuffle others
        });
        
        setProfiles(fetchedProfiles.slice(0, 20)); // Limit to 20 profiles to display

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
    if (user && firestore && userProfile) {
      fetchProfiles();
    }
  }, [user, firestore, userProfile, fetchProfiles]);

  return (
    <AlertDialog open={showUndoLimitModal || showSuperlikeModal} onOpenChange={(open) => {
        if (!open) {
            setShowUndoLimitModal(false);
            setShowSuperlikeModal(false);
        }
    }}>
        <div className="relative h-full w-full flex flex-col items-center justify-center p-4 overflow-hidden">
            {isLoading ? (
                <div className="flex h-full items-center justify-center">
                    <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
                </div>
            ) : profiles.length > 0 ? (
                 <div className="relative w-full h-full max-w-sm aspect-[9/14]">
                    {lastDislikedProfile && (
                        <div className="absolute top-4 right-4 z-40">
                            <Button onClick={handleUndo} variant="ghost" size="icon" className="h-10 w-10 rounded-full text-yellow-500 bg-white/20 backdrop-blur-sm hover:bg-white/30">
                                <Undo2 className="h-5 w-5" />
                            </Button>
                        </div>
                    )}
                    {profiles.map((profile, index) => {
                        const isTopCard = index === profiles.length - 1;
                        if (index < profiles.length - 2) return null;

                        const y = isTopCard ? 0 : (profiles.length - 1 - index) * -10;
                        const scale = isTopCard ? 1 : 1 - ((profiles.length - index -1) * 0.05);

                        return (
                            <motion.div
                                key={profile.uid}
                                className="absolute w-full h-full"
                                style={{
                                    scale: scale,
                                    y: y,
                                }}
                                initial={{
                                    scale: 0.95,
                                    y: -10,
                                }}
                                animate={{
                                    scale: 1,
                                    y: (profiles.length - 1 - index) * -10, // Stacking effect
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 30,
                                }}
                                drag={isTopCard}
                                onDragEnd={(event, info) => handleDragEnd(event, info, profile)}
                            >
                                <ProfileCard
                                    profile={profile}
                                    isDraggable={isTopCard}
                                />
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex h-full items-center justify-center text-center">
                    <div className='space-y-4'>
                        <p>{t.anasayfa.outOfProfilesDescription}</p>
                        <Button onClick={() => fetchProfiles(true)}>
                            <Undo2 className="mr-2 h-4 w-4" />
                            Tekrar Dene
                        </Button>
                    </div>
                </div>
            )}
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
  );
}
