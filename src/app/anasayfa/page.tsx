'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Undo2, Star, Heart, X as XIcon, Send } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile, Match } from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, doc, setDoc, serverTimestamp, getDoc, addDoc, writeBatch, updateDoc, deleteField, increment, orderBy, collectionGroup } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';
import { getDistance } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BOT_GREETINGS } from '@/lib/bot-data';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

type ProfileWithDistance = UserProfile & { distance?: number };

const handleLikeAction = async (db: any, currentUser: UserProfile, swipedUser: UserProfile) => {
    const matchId = [currentUser.uid, swipedUser.uid].sort().join('_');
    const matchDocRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchDocRef);
    const existingMatchData = matchSnap.data() as Match | undefined;

    const isUser1 = currentUser.uid < swipedUser.uid;
    const theirAction = isUser1 ? existingMatchData?.user2_action : existingMatchData?.user1_action;
    const currentUserField = isUser1 ? 'user1' : 'user2';

    let updateData: any = {
        user1Id: [currentUser.uid, swipedUser.uid].sort()[0],
        user2Id: [currentUser.uid, swipedUser.uid].sort()[1],
        [`${currentUserField}_action`]: 'liked',
        [`${currentUserField}_timestamp`]: serverTimestamp(),
    };

    if (swipedUser.isBot) {
        updateData.status = 'matched';
        updateData.matchDate = serverTimestamp();
        
        const batch = writeBatch(db);
        batch.set(matchDocRef, updateData, { merge: true });

        const userMatchData = { id: matchId, matchedWith: swipedUser.uid, lastMessage: '', timestamp: serverTimestamp(), fullName: swipedUser.fullName, profilePicture: swipedUser.profilePicture || '', status: 'matched', unreadCount: 1 };
        const botMatchData = { id: matchId, matchedWith: currentUser.uid, lastMessage: '', timestamp: serverTimestamp(), fullName: currentUser.fullName, profilePicture: currentUser.profilePicture || '', status: 'matched' };
        
        batch.set(doc(db, `users/${currentUser.uid}/matches`, matchId), userMatchData);
        batch.set(doc(db, `users/${swipedUser.uid}/matches`, matchId), botMatchData);
        
        await batch.commit();

        setTimeout(() => {
            const botGreeting = BOT_GREETINGS[Math.floor(Math.random() * BOT_GREETINGS.length)];
            const messageRef = collection(db, `matches/${matchId}/messages`);
            addDoc(messageRef, { matchId, senderId: swipedUser.uid, text: botGreeting, timestamp: serverTimestamp(), isRead: false, type: 'user' });
            updateDoc(doc(db, `users/${currentUser.uid}/matches`, matchId), { lastMessage: botGreeting, unreadCount: increment(1) });
            updateDoc(doc(db, `users/${swipedUser.uid}/matches`, matchId), { lastMessage: botGreeting });
        }, 10000); 

        return { matched: true, swipedUserName: swipedUser.fullName };
    }

    if (theirAction === 'liked' || theirAction === 'superliked') {
        updateData.status = 'matched';
        updateData.matchDate = serverTimestamp();
        
        const batch = writeBatch(db);
        batch.set(matchDocRef, updateData, { merge: true });

        const user1MatchData = { id: matchId, matchedWith: swipedUser.uid, lastMessage: langTr.eslesmeler.defaultMessage, timestamp: serverTimestamp(), fullName: swipedUser.fullName, profilePicture: swipedUser.profilePicture || '', status: 'matched' };
        const user2MatchData = { id: matchId, matchedWith: currentUser.uid, lastMessage: langTr.eslesmeler.defaultMessage, timestamp: serverTimestamp(), fullName: currentUser.fullName, profilePicture: currentUser.profilePicture || '', status: 'matched' };

        batch.set(doc(db, `users/${currentUser.uid}/matches`, matchId), user1MatchData);
        batch.set(doc(db, `users/${swipedUser.uid}/matches`, matchId), user2MatchData);
        
        await batch.commit();

        return { matched: true, swipedUserName: swipedUser.fullName };
    } else {
        await setDoc(matchDocRef, updateData, { merge: true });
        return { matched: false };
    }
};

const handleDislikeAction = async (db: any, currentUserUid: string, swipedUserUid: string) => {
    const matchId = [currentUserUid, swipedUserUid].sort().join('_');
    const matchDocRef = doc(db, 'matches', matchId);
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

const handleSuperlikeAction = async (db: any, currentUser: UserProfile, swipedUser: UserProfile) => {
    const matchId = [currentUser.uid, swipedUser.uid].sort().join('_');
    const matchDocRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchDocRef);
    const existingMatchData = matchSnap.data() as Match | undefined;

    if (existingMatchData?.status === 'matched') throw new Error("Bu kullanıcıyla zaten eşleştiniz.");
    if (existingMatchData?.status === 'superlike_pending' && existingMatchData?.superLikeInitiator === currentUser.uid) throw new Error("Bu kullanıcıya gönderdiğiniz Super Like henüz yanıtlanmadı.");

    const isUser1 = currentUser.uid < swipedUser.uid;
    const currentUserField = isUser1 ? 'user1' : 'user2';
    
    const batch = writeBatch(db);
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

    const currentUserMatchData = { id: matchId, matchedWith: swipedUser.uid, lastMessage: "Yanıt bekleniyor...", timestamp: serverTimestamp(), fullName: swipedUser.fullName, profilePicture: swipedUser.profilePicture || '', isSuperLike: true, status: 'superlike_pending', superLikeInitiator: currentUser.uid };
    const swipedUserMatchData = { id: matchId, matchedWith: currentUser.uid, lastMessage: `${currentUser.fullName} sana bir Super Like gönderdi!`, timestamp: serverTimestamp(), fullName: currentUser.fullName, profilePicture: currentUser.profilePicture || '', isSuperLike: true, status: 'superlike_pending', superLikeInitiator: currentUser.uid };
    
    batch.set(doc(db, `users/${currentUser.uid}/matches`, matchId), currentUserMatchData);
    batch.set(doc(db, `users/${swipedUser.uid}/matches`, matchId), swipedUserMatchData);
    
    const systemMessage = { matchId, senderId: 'system', text: `${swipedUser.fullName} merhaba, benim adım ${currentUser.fullName}. Sana bir süper like yolladım, benimle eşleşmek ister misin? ♥️🙊`, timestamp: serverTimestamp(), isRead: false, type: 'system_superlike_prompt', actionTaken: false };
    batch.set(doc(collection(db, `matches/${matchId}/messages`)), systemMessage);
    
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
  
  const fetchProfiles = useCallback(async () => {
    if (!user || !firestore || !userProfile) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    setLastDislikedProfile(null);

    try {
      const interactedUids = new Set<string>([user.uid]);
      const matchesQuery = query(collectionGroup(firestore, 'matches'), where('id', 'in', [user.uid]));
      const userInteractionsSnap = await getDocs(matchesQuery);

      userInteractionsSnap.forEach(doc => {
          const data = doc.data();
          const uids = doc.id.split('_');
          const otherUid = uids[0] === user.uid ? uids[1] : uids[0];
          if (otherUid) {
              interactedUids.add(otherUid);
          }
      });
        
        let usersQuery = query(collection(firestore, 'users'), limit(50));
        const querySnapshot = await getDocs(usersQuery);
        
        const globalMode = userProfile.globalModeEnabled ?? false;
        
        let fetchedProfiles = querySnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
            .filter(p => {
                if (!p.uid || interactedUids.has(p.uid)) return false;
                
                if (!(p.images && p.images.length > 0)) return false;

                const userGenderPref = userProfile.genderPreference;
                if (userGenderPref !== 'both' && p.gender !== userGenderPref) {
                    return false;
                }

                const age = p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : 0;
                const minAge = userProfile.ageRange?.min || 18;
                const maxAge = userProfile.ageRange?.max || 80;
                if (age < minAge || age > maxAge) {
                    if (!userProfile.expandAgeRange) {
                        return false;
                    }
                }
                
                return true;
            })
            .map(p => {
                if (!globalMode && userProfile.location?.latitude && userProfile.location?.longitude && p.location?.latitude && p.location?.longitude) {
                    const distance = getDistance(userProfile.location.latitude, userProfile.location.longitude, p.location.latitude, p.location.longitude);
                    if (distance > (userProfile.distancePreference || 160)) {
                         return { ...p, distance: distance, hide: true };
                    }
                    return { ...p, distance };
                }
                return { ...p, distance: undefined };
            })
            .filter(p => !(p as any).hide)
            .slice(0, 20);

        setProfiles(fetchedProfiles);

    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({ title: t.common.error, description: "Potansiyel eşleşmeler getirilemedi.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore, userProfile, toast, t]);

  useEffect(() => {
    if (user && firestore && userProfile) {
      fetchProfiles();
    }
  }, [user, firestore, userProfile, fetchProfiles]);

  const handleSwipeAction = useCallback((action: 'liked' | 'disliked' | 'superliked') => {
    if (!user || !firestore || !userProfile || profiles.length === 0) return;
    
    const swipedProfile = profiles[profiles.length - 1];
    if (!swipedProfile) return;

    if (action === 'superliked' && (userProfile.superLikeBalance || 0) <= 0) {
        setShowSuperlikeModal(true);
        return;
    }

    if (action === 'disliked') {
        setLastDislikedProfile(swipedProfile);
    } else {
        setLastDislikedProfile(null);
    }

    (async () => {
        try {
            if (action === 'liked') {
                const result = await handleLikeAction(firestore, userProfile, swipedProfile);
                if(result.matched){
                     toast({ title: t.anasayfa.matchToastTitle, description: `${result.swipedUserName} ${t.anasayfa.matchToastDescription}` });
                }
            } else if (action === 'disliked') {
                await handleDislikeAction(firestore, user.uid, swipedProfile.uid);
            } else if (action === 'superliked') {
                await handleSuperlikeAction(firestore, userProfile, swipedProfile);
                toast({ title: "Super Like Gönderildi!", description: `${swipedProfile.fullName} profiline Super Like gönderdin.` });
            }
        } catch (error: any) {
            console.error("Swipe action failed:", error);
            toast({ title: t.common.error, description: error.message || "Etkileşim kaydedilemedi.", variant: "destructive" });
        }
    })();
    
    setProfiles(currentProfiles => currentProfiles.slice(0, -1));
  }, [user, firestore, userProfile, profiles, toast, t]);
 
  const handleUndo = useCallback(async () => {
    if (!lastDislikedProfile || !user || !firestore || !userProfile) return;
    
    const isGoldMember = userProfile.membershipType === 'gold';
    if (!isGoldMember) {
        const now = new Date();
        const lastUndoDate = userProfile.lastUndoTimestamp?.toDate() ?? null;
        let currentUndoCount = userProfile.dailyUndoCount || 0;

        if (lastUndoDate && (now.getTime() - lastUndoDate.getTime()) > 24 * 60 * 60 * 1000) {
            currentUndoCount = 0;
        }
        
        if (currentUndoCount >= 3) {
            setShowUndoLimitModal(true);
            return;
        }
        try {
            await updateDoc(doc(firestore, 'users', user.uid), { dailyUndoCount: currentUndoCount + 1, lastUndoTimestamp: serverTimestamp() });
        } catch (error) { console.error("Error updating undo count:", error); }
    }
    
    setProfiles(prev => [...prev, lastDislikedProfile]);
    
    const matchDocRef = doc(firestore, 'matches', [user.uid, lastDislikedProfile.uid].sort().join('_'));
    const isUser1 = user.uid < lastDislikedProfile.uid;
    const currentUserField = isUser1 ? 'user1' : 'user2';
    try {
      await updateDoc(matchDocRef, { [`${currentUserField}_action`]: deleteField(), [`${currentUserField}_timestamp`]: deleteField() });
    } catch (error) { console.error("Error reverting dislike:", error); }
    
    setLastDislikedProfile(null);
  }, [lastDislikedProfile, user, firestore, userProfile]);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-30, 30]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <AlertDialog open={showUndoLimitModal || showSuperlikeModal} onOpenChange={(open) => {
          if (!open) { setShowUndoLimitModal(false); setShowSuperlikeModal(false); }
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
                                x: isTopCard ? x : 0,
                                rotate: isTopCard ? rotate : 0,
                            }}
                            drag={isTopCard ? true : false}
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            dragElastic={0.5}
                            onDragEnd={(event, info) => {
                                if (!isTopCard) return;
                                if (info.offset.x > 100) {
                                    handleSwipeAction('liked');
                                } else if (info.offset.x < -100) {
                                    handleSwipeAction('disliked');
                                } else {
                                    x.set(0);
                                }
                            }}
                        >
                            <ProfileCard profile={profile} isTopCard={isTopCard} />
                        </motion.div>
                       )
                    })
                  ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 space-y-4">
                            <h3 className="text-2xl font-bold">{t.anasayfa.outOfProfilesTitle}</h3>
                            <p className="text-muted-foreground">{t.anasayfa.outOfProfilesDescription}</p>
                            <Button onClick={() => fetchProfiles()}>
                                <Undo2 className="mr-2 h-4 w-4" />
                                Tekrar Dene
                            </Button>
                      </div>
                  )}
               </AnimatePresence>
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
