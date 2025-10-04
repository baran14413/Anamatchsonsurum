
"use client";

import { useState, useEffect } from "react";
import useSWR from 'swr';
import ProfileCard from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import type { UserProfile as UserProfileType } from "@/lib/types";
import { Heart, X, Loader2, Undo2, Star, Send } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";
import { mockProfiles } from "@/lib/data"; // Import dummy data

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

  const { data: fetchedProfiles, error, isLoading, mutate } = useSWR<UserProfileType[]>(
    idToken ? ['/api/get-potential-matches', idToken] : null,
    ([url, token]) => fetcher(url, token)
  );

  // Use fetched profiles if available and not empty, otherwise fallback to mock data.
  // This also covers the error case gracefully.
  const profiles = (fetchedProfiles && fetchedProfiles.length > 0) ? fetchedProfiles : mockProfiles;
  const usingMockData = !fetchedProfiles || fetchedProfiles.length === 0;

  const handleSwipe = async (swipedUserId: string, direction: 'right' | 'left') => {
    if (usingMockData) {
        // For mock data, just remove the card locally without an API call.
        mutate(currentProfiles => (currentProfiles || []).filter(p => p.id !== swipedUserId), false);
        return;
    }
      
    if (!idToken) return;

    // Optimistic UI update: remove the card immediately.
    mutate(currentProfiles => (currentProfiles || []).filter(p => p.id !== swipedUserId), false);
  
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
        // No need to re-fetch here, optimistic update is enough for swiping
    } catch (error: any) {
      console.error("Error recording interaction:", error);
      toast({
        title: "Hata",
        description: error.message || "İşlem kaydedilemedi. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
      // On error, trigger a revalidation to revert the optimistic update and get fresh data.
      mutate();
    }
  };

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (profiles.length > 0) {
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
  
  if (error && usingMockData) {
      // This block can be used to show a specific error UI if needed,
      // but for now, we just fall back to mock data.
      console.warn("Failed to fetch profiles, showing mock data. Error:", error.message);
  }

  const activeProfile = profiles.length > 0 ? profiles[profiles.length - 1] : null;

  return (
    <div className="flex flex-col h-full bg-muted/20 dark:bg-black overflow-hidden">
      <div className="relative flex-1 flex flex-col items-center justify-center pb-24">
        <div className="relative w-full h-full max-w-md">
          <AnimatePresence>
            {profiles.length > 0 ? (
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
        <div className="absolute bottom-20 left-0 right-0 z-20 flex w-full items-center justify-center gap-x-3 py-4 shrink-0">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white text-yellow-500 shadow-lg hover:bg-gray-100 transform transition-transform hover:scale-110">
            <Undo2 className="h-6 w-6" />
          </Button>
          <Button onClick={() => triggerSwipe('left')} variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white text-red-500 shadow-xl hover:bg-gray-100 transform transition-transform hover:scale-110">
            <X className="h-8 w-8" />
          </Button>
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white text-blue-500 shadow-lg hover:bg-gray-100 transform transition-transform hover:scale-110">
            <Star className="h-6 w-6 fill-current" />
          </Button>
          <Button onClick={() => triggerSwipe('right')} variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white text-green-400 shadow-xl hover:bg-gray-100 transform transition-transform hover:scale-110">
            <Heart className="h-8 w-8 fill-current" />
          </Button>
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white text-blue-400 shadow-lg hover:bg-gray-100 transform transition-transform hover:scale-110">
            <Send className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
