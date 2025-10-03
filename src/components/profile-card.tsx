
"use client";

import type { UserProfile } from "@/lib/types";
import Image from "next/image";
import { PanInfo, motion } from "framer-motion";
import { useState } from "react";
import { ChevronUp } from "lucide-react";

interface ProfileCardProps {
  profile: UserProfile;
  onSwipe: (direction: "left" | "right") => void;
  isTopCard: boolean;
  zIndex: number;
}

const cardVariants = {
  initial: (custom: { isTopCard: boolean }) => ({
    opacity: custom.isTopCard ? 1 : 0.5,
    scale: 1 - (custom.zIndex * 0.05),
    y: custom.zIndex * 10,
  }),
  animate: (custom: { zIndex: number }) => ({
    opacity: 1,
    scale: 1 - (custom.zIndex * 0.05),
    y: custom.zIndex * 10,
    zIndex: custom.zIndex,
    transition: { duration: 0.3, ease: "easeOut" }
  }),
  exit: {
    x: 0, // This will be controlled by drag gesture
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.4, ease: "easeIn" }
  }
};


export default function ProfileCard({ profile, onSwipe, isTopCard, zIndex }: ProfileCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isTopCard) return;
    if (info.offset.x < -100) {
      onSwipe("left");
    } else if (info.offset.x > 100) {
      onSwipe("right");
    }
  };
  
  const handleImageNavigation = (e: React.MouseEvent, navDirection: 'prev' | 'next') => {
    e.stopPropagation();
    if(navDirection === 'next') {
        setCurrentImageIndex((prev) => (prev + 1) % profile.images.length);
    } else {
        setCurrentImageIndex((prev) => (prev - 1 + profile.images.length) % profile.images.length);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ zIndex }}
      drag={isTopCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
      variants={cardVariants}
      initial="initial"
      animate={{ 
        x:0,
        opacity: 1,
        scale: 1,
        transition: { duration: 0.3 }
       }}
      exit={(direction: 'left' | 'right') => {
        return {
          x: direction === 'left' ? -400 : 400,
          opacity: 0,
          rotate: direction === 'left' ? -20: 20,
          transition: { ease: 'easeInOut', duration: 0.4}
        }
      }}
      custom={{zIndex, isTopCard}}
    >
      <div className="relative h-full w-full select-none overflow-hidden rounded-2xl bg-card shadow-2xl">
        {/* Image with progress bars */}
        <div className="absolute inset-0">
          <Image
            src={profile.images[currentImageIndex]}
            alt={profile.name}
            fill
            className="object-cover"
            priority={isTopCard}
            data-ai-hint="person portrait"
          />
          {/* Image navigation overlays */}
          <div className="absolute inset-0 flex">
            <div className="flex-1" onClick={(e) => handleImageNavigation(e, 'prev')} />
            <div className="flex-1" onClick={(e) => handleImageNavigation(e, 'next')} />
          </div>
          {/* Image progress bars */}
          {profile.images.length > 1 && (
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
              {profile.images.map((_, index) => (
                <div key={index} className="h-1 flex-1 rounded-full bg-white/40 overflow-hidden">
                  {index === currentImageIndex && (
                     <motion.div
                        className="h-full bg-white"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 5, ease: 'linear' }}
                     />
                  )}
                   {index < currentImageIndex && (
                     <div className="h-full w-full bg-white" />
                   )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Overlay */}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pb-28 text-white z-10">
          <div className="flex items-end justify-between">
            <div className="max-w-[calc(100%-50px)]">
              <h2 className="text-3xl font-bold drop-shadow-lg">
                {profile.name}, <span className="font-light">{profile.age}</span>
              </h2>
              <p className="mt-1 text-white/95 drop-shadow-md text-lg truncate">{profile.bio}</p>
            </div>
            <button className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/80 bg-white/30 backdrop-blur-md">
              <ChevronUp className="h-7 w-7" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
