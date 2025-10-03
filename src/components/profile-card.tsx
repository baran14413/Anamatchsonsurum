
"use client";

import type { UserProfile } from "@/lib/types";
import Image from "next/image";
import { PanInfo, motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

interface ProfileCardProps {
  profile: UserProfile;
  onSwipe: (direction: "left" | "right") => void;
  isTopCard: boolean;
  direction: "left" | "right" | "up" | "down" | null;
  zIndex: number;
}

const cardVariants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 10
  },
  animate: (custom: { zIndex: number, isTopCard: boolean }) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    zIndex: custom.zIndex,
    transition: { duration: 0.3, ease: "easeOut" } 
  }),
  exit: (direction: "left" | "right") => {
    return {
      x: direction === "left" ? -400 : 400,
      opacity: 0,
      rotate: direction === "left" ? -20 : 20,
      transition: { duration: 0.4, ease: "easeIn" }
    };
  }
};


export default function ProfileCard({ profile, onSwipe, isTopCard, direction, zIndex }: ProfileCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-20, 20]);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 50) {
        x.set(0);
        return;
    };
    if (info.offset.x < -50) {
      onSwipe("left");
    } else if (info.offset.x > 50) {
      onSwipe("right");
    }
  };
  
  useEffect(() => {
    if (direction && isTopCard) {
      x.set(direction === 'left' ? -400 : 400, { duration: 0.4 });
    }
  }, [direction, isTopCard, x]);

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
      className="absolute inset-0 p-4"
      style={{ x, rotate, zIndex }}
      drag={isTopCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit={() => cardVariants.exit(direction || 'right')}
      custom={{ zIndex, isTopCard }}
    >
      <div className="relative h-full w-full select-none overflow-hidden rounded-2xl bg-card shadow-2xl">
        <AnimatePresence initial={false}>
            <motion.div
              key={currentImageIndex}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.3 } }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
                <Image
                    src={profile.images[currentImageIndex]}
                    alt={profile.name}
                    fill
                    className="object-cover"
                    priority={isTopCard}
                    data-ai-hint="person portrait"
                />
            </motion.div>
        </AnimatePresence>

        <div className="absolute inset-x-0 top-0 h-24 w-full z-10">
            {profile.images.length > 1 && (
                <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                    {profile.images.map((_, index) => (
                        <div key={index} className="h-1 flex-1 rounded-full bg-white/40">
                            <div
                                className="h-full rounded-full bg-white transition-all duration-300"
                                style={{ width: index === currentImageIndex ? '100%' : '0%'}}
                            />
                        </div>
                    ))}
                </div>
            )}
            <div className="absolute top-0 left-0 h-full w-1/2" onClick={(e) => handleImageNavigation(e, 'prev')} />
            <div className="absolute top-0 right-0 h-full w-1/2" onClick={(e) => handleImageNavigation(e, 'next')} />
        </div>

        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white z-20 pb-28">
          <div className="flex items-end justify-between">
            <div className="max-w-[calc(100%-40px)]">
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
