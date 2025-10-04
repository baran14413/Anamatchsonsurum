
"use client";

import { useState } from "react";
import ProfileCard from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import { mockProfiles } from "@/lib/data";
import type { UserProfile } from "@/lib/types";
import { Heart, X, Undo } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function AnasayfaPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>(mockProfiles);
  const [history, setHistory] = useState<UserProfile[]>([]);

  const handleSwipe = (profileId: string, direction: 'left' | 'right') => {
    const swipedProfile = profiles.find(p => p.id === profileId);
    if (swipedProfile) {
      setHistory(prev => [swipedProfile, ...prev]);
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    }
  };
  
  const activeProfile = profiles.length > 0 ? profiles[profiles.length - 1] : null;

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (activeProfile) {
      handleSwipe(activeProfile.id, direction);
    }
  };
  
  const undoSwipe = () => {
    if (history.length > 0) {
      const lastSwiped = history[0];
      setHistory(prev => prev.slice(1));
      setProfiles(prev => [...prev, lastSwiped]);
    }
  };

  const resetProfiles = () => {
    setProfiles(mockProfiles);
    setHistory([]);
  };

  return (
    <div className="flex flex-col h-full bg-muted/20 dark:bg-black overflow-hidden">
      <div className="relative flex-1 flex flex-col items-center justify-center pb-16">
        {/* Profile cards container */}
        <div className="relative w-full h-full max-w-md">
          <AnimatePresence>
            {activeProfile ? (
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
              <div
                className="flex flex-col items-center justify-center text-center h-full text-muted-foreground px-8"
              >
                <Heart className="h-16 w-16 mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold text-foreground">Herkes Tükendi!</h2>
                <p>Daha sonra yeni profiller için tekrar kontrol et.</p>
                <Button onClick={resetProfiles} className="mt-6 bg-white text-foreground hover:bg-gray-200 shadow-md">
                  <Undo className="mr-2 h-4 w-4" />
                  Yeniden Başla
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action buttons */}
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
