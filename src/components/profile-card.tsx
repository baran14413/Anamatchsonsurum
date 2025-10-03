"use client";

import type { UserProfile } from "@/lib/types";
import Image from "next/image";
import { Badge } from "./ui/badge";
import { PanInfo, motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface ProfileCardProps {
  profile: UserProfile;
  onSwipe: (direction: "left" | "right") => void;
  isTopCard: boolean;
  direction: "left" | "right" | "up" | "down" | null;
}

const cardVariants = {
  initial: { scale: 0.95, y: 30, opacity: 0 },
  animate: { scale: 1, y: 0, opacity: 1, transition: { duration: 0.3 } },
  exit: (direction: "left" | "right") => {
    return {
      x: direction === "left" ? -300 : 300,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3 }
    };
  }
};

export default function ProfileCard({ profile, onSwipe, isTopCard, direction }: ProfileCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) {
      onSwipe("left");
    } else if (info.offset.x > 100) {
      onSwipe("right");
    }
  };
  
  useEffect(() => {
    if (direction && isTopCard) {
      const exitX = direction === 'left' ? -300 : 300;
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
      style={{ x, rotate }}
      drag={isTopCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit={() => cardVariants.exit(direction || 'right')}
      custom={direction}
    >
      <div className="relative h-full w-full select-none overflow-hidden rounded-2xl border bg-card shadow-xl">
        <AnimatePresence initial={false}>
            <motion.div
              key={currentImageIndex}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.5 } }}
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
                <div className="absolute left-0 top-0 h-full w-1/2" onClick={(e) => handleImageNavigation(e, 'prev')} />
                <div className="absolute right-0 top-0 h-full w-1/2" onClick={(e) => handleImageNavigation(e, 'next')} />
                <div className="absolute top-2 left-2 right-2 flex gap-1">
                    {profile.images.map((_, index) => (
                        <div key={index} className="h-1 flex-1 rounded-full bg-white/50">
                            <div
                                className="h-full rounded-full bg-white"
                                style={{ width: index === currentImageIndex ? '100%' : '0%', transition: 'width 0.3s' }}
                            />
                        </div>
                    ))}
                </div>
            </>
        )}

        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
          <h2 className="text-3xl font-bold">
            {profile.name}, <span className="font-light">{profile.age}</span>
          </h2>
          <p className="mt-1 text-white/90">{profile.bio}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <Badge key={interest} variant="secondary" className="bg-white/20 text-white border-transparent">
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
