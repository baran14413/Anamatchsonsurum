
"use client";

import { useState, useEffect } from "react";
import ProfileCard from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import type { UserProfile as UserProfileType } from "@/lib/types";
import { Heart, X, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, doc, writeBatch, serverTimestamp, getDocs, QuerySnapshot, DocumentData } from "firebase/firestore";

type SwipeAction = 'like' | 'nope';

export default function AnasayfaPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  const [profiles, setProfiles] = useState<UserProfileType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !firestore) return;

    setIsLoading(true);

    const usersCollectionRef = collection(firestore, "users");
    const interactionsCollectionRef = collection(firestore, `users/${currentUser.uid}/interactions`);

    Promise.all([
      getDocs(usersCollectionRef).catch(serverError => {
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: usersCollectionRef.path,
        });
        errorEmitter.emit('permission-error', contextualError);
        return { docs: [] } as QuerySnapshot<DocumentData>; // Hata durumunda boş bir anlık görüntü döndür
      }),
      getDocs(interactionsCollectionRef).catch(serverError => {
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: interactionsCollectionRef.path,
        });
        errorEmitter.emit('permission-error', contextualError);
        return { docs: [] } as QuerySnapshot<DocumentData>; // Hata durumunda boş bir anlık görüntü döndür
      }),
    ]).then(([usersSnapshot, interactionsSnapshot]) => {
      // 1. Tüm kullanıcıları işle
      const allUsersData = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfileType));

      // 2. Etkileşimleri işle
      const interactedIds = new Set(interactionsSnapshot.docs.map(doc => doc.id));
      
      // 3. Profilleri filtrele
      const filteredProfiles = allUsersData.filter(p => 
        p.id !== currentUser.uid && !interactedIds.has(p.id)
      );
      setProfiles(filteredProfiles);

    }).catch(error => {
        // Hatalar artık küresel olarak yayınlanıyor, bu yüzden buradaki bir konsol günlüğü yalnızca gerekirse hata ayıklama amaçlıdır.
        // FirebaseErrorListener, hatanın kullanıcıya görüntülenmesini ele alacaktır.
    }).finally(() => {
      setIsLoading(false);
    });

  }, [currentUser, firestore]);

  const handleSwipe = async (profileId: string, direction: 'left' | 'right') => {
    if (!currentUser || !firestore) return;

    const action: SwipeAction = direction === 'right' ? 'like' : 'nope';

    // UI'yi iyimser bir şekilde güncelle
    setProfiles(prev => prev.filter(p => p.id !== profileId));

    const batch = writeBatch(firestore);
    
    // Mevcut kullanıcı için etkileşimi kaydet
    const currentUserInteractionRef = doc(firestore, `users/${currentUser.uid}/interactions`, profileId);
    batch.set(currentUserInteractionRef, { action, timestamp: serverTimestamp() });

    // Eğer beğenildiyse, bir eşleşme belgesi oluştur
    if (action === 'like') {
        const otherUserDoc = await getDocs(collection(firestore, `users/${profileId}/interactions`));
        const otherUserLikes = otherUserDoc.docs.find(d => d.id === currentUser.uid && d.data().action === 'like');

        if (otherUserLikes) {
            const matchId = [currentUser.uid, profileId].sort().join('_');
            
            const matchDocForCurrentUser = doc(firestore, `users/${currentUser.uid}/matches`, matchId);
            batch.set(matchDocForCurrentUser, {
                id: matchId,
                users: [currentUser.uid, profileId],
                matchDate: serverTimestamp(),
            });
            
            const matchDocForOtherUser = doc(firestore, `users/${profileId}/matches`, matchId);
            batch.set(matchDocForOtherUser, {
                id: matchId,
                users: [currentUser.uid, profileId],
                matchDate: serverTimestamp(),
            });
        }
    }

    try {
      await batch.commit();
    } catch (error) {
      // Başarısızlık durumunda iyimser UI güncellemesini geri al
      const originalProfile = profiles.find(p => p.id === profileId);
      if (originalProfile) {
          setProfiles(prev => [originalProfile, ...prev]);
      }
      
      const contextualError = new FirestorePermissionError({
        operation: 'write', // toplu setteki set/update'i kapsar
        path: `users/${currentUser.uid}/interactions/${profileId}`, // Örnek yol, daha fazla ayrıntı gerekebilir
      });
      errorEmitter.emit('permission-error', contextualError);
    }
  };

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (profiles.length > 0) {
      const topProfile = profiles[profiles.length - 1];
      handleSwipe(topProfile.id, direction);
    }
  };

  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const activeProfile = profiles.length > 0 ? profiles[profiles.length - 1] : null;

  return (
    <div className="flex flex-col h-full bg-muted/20 dark:bg-black overflow-hidden">
      <div className="relative flex-1 flex flex-col items-center justify-center pb-16">
        <div className="relative w-full h-full max-w-md">
          <AnimatePresence>
            {profiles.length > 0 ? (
              profiles.map((profile, index) => {
                const isTopCard = index === profiles.length - 1;
                return (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    onSwipe={(dir) => handleSwipe(profile.id, dir)}
                    isTopCard={isTopCard}
                  />
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground px-8">
                <Heart className="h-16 w-16 mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold text-foreground">Herkes Tükendi!</h2>
                <p>Çevrendeki tüm profilleri gördün. Daha sonra tekrar kontrol et.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {activeProfile && (
        <div className="absolute bottom-6 left-0 right-0 z-20 flex w-full items-center justify-center gap-x-4 py-4 shrink-0">
          <Button onClick={() => triggerSwipe('left')} variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white text-rose-500 shadow-xl hover:bg-gray-100 transform transition-transform hover:scale-110">
            <X className="h-8 w-8" />
          </Button>
          <Button onClick={() => triggerSwipe('right')} variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white text-teal-400 shadow-xl hover:bg-gray-100 transform transition-transform hover:scale-110">
            <Heart className="h-8 w-8 fill-current" />
          </Button>
        </div>
      )}
    </div>
  );
}

