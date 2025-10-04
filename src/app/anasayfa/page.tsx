
"use client";

import { useState, useEffect } from "react";
import ProfileCard from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import type { UserProfile as UserProfileType } from "@/lib/types";
import { Heart, X, Loader2, Undo2, Star, Send } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { mockProfiles } from "@/lib/data";
import { useLanguage } from "@/hooks/use-language";
import { langEn } from "@/languages/en";
import { langTr } from "@/languages/tr";

export default function AnasayfaPage() {
  const { toast } = useToast();
  const [visibleProfiles, setVisibleProfiles] = useState<UserProfileType[]>([]);
  const { lang } = useLanguage();
  const t = lang === 'en' ? langEn : langTr;

  useEffect(() => {
    // Load mock profiles on component mount
    setVisibleProfiles(mockProfiles);
  }, []);

  const handleSwipe = (swipedUserId: string, direction: 'right' | 'left') => {
    // Optimistically remove the card from the UI
    setVisibleProfiles(prev => prev.filter(p => p.id !== swipedUserId));

    if (direction === 'right') {
        // Simulate a match randomly
        if (Math.random() > 0.7) { // 30% chance of a match
            toast({
                title: t.anasayfa.matchToastTitle,
                description: t.anasayfa.matchToastDescription,
                className: "bg-gradient-to-r from-pink-500 to-orange-400 text-white",
                duration: 5000,
            });
        }
    }
    
    // If we've run out of mock profiles, reset them for continuous testing
    if (visibleProfiles.length <= 1) {
      toast({ title: t.anasayfa.resetToastTitle, description: t.anasayfa.resetToastDescription });
      setVisibleProfiles(mockProfiles);
    }
  };

  const triggerSwipe = (direction: 'left' | 'right') => {
    const topProfile = visibleProfiles[visibleProfiles.length - 1];
    if (topProfile) {
      handleSwipe(topProfile.id, direction);
    }
  };
  
  // Show loader only if profiles haven't been loaded yet.
  if (visibleProfiles.length === 0) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const activeProfile = visibleProfiles[visibleProfiles.length - 1];

  return (
    <div className="flex flex-col h-full bg-muted/20 dark:bg-black overflow-hidden">
      <div className="relative flex-1 flex flex-col items-center justify-center pb-24">
        <div className="relative w-full h-full max-w-md">
          <AnimatePresence>
            {activeProfile ? (
              <ProfileCard
                key={activeProfile.id}
                profile={activeProfile}
                isTop={true}
                onSwipe={(dir) => handleSwipe(activeProfile.id, dir)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground px-8">
                <Heart className="h-16 w-16 mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold text-foreground">{t.anasayfa.outOfProfilesTitle}</h2>
                <p>{t.anasayfa.outOfProfilesDescription}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {visibleProfiles.length > 0 && (
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
