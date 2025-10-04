"use client";

import type { UserProfile as UserProfileType } from "@/lib/types";
import Image from "next/image";
import { PanInfo, motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { MapPin, Heart, X, ArrowUp } from "lucide-react";
import { langTr } from "@/languages/tr";

interface ProfileCardProps {
  profile: UserProfileType;
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
}

const calculateAge = (dateString: string | undefined) => {
    if (!dateString) return '';
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
};

export default function ProfileCard({ profile, onSwipe, isTop }: ProfileCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const t = langTr;
  const x = useMotionValue(0);
  
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [10, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -10], [1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) {
      onSwipe('left');
    } else if (info.offset.x > 100) {
      onSwipe('right');
    }
  };

  const images = useMemo(() => {
    return profile.images && profile.images.length > 0 
      ? profile.images 
      : ['https://picsum.photos/seed/placeholder/600/800'];
  }, [profile.images]);

  const handleImageNavigation = (e: React.MouseEvent, navDirection: 'prev' | 'next') => {
    e.stopPropagation();
    if (navDirection === 'next') {
      setCurrentImageIndex((prev) => Math.min(prev + 1, images.length - 1));
    } else {
      setCurrentImageIndex((prev) => Math.max(prev - 1, 0));
    }
  };
  
  const userAge = calculateAge(profile.dateOfBirth);

  return (
    <motion.div
      className="absolute inset-0 cursor-grab"
      style={{ x, rotate }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={{
        scale: isTop ? 1 : 0.95,
        y: isTop ? 0 : -20,
        zIndex: isTop ? 10 : 0,
      }}
      exit={{ x: 300, opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="relative h-full w-full select-none overflow-hidden rounded-2xl bg-card shadow-xl">
        <motion.div style={{ opacity: likeOpacity }} className="absolute left-8 top-8 z-10 transform">
            <Heart className="h-32 w-32 text-green-400 fill-green-400" strokeWidth={1} />
        </motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute right-8 top-8 z-10 transform">
            <X className="h-32 w-32 text-red-500" strokeWidth={1} />
        </motion.div>

        <div className="absolute inset-0">
          <AnimatePresence initial={false}>
              <motion.div
                  key={currentImageIndex}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
              >
                  <Image
                    src={images[currentImageIndex]}
                    alt={profile.fullName || 'Profile photo'}
                    fill
                    className="object-cover"
                    priority={isTop}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    data-ai-hint="person portrait"
                  />
              </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent"></div>
          
          <div className="absolute inset-0 flex">
            <div className="flex-1" onClick={(e) => handleImageNavigation(e, 'prev')} />
            <div className="flex-1" onClick={(e) => handleImageNavigation(e, 'next')} />
          </div>

          {images.length > 1 && (
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
              {images.map((_, index) => (
                <div key={index} className="h-1 flex-1 rounded-full bg-white/40 overflow-hidden">
                   <div 
                     className={`h-full bg-white transition-all duration-300 ${index === currentImageIndex ? 'w-full' : 'w-0'}`}
                   ></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 w-full p-5 text-white z-10 space-y-1">
          <div className="flex items-end justify-between">
            <div className="max-w-[calc(100%-50px)]">
              <h2 className="text-3xl font-bold drop-shadow-lg break-words">
                {profile.fullName || 'User'}, <span className="font-light">{userAge || ''}</span>
              </h2>
               <div className="flex items-center gap-1.5 pt-1">
                 <MapPin className="h-4 w-4" />
                 <p className="font-semibold text-sm">{t.anasayfa.distance.replace('{distance}', (Math.random() * 20).toFixed(0))}</p>
               </div>
            </div>
            <button className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <ArrowUp className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
