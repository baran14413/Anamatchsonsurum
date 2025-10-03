
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
  initial: (zIndex: number) => ({ 
    scale: 1 - (3 - zIndex) * 0.05,
    y: (3 - zIndex) * -10,
    opacity: zIndex === 3 ? 1 : 0.8,
  }),
  animate: { 
    scale: 1, 
    y: 0, 
    opacity: 1, 
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } 
  },
  exit: (direction: "left" | "right") => {
    return {
      x: direction === "left" ? -500 : 500,
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    };
  }
};


export default function ProfileCard({ profile, onSwipe, isTopCard, direction, zIndex }: ProfileCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-20, 20]);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 5) return;
    if (info.offset.x < -100) {
      onSwipe("left");
    } else if (info.offset.x > 100) {
      onSwipe("right");
    }
  };
  
  useEffect(() => {
    if (direction && isTopCard) {
      const exitX = direction === 'left' ? -500 : 500;
      x.set(exitX);
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
      className="absolute h-full w-full"
      style={{ x, rotate, opacity, zIndex }}
      drag={isTopCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit={() => cardVariants.exit(direction || 'right')}
      custom={direction}
    >
      <div className="relative h-full w-full select-none overflow-hidden rounded-2xl bg-card shadow-2xl">
        <AnimatePresence initial={false}>
            <motion.div
              key={currentImageIndex}
              className="absolute inset-0"
              initial={{ opacity: 0.6, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
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

        {profile.images.length > 1 && (
            <>
                <div className="absolute left-0 top-0 h-full w-1/2 z-10" onClick={(e) => handleImageNavigation(e, 'prev')} />
                <div className="absolute right-0 top-0 h-full w-1/2 z-10" onClick={(e) => handleImageNavigation(e, 'next')} />
                <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                    {profile.images.map((_, index) => (
                        <div key={index} className="h-1 flex-1 rounded-full bg-white/40 backdrop-blur-sm">
                            <motion.div
                                className="h-full rounded-full bg-white"
                                initial={{ width: '0%' }}
                                animate={{ width: index === currentImageIndex ? '100%' : '0%'}}
                                transition={{ duration: 0.1, ease: 'linear' }}
                            />
                        </div>
                    ))}
                </div>
            </>
        )}

        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 via-black/50 to-transparent p-5 text-white z-20">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold">
                {profile.name}, <span className="font-light">{profile.age}</span>
              </h2>
              <p className="mt-1 text-white/90 max-w-[90%] text-base">{profile.bio}</p>
            </div>
             <button className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white/30 backdrop-blur-sm">
                <ChevronUp className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
