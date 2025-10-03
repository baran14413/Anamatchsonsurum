
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
    scale: 0.8,
    y: 20
  },
  animate: (zIndex: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    zIndex,
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
      const exitX = direction === 'left' ? -400 : 400;
      x.set(exitX, { duration: 0.4 });
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
      className="absolute inset-0"
      style={{ x, rotate, zIndex }}
      drag={isTopCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit={() => cardVariants.exit(direction || 'right')}
      custom={zIndex}
    >
      <div className="relative h-full w-full select-none overflow-hidden rounded-xl bg-card shadow-xl">
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

        <div className="absolute inset-x-0 top-0 h-20 w-full z-10">
            {profile.images.length > 1 && (
                <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                    {profile.images.map((_, index) => (
                        <div key={index} className="h-1 flex-1 rounded-full bg-white/40">
                            <div
                                className="h-full rounded-full bg-white"
                                style={{ width: index === currentImageIndex ? '100%' : '0%'}}
                            />
                        </div>
                    ))}
                </div>
            )}
            <div className="absolute top-0 left-0 h-full w-1/2" onClick={(e) => handleImageNavigation(e, 'prev')} />
            <div className="absolute top-0 right-0 h-full w-1/2" onClick={(e) => handleImageNavigation(e, 'next')} />
        </div>


        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 text-white z-20">
          <div className="flex items-end justify-between">
            <div className="max-w-[calc(100%-40px)]">
              <h2 className="text-2xl font-bold drop-shadow-md">
                {profile.name}, <span className="font-light">{profile.age}</span>
              </h2>
              <p className="mt-1 text-white/95 drop-shadow-sm text-base truncate">{profile.bio}</p>
            </div>
             <button className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/20 backdrop-blur-sm">
                <ChevronUp className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
