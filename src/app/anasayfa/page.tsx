
"use client";

import { useState, useEffect } from "react";
import ProfileCard from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import type { UserProfile as UserProfileType } from "@/lib/types";
import { Heart, X, Loader2, PartyPopper } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useUser, useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export default function AnasayfaPage() {
  const { user: currentUser } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [profiles, setProfiles] = useState<UserProfileType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!currentUser || !auth) return;
      setIsLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          throw new Error("Could not get auth token");
        }

        const response = await fetch('/api/get-potential-matches', {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch profiles");
        }

        const data = await response.json();
        setProfiles(data);
      } catch (error) {
        console.error("Error fetching profiles:", error);
        toast({
          title: "Profil Getirme Hatası",
          description: "Potansiyel eşleşmeler getirilirken bir hata oluştu.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
        fetchProfiles();
    }
  }, [currentUser, auth, toast]);

  const handleSwipe = async (profileId: string, direction: 'left' | 'right') => {
    if (!currentUser || !auth) return;

    // Optimistically update the UI by removing the swiped card
    setProfiles(prev => prev.filter(p => p.id !== profileId));
  
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not authenticated");

      const response = await fetch('/api/record-swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          swipedUserId: profileId,
          direction: direction,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record swipe');
      }

      const result = await response.json();

      if (result.match) {
        toast({
            title: "Harika! Yeni bir eşleşme!",
            description: "Hemen bir mesaj göndererek sohbeti başlat.",
            className: "bg-gradient-to-r from-pink-500 to-orange-400 text-white",
            duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error recording interaction:", error);
      // Optionally revert UI update or show an error toast
      toast({
        title: "Hata",
        description: "İşlem kaydedilemedi. Lütfen tekrar deneyin.",
        variant: "destructive"
      })
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
