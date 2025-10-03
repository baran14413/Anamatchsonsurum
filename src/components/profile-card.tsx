
"use client";

import type { UserProfile } from "@/lib/types";
import Image from "next/image";
import { PanInfo, motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import { ChevronUp, MapPin } from "lucide-react";

interface ProfileCardProps {
  profile: UserProfile;
  onSwipe: () => void;
  isTopCard: boolean;
}

export default function ProfileCard({ profile, onSwipe, isTopCard }: ProfileCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) {
      onSwipe();
    } else if (info.offset.x > 100) {
      onSwipe();
    }
  };

  const handleImageNavigation = (e: React.MouseEvent, navDirection: 'prev' | 'next') => {
    e.stopPropagation();
    if(navDirection === 'next') {
        setCurrentImageIndex((prev) => Math.min(prev + 1, profile.images.length - 1));
    } else {
        setCurrentImageIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, zIndex: isTopCard ? 2 : 1 }}
      drag={isTopCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
      animate={{
        scale: 1 - (isTopCard ? 0 : 0.05),
        y: isTopCard ? 0 : 15,
        opacity: isTopCard ? 1 : 0.7,
      }}
      exit={{
        x: x.get() > 0 ? 300 : -300,
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.3 }
      }}
    >
      <div className="relative h-full w-full select-none overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="absolute inset-0">
          <Image
            src={profile.images[currentImageIndex]}
            alt={profile.name}
            fill
            className="object-cover"
            priority={isTopCard}
            data-ai-hint="person portrait"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent"></div>
          <div className="absolute inset-0 flex">
            <div className="flex-1" onClick={(e) => handleImageNavigation(e, 'prev')} />
            <div className="flex-1" onClick={(e) => handleImageNavigation(e, 'next')} />
          </div>
          {profile.images.length > 1 && (
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
              {profile.images.map((_, index) => (
                <div key={index} className="h-1 flex-1 rounded-full bg-white/40 overflow-hidden">
                   <div className={`h-full rounded-full ${index <= currentImageIndex ? 'bg-white' : ''}`}></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 w-full p-5 text-white z-10 space-y-2">
           <div className="flex items-center gap-1.5">
             <MapPin className="h-5 w-5 text-white fill-white" />
             <p className="font-semibold">Yakınlarda</p>
           </div>
          <div className="flex items-end justify-between">
            <div className="max-w-[calc(100%-50px)]">
              <h2 className="text-3xl font-bold drop-shadow-lg">
                {profile.name}, <span className="font-light">{profile.age}</span>
              </h2>
              <p className="mt-1 text-white/95 drop-shadow-md text-base truncate">{profile.interests.join(' • ')}</p>
              <p className="text-white/80 drop-shadow-md text-sm">1 km uzakta</p>
            </div>
            <button className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/60 bg-black/30 backdrop-blur-md">
              <ChevronUp className="h-7 w-7" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
