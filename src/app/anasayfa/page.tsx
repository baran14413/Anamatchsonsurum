"use client";

import { useState, useEffect, useMemo } from "react";
import ProfileCard from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import type { UserProfile as UserProfileType } from "@/lib/types";
import { Heart, X, Loader2, Undo2, Star, Send, RotateCw } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";
import { langTr } from "@/languages/tr";

export default function AnasayfaPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfileType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = langTr;

  const fetchProfiles = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/get-potential-matches', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Profiller yüklenemedi.");
      }
      const data: UserProfileType[] = await response.json();
      setProfiles(data);
      setCurrentIndex(0);
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
      toast({
        title: t.common.error,
        description: err.message || "Profiller yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const activeProfiles = useMemo(() => {
    return profiles.slice(currentIndex, currentIndex + 2).reverse();
  }, [currentIndex, profiles]);


  const recordSwipe = async (swipedUserId: string, direction: 'left' | 'right') => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/record-swipe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ swipedUserId, direction })
        });
        
        const result = await response.json();

        if (result.match) {
           toast({
                title: t.anasayfa.matchToastTitle,
                description: t.anasayfa.matchToastDescription,
                className: "bg-gradient-to-r from-pink-500 to-orange-400 text-white",
                duration: 5000,
            });
        }
      } catch (error) {
        console.error("Swipe kaydı başarısız:", error);
      }
  };
  
  const handleSwipe = (swipedUserId: string, direction: 'left' | 'right') => {
    setCurrentIndex(prev => prev + 1);
    recordSwipe(swipedUserId, direction);
  };
  
  const triggerSwipe = (direction: 'left' | 'right') => {
    const topProfile = activeProfiles[activeProfiles.length - 1];
    if (topProfile) {
       handleSwipe(topProfile.uid, direction);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
       return (
        <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground px-8">
            <X className="h-16 w-16 mb-4 text-red-400" />
            <h2 className="text-2xl font-semibold text-foreground">{t.common.error}</h2>
            <p className="mb-4">{error}</p>
            <Button onClick={fetchProfiles}>
                <RotateCw className="mr-2 h-4 w-4" />
                Tekrar Dene
            </Button>
        </div>
       )
    }

    if (activeProfiles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground px-8">
          <Heart className="h-16 w-16 mb-4 text-gray-300" />
          <h2 className="text-2xl font-semibold text-foreground">{t.anasayfa.outOfProfilesTitle}</h2>
          <p className="mb-4">{t.anasayfa.outOfProfilesDescription}</p>
           <Button onClick={fetchProfiles}>
                <RotateCw className="mr-2 h-4 w-4" />
                Yeniden Kontrol Et
            </Button>
        </div>
      );
    }

    return (
      <AnimatePresence>
        {activeProfiles.map((profile, index) => (
          <ProfileCard
            key={profile.uid}
            profile={profile}
            isTop={index === activeProfiles.length - 1}
            onSwipe={(dir) => handleSwipe(profile.uid, dir)}
          />
        ))}
      </AnimatePresence>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/20 dark:bg-black overflow-hidden">
      <div className="relative flex-1 flex flex-col items-center justify-center pb-24">
        <div className="relative w-full h-full max-w-md">
         {renderContent()}
        </div>
      </div>

      {activeProfiles.length > 0 && (
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
