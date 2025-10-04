
"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from 'swr';
import ProfileCard from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import type { UserProfile as UserProfileType } from "@/lib/types";
import { Heart, X, Loader2, Undo2, Star, Send } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";
import { mockProfiles } from "@/lib/data";

const fetcher = async (url: string, idToken: string) => {
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error("Fetcher Error Response:", errorText);
        try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || 'Failed to fetch matches');
        } catch (e) {
            throw new Error('Profil yükleme hatası. Sunucu yanıtı geçersiz.');
        }
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
        try {
            const token = await user.getIdToken();
            setIdToken(token);
        } catch (error) {
            console.error("Error getting ID token:", error);
            setIdToken(null);
        }
      } else {
        setIdToken(null);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  const { data: fetchedProfiles, error, isLoading, mutate } = useSWR<UserProfileType[]>(
    idToken ? [`/api/get-potential-matches`, idToken] : null,
    ([url, token]) => fetcher(url, token),
    { revalidateOnFocus: false }
  );

  const profilesToRender = useMemo(() => {
    if (fetchedProfiles && !error) {
      return fetchedProfiles;
    }
    // If there's an error or it's loading and there are no profiles yet, use mocks.
    return mockProfiles;
  }, [fetchedProfiles, error]);

  const [currentIndex, setCurrentIndex] = useState(profilesToRender.length - 1);
  
  useEffect(() => {
    setCurrentIndex(profilesToRender.length - 1);
  }, [profilesToRender]);


  const handleSwipe = async (swipedUserId: string, direction: 'right' | 'left') => {
    const isMock = !fetchedProfiles || !!error;

    // Immediately remove card from UI by decrementing index
    setCurrentIndex(prev => prev - 1);

    if (isMock || !idToken) {
        return;
    }
    
    // Don't use SWR's mutate for optimistic UI, we manage it with currentIndex
  
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
        // If we've run out of real profiles, refetch
        if (currentIndex <= 0) {
          mutate();
        }

    } catch (error: any) {
      console.error("Error recording interaction:", error);
      toast({
        title: "Hata",
        description: error.message || "İşlem kaydedilemedi. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
      // On error, trigger a revalidation to get fresh data.
      mutate();
    }
  };

  const triggerSwipe = (direction: 'left' | 'right') => {
    const topProfile = profilesToRender[currentIndex];
    if (topProfile) {
      handleSwipe(topProfile.id, direction);
    }
  };
  
  if ((isLoading && !fetchedProfiles) || !idToken) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const topProfile = profilesToRender[currentIndex];

  return (
    <div className="flex flex-col h-full bg-muted/20 dark:bg-black overflow-hidden">
      <div className="relative flex-1 flex flex-col items-center justify-center pb-24">
        <div className="relative w-full h-full max-w-md">
          <AnimatePresence>
            {topProfile ? (
              <ProfileCard
                key={topProfile.id}
                profile={topProfile}
                onSwipe={(dir) => handleSwipe(topProfile.id, dir)}
              />
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

      {topProfile && (
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
