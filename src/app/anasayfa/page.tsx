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
  const [direction, setDirection] = useState<"left" | "right" | "up" | "down" | null>(null);

  const handleSwipe = (profileId: string, swipeDirection: "left" | "right") => {
    setDirection(swipeDirection);
    // Add a small delay to allow animation to complete before removing
    setTimeout(() => {
        setProfiles((prev) => prev.filter((p) => p.id !== profileId));
        setDirection(null);
    }, 300);
  };

  const activeProfile = profiles[profiles.length - 1];

  const triggerSwipe = (swipeDirection: "left" | "right") => {
    if (activeProfile) {
        handleSwipe(activeProfile.id, swipeDirection);
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gray-100 dark:bg-black">
      <div className="relative h-full w-full max-w-md">
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
                  direction={direction}
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
              <Button onClick={() => setProfiles(mockProfiles)} className="mt-6 bg-white text-foreground hover:bg-gray-200 shadow-md">
                <Undo className="mr-2 h-4 w-4" />
                Yeniden Başla
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {profiles.length > 0 && (
          <div className="absolute bottom-[80px] flex w-full max-w-md items-center justify-around p-4">
              <Button onClick={() => {}} variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-white shadow-lg text-yellow-500 hover:bg-gray-100 transform transition-transform hover:scale-110">
                  <Undo className="h-7 w-7" />
              </Button>
              <Button onClick={() => triggerSwipe('left')} variant="ghost" size="icon" className="h-20 w-20 rounded-full bg-white shadow-lg text-red-500 hover:bg-gray-100 transform transition-transform hover:scale-110">
                  <X className="h-10 w-10" />
              </Button>
               <Button onClick={() => {}} variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-white shadow-lg text-blue-400 hover:bg-gray-100 transform transition-transform hover:scale-110">
                  <Star className="h-7 w-7 fill-current" />
              </Button>
              <Button onClick={() => triggerSwipe('right')} variant="ghost" size="icon" className="h-20 w-20 rounded-full bg-white shadow-lg text-green-500 hover:bg-gray-100 transform transition-transform hover:scale-110">
                  <Heart className="h-10 w-10 fill-current" />
              </Button>
               <Button onClick={() => {}} variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-white shadow-lg text-purple-500 hover:bg-gray-100 transform transition-transform hover:scale-110">
                  <Zap className="h-7 w-7" />
               </Button>
          </div>
      )}
    </div>
  );
}
