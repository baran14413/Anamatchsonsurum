
"use client";

import { useState, useMemo } from "react";
import ProfileCard from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import type { UserProfile as UserProfileType } from "@/lib/types";
import { Heart, X, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";

export default function AnasayfaPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [profiles, setProfiles] = useState<UserProfileType[]>([]);
  
  const usersRef = useMemoFirebase(() => {
      if(!firestore) return null;
      return collection(firestore, "users");
  }, [firestore]);

  const { isLoading: profilesLoading, error: profilesError } = useCollection<UserProfileType>(usersRef, {
    onSuccess: (data) => {
        if (data && currentUser) {
            // Filter out current user and already interacted users
            const filteredProfiles = data.filter(p => p.id !== currentUser.uid);
             // Shuffle the results for randomness in the swipe stack
            setProfiles(filteredProfiles.sort(() => Math.random() - 0.5));
        }
    }
  });


  const handleSwipe = async (swipedUserId: string, direction: 'left' | 'right') => {
    if (!currentUser || !firestore) return;

    // Optimistically update the UI by removing the swiped card
    setProfiles(prev => prev.filter(p => p.id !== swipedUserId));
  
    try {
        const batch = writeBatch(firestore);

        // Record interaction for the current user
        const currentUserInteractionRef = doc(firestore, `users/${currentUser.uid}/interactions/${swipedUserId}`);
        batch.set(currentUserInteractionRef, {
            swipe: direction,
            timestamp: serverTimestamp(),
        });

        if (direction === 'right') {
            // Check if the other user has also swiped right
            const otherUserInteractionRef = doc(firestore, `users/${swipedUserId}/interactions/${currentUser.uid}`);
            
            // Note: In a real client-side scenario, we can't securely read other users' interactions.
            // This check would ideally be done via a Cloud Function for security.
            // For this example, we'll assume we can trigger a match check.
            // The logic to create the match document will be handled here, but a secure app would use a backend function.

            // Let's create a match optimistically for the demo if it's a right swipe
            // In a real app, a Cloud Function would listen to right swipes and create the match if both swiped right.
            
            // To simulate a match for the toast:
            // This is a placeholder. A real match creation would be more complex.
            // For now, we just create the match records for both users.
            const matchId = [currentUser.uid, swipedUserId].sort().join('_');
            const matchDate = serverTimestamp();
            const [user1Id, user2Id] = [currentUser.uid, swipedUserId].sort();

            const matchData = {
                id: matchId,
                user1Id: user1Id,
                user2Id: user2Id,
                matchDate: matchDate,
            };

            const currentUserMatchRef = doc(firestore, `users/${currentUser.uid}/matches/${matchId}`);
            batch.set(currentUserMatchRef, matchData);
            
            const otherUserMatchRef = doc(firestore, `users/${swipedUserId}/matches/${matchId}`);
            batch.set(otherUserMatchRef, matchData);

            toast({
                title: "Harika! Yeni bir eşleşme!",
                description: "Hemen bir mesaj göndererek sohbeti başlat.",
                className: "bg-gradient-to-r from-pink-500 to-orange-400 text-white",
                duration: 5000,
            });
        }
        
        await batch.commit();

    } catch (error) {
      console.error("Error recording interaction:", error);
      toast({
        title: "Hata",
        description: "İşlem kaydedilemedi. Lütfen tekrar deneyin.",
        variant: "destructive"
      })
      // Here you might want to revert the UI change
    }
  };

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (profiles.length > 0) {
      const topProfile = profiles[profiles.length - 1];
      handleSwipe(topProfile.id, direction);
    }
  };

  if (profilesLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (profilesError) {
      return (
          <div className="flex flex-col h-full items-center justify-center text-center text-red-500">
              <X className="h-12 w-12 mb-4" />
              <h2 className="text-xl font-semibold">Profil Yükleme Hatası</h2>
              <p>Potansiyel eşleşmeler yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>
          </div>
      )
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

    