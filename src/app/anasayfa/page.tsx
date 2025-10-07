
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Undo2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile, Match } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, doc, setDoc, serverTimestamp, getDoc, addDoc, writeBatch, DocumentReference, DocumentData, WriteBatch, Firestore, SetOptions, updateDoc, deleteField } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';
import { getDistance, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/components/icons';

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

const handleLikeAction = async (db: Firestore, currentUser: UserProfile, swipedUser: UserProfile, matchDocRef: DocumentReference<DocumentData>, existingMatchData: Match | undefined) => {
    const isUser1 = currentUser.uid < swipedUser.uid;
    const theirAction = isUser1 ? existingMatchData?.user2_action : existingMatchData?.user1_action;
    const currentUserField = isUser1 ? 'user1' : 'user2';

    let updateData: any = {
        [`${currentUserField}_action`]: 'liked',
        [`${currentUserField}_timestamp`]: serverTimestamp(),
    };

    if (theirAction === 'liked') {
        // --- EŞLEŞME OLDU ---
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

    const currentUserMatchData = { id: matchDocRef.id, matchedWith: swipedUser.uid, lastMessage: "Yanıt bekleniyor...", timestamp: serverTimestamp(), fullName: swipedUser.fullName, profilePicture: swipedUser.images?.[0]?.url || '', isSuperLike: true, status: 'superlike_pending', superLikeInitiator: currentUser.uid };
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

    await batch.commit();
};


export default function AnasayfaPage() {
  const t = langTr;
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<ProfileWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastDislikedProfile, setLastDislikedProfile] = useState<ProfileWithDistance | null>(null);

  const removeTopCard = useCallback((swipedProfile: UserProfile, action: 'liked' | 'disliked' | 'superliked') => {
    if (action === 'disliked') {
      setLastDislikedProfile(swipedProfile as ProfileWithDistance);
    } else {
      setLastDislikedProfile(null); // Clear undo on like or superlike
    }
    setProfiles(prev => prev.slice(0, prev.length - 1));
  }, []);
  
 const handleSwipe = useCallback(async (swipedProfile: UserProfile, action: 'liked' | 'disliked' | 'superliked') => {
    if (!user || !firestore || !userProfile) return;

    removeTopCard(swipedProfile, action);

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
        }

    } catch (error: any) {
        toast({
            title: t.common.error,
            description: error.message || "Etkileşim kaydedilemedi.",
            variant: "destructive",
        });
    }
 }, [user, firestore, t, toast, userProfile, removeTopCard]);


  const handleUndo = async () => {
    if (!lastDislikedProfile || !user || !firestore) return;
    
    // Add the profile back to the stack
    setProfiles(prev => [...prev, lastDislikedProfile]);

    // Revert the database change
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
      // Even if DB fails, we proceed with UI change. It's not critical.
    }
    
    // Clear the last disliked profile so it can't be undone again
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
                
                // Location filter
                if (!isGlobalMode) {
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
                     if (p.location?.latitude && p.location?.longitude) {
                        const distance = getDistance(
                            userProfile.location!.latitude!,
                            userProfile.location!.longitude!,
                            p.location.latitude,
                            p.location.longitude
                        );
                        (p as ProfileWithDistance).distance = distance;
                     }
                }
                
                return true;
            });
        
        if (isGlobalMode) {
          fetchedProfiles.sort((a, b) => ((a as ProfileWithDistance).distance || Infinity) - ((b as ProfileWithDistance).distance || Infinity));
        } else {
          fetchedProfiles.sort(() => Math.random() - 0.5); // Shuffle for non-global mode
        }
        
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
    <div className="relative h-full w-full flex flex-col items-center justify-center p-4 overflow-hidden">
      {isLoading ? (
        <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
      ) : profiles.length > 0 ? (
        <div className="relative flex-1 flex flex-col items-center justify-center w-full max-w-sm h-full max-h-[80vh]">
          {lastDislikedProfile && (
            <div className="absolute top-0 right-0 z-40">
              <Button onClick={handleUndo} variant="ghost" size="icon" className="h-12 w-12 rounded-full text-yellow-500 bg-white/20 backdrop-blur-sm hover:bg-white/30">
                  <Undo2 className="h-6 w-6" />
              </Button>
            </div>
          )}
          <AnimatePresence>
            {profiles.map((profile, index) => {
              const isTopCard = index === profiles.length - 1;
              
              if (index < profiles.length - 2) return null;

              return (
                <motion.div
                  key={profile.uid}
                  className={cn(
                    "absolute w-full h-full transition-all",
                    !isTopCard && "blur-sm"
                  )}
                  style={{
                    zIndex: index,
                  }}
                  initial={{ 
                    scale: isTopCard ? 1 : 0.95, 
                    y: isTopCard ? 0 : 10,
                  }}
                  animate={{ 
                    scale: 1, 
                    y: 0, 
                    opacity: 1, 
                    transition: { duration: 0.3, ease: 'easeOut' }
                  }}
                >
                  <ProfileCard
                    profile={profile}
                    onSwipe={(action) => handleSwipe(profile, action)}
                    isDraggable={isTopCard}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
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
  );
}

