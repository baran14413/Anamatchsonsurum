
"use client";

import { useState } from "react";
import ProfileCard from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import { mockProfiles } from "@/lib/data";
import type { UserProfile } from "@/lib/types";
import { Heart, X, Undo, Star, Zap } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function AnasayfaPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>(mockProfiles);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  const handleSwipe = (profileId: string, swipeDirection: "left" | "right") => {
    // Set direction for exit animation
    setDirection(swipeDirection);
    
    // Use a timeout to allow the exit animation to complete
    setTimeout(() => {
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      // Reset direction after animation
      setDirection(null); 
    }, 400); 
  };
  
  // Find the active profile (the last one in the array)
  const activeProfile = profiles.length > 0 ? profiles[profiles.length - 1] : null;

  const triggerSwipe = (swipeDirection: "left" | "right") => {
    if (activeProfile) {
      handleSwipe(activeProfile.id, swipeDirection);
    }
  };
  
  const resetProfiles = () => {
    setProfiles(mockProfiles);
  };

  return (
    <div className="flex flex-col h-full bg-muted/20 dark:bg-black">
      {/* Main content area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        
        {/* Profile cards container */}
        <div className="relative w-full h-full max-w-md max-h-[85vh] aspect-[9/16]">
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
                    zIndex={index}
                  />
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center text-center h-full text-muted-foreground px-8"
              >
                <Heart className="h-16 w-16 mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold text-foreground">Herkes Tükendi!</h2>
                <p>Daha sonra yeni profiller için tekrar kontrol et.</p>
                <Button onClick={resetProfiles} className="mt-6 bg-white text-foreground hover:bg-gray-200 shadow-md">
                  <Undo className="mr-2 h-4 w-4" />
                  Yeniden Başla
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons - Overlay */}
        {activeProfile && (
          <div className="absolute bottom-6 left-0 right-0 z-50 flex w-full items-center justify-evenly px-4">
            <Button onClick={() => {}} variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white text-yellow-500 shadow-xl hover:bg-gray-100 transform transition-transform hover:scale-110">
              <Undo className="h-7 w-7" />
            </Button>
            <Button onClick={() => triggerSwipe('left')} variant="ghost" size="icon" className="h-20 w-20 rounded-full bg-white text-red-500 shadow-xl hover:bg-gray-100 transform transition-transform hover:scale-110">
              <X className="h-10 w-10" />
            </Button>
            <Button onClick={() => {}} variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white text-blue-400 shadow-xl hover:bg-gray-100 transform transition-transform hover:scale-110">
              <Star className="h-8 w-8 fill-current" />
            </Button>
            <Button onClick={() => triggerSwipe('right')} variant="ghost" size="icon" className="h-20 w-20 rounded-full bg-white text-green-400 shadow-xl hover:bg-gray-100 transform transition-transform hover:scale-110">
              <Heart className="h-10 w-10 fill-current" />
            </Button>
            <Button onClick={() => {}} variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white text-purple-500 shadow-xl hover:bg-gray-100 transform transition-transform hover:scale-110">
              <Zap className="h-7 w-7 fill-current" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
