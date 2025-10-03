
"use client";

import { useState } from "react";
import ProfileCard from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import { mockProfiles } from "@/lib/data";
import type { UserProfile } from "@/lib/types";
import { Heart, X, Undo, Star, Zap } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function AnasayfaPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>(mockProfiles);

  const handleSwipe = (profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
  };
  
  const activeProfile = profiles.length > 0 ? profiles[profiles.length - 1] : null;

  const triggerSwipe = () => {
    if (activeProfile) {
      handleSwipe(activeProfile.id);
    }
  };
  
  const resetProfiles = () => {
    setProfiles(mockProfiles);
  };

  return (
    <div className="flex flex-col h-full bg-muted/20 dark:bg-black overflow-hidden">
      <div className="relative flex-1 flex items-center justify-center">
        {/* Profile cards container */}
        <div className="relative w-full h-full max-w-md max-h-[calc(100vh-130px)] aspect-[9/16] mt-[-50px]">
          <AnimatePresence>
            {activeProfile ? (
              profiles.map((profile, index) => {
                const isTopCard = index === profiles.length - 1;
                return (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    onSwipe={() => handleSwipe(profile.id)}
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

        {/* Action buttons - Overlay */}
        {activeProfile && (
           <div className="absolute bottom-[-1.5rem] left-0 right-0 z-50 flex w-full items-center justify-evenly px-4">
           <Button onClick={() => {}} variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-white/95 text-yellow-500 shadow-lg hover:bg-gray-100 transform transition-transform hover:scale-110 backdrop-blur-sm">
             <Undo className="h-6 w-6" />
           </Button>
           <Button onClick={() => triggerSwipe()} variant="ghost" size="icon" className="h-20 w-20 rounded-full bg-white/95 text-red-500 shadow-lg hover:bg-gray-100 transform transition-transform hover:scale-110 backdrop-blur-sm">
             <X className="h-10 w-10" />
           </Button>
           <Button onClick={() => {}} variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-white/95 text-blue-400 shadow-lg hover:bg-gray-100 transform transition-transform hover:scale-110 backdrop-blur-sm">
             <Star className="h-7 w-7 fill-current" />
           </Button>
           <Button onClick={() => triggerSwipe()} variant="ghost" size="icon" className="h-20 w-20 rounded-full bg-white/95 text-green-400 shadow-lg hover:bg-gray-100 transform transition-transform hover:scale-110 backdrop-blur-sm">
             <Heart className="h-10 w-10 fill-current" />
           </Button>
           <Button onClick={() => {}} variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-white/95 text-purple-500 shadow-lg hover:bg-gray-100 transform transition-transform hover:scale-110 backdrop-blur-sm">
             <Zap className="h-6 w-6 fill-current" />
           </Button>
         </div>
        )}
      </div>
    </div>
  );
}
