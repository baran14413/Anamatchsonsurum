
"use client";

import { useState, useEffect } from "react";
import useSWR from 'swr';
import ProfileCard from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import type { UserProfile as UserProfileType } from "@/lib/types";
import { Heart, X, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";

const fetcher = async (url: string, idToken: string) => {
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || 'Failed to fetch matches');
    }
    return res.json();
};

export default function AnasayfaPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setIdToken(token);
      } else {
        setIdToken(null);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  const { data: profiles, error, isLoading, mutate } = useSWR(
    idToken ? ['/api/get-potential-matches', idToken] : null,
    ([url, token]) => fetcher(url, token)
  );

  const handleSwipe = async (swipedUserId: string, direction: 'right' | 'left') => {
    if (!idToken) return;

    // Optimistically update the UI by removing the swiped card
    mutate(
        (currentProfiles: UserProfileType[] = []) => currentProfiles.filter(p => p.id !== swipedUserId),
        false
    );
  
    try {
        const response = await fetch('/api/record-swipe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ swipedUserId, direction }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Swipe kaydedilemedi.");
        }

        if (result.match) {
            toast({
                title: "Harika! Yeni bir eşleşme!",
                description: "Hemen bir mesaj göndererek sohbeti başlat.",
                className: "bg-gradient-to-r from-pink-500 to-orange-400 text-white",
                duration: 5000,
            });
        }
    } catch (error: any) {
      console.error("Error recording interaction:", error);
      toast({
        title: "Hata",
        description: error.message || "İşlem kaydedilemedi. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
      // Re-fetch data on error to revert optimistic update
      mutate();
    }
  };

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (profiles && profiles.length > 0) {
      const topProfile = profiles[profiles.length - 1];
      handleSwipe(topProfile.id, direction);
    }
  };

  if (isLoading || !idToken) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (error) {
      return (
          <div className="flex flex-col h-full items-center justify-center text-center text-red-500 px-4">
              <X className="h-12 w-12 mb-4" />
              <h2 className="text-xl font-semibold">Profil Yükleme Hatası</h2>
              <p>{error.message}</p>
          </div>
      )
  }

  const activeProfile = profiles && profiles.length > 0 ? profiles[profiles.length - 1] : null;

  return (
    <div className="flex flex-col h-full bg-muted/20 dark:bg-black overflow-hidden">
      <div className="relative flex-1 flex flex-col items-center justify-center pb-16">
        <div className="relative w-full h-full max-w-md">
          <AnimatePresence>
            {profiles && profiles.length > 0 ? (
              profiles.map((profile: UserProfileType, index: number) => {
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
