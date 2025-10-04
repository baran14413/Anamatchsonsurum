
"use client";

import type { UserProfile } from "@/lib/types";
import Image from "next/image";
import { PanInfo, motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import { ChevronUp, Info, MapPin, Heart, X } from "lucide-react";

interface ProfileCardProps {
  profile: UserProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  isTopCard: boolean;
}

export default function ProfileCard({ profile, onSwipe, isTopCard }: ProfileCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const x = useMotionValue(0);
  
  // Rotate the card as it's dragged
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  
  // Opacity of like/nope indicators
  const likeOpacity = useTransform(x, [10, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -10], [1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) {
      onSwipe('left');
    } else if (info.offset.x > 100) {
      onSwipe('right');
    }
  };

  const handleImageNavigation = (e: React.MouseEvent, navDirection: 'prev' | 'next') => {
    e.stopPropagation(); // Prevent card drag
    if(navDirection === 'next') {
        setCurrentImageIndex((prev) => Math.min(prev + 1, profile.images.length - 1));
    } else {
        setCurrentImageIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ 
        x, 
        rotate, 
        zIndex: isTopCard ? 2 : 1 
      }}
      drag={isTopCard ? "x" : false}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      // Animate properties when card enters/leaves the stack
      initial={{ scale: 1, y: 0, opacity: 1 }}
      animate={{
        scale: isTopCard ? 1 : 0.95,
        y: isTopCard ? 0 : -10,
        opacity: isTopCard ? 1 : 0.5,
      }}
      exit={{
        x: x.get() > 0 ? 300 : -300,
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.2 }
      }}
      transition={{ type: "spring", stiffness: 300, damping: 35 }}
    >
      <div className="relative h-full w-full select-none overflow-hidden rounded-2xl bg-card shadow-xl">
        {/* Swipe Indicators */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute left-8 top-8 z-10 transform">
            <Heart className="h-32 w-32 text-green-400 fill-green-400" strokeWidth={1} />
        </motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute right-8 top-8 z-10 transform">
            <X className="h-32 w-32 text-red-500" strokeWidth={1} />
        </motion.div>

        {/* Main Image */}
        <div className="absolute inset-0">
          <Image
            src={profile.images[currentImageIndex]}
            alt={profile.name}
            fill
            className="object-cover"
            priority={isTopCard}
            data-ai-hint="person portrait"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent"></div>
          
          {/* Image Navigation */}
          <div className="absolute inset-0 flex">
            <div className="flex-1" onClick={(e) => handleImageNavigation(e, 'prev')} />
            <div className="flex-1" onClick={(e) => handleImageNavigation(e, 'next')} />
          </div>

          {/* Image Progress Bar */}
          {profile.images.length > 1 && (
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
              {profile.images.map((_, index) => (
                <div key={index} className="h-1 flex-1 rounded-full bg-white/40 overflow-hidden">
                   <div className={`h-full rounded-full transition-all duration-300 ${index <= currentImageIndex ? 'bg-white' : ''}`}></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info at bottom */}
        <div className="absolute bottom-0 w-full p-5 text-white z-10 space-y-1">
          <div className="flex items-end justify-between">
            <div className="max-w-[calc(100%-50px)]">
              <h2 className="text-3xl font-bold drop-shadow-lg">
                {profile.name}, <span className="font-light">{profile.age}</span>
              </h2>
              <p className="mt-1 text-white/95 drop-shadow-md text-base truncate">{profile.interests.join(' • ')}</p>
            </div>
            <button className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <Info className="h-6 w-6" />
            </button>
          </div>
           <div className="flex items-center gap-1.5 pt-1">
             <MapPin className="h-4 w-4" />
             <p className="font-semibold text-sm">Yakınlarda</p>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
