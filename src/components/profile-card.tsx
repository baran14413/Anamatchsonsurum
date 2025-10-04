
"use client";

import type { UserProfile as UserProfileType } from "@/lib/types";
import Image from "next/image";
import { PanInfo, motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import { MapPin, Heart, X, ArrowUp } from "lucide-react";

interface ProfileCardProps {
  profile: UserProfileType;
  onSwipe: (direction: 'left' | 'right') => void;
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

export default function ProfileCard({ profile, onSwipe }: ProfileCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

  const handleImageNavigation = (e: React.MouseEvent, navDirection: 'prev' | 'next') => {
    e.stopPropagation();
    if (!profile.images || profile.images.length === 0) return;
    if (navDirection === 'next') {
      setCurrentImageIndex((prev) => Math.min(prev + 1, profile.images.length - 1));
    } else {
      setCurrentImageIndex((prev) => Math.max(prev - 1, 0));
    }
  };
  
  const userAge = calculateAge(profile.dateOfBirth);

  const images = profile.images && profile.images.length > 0 ? profile.images : ['https://picsum.photos/seed/placeholder/600/800'];
  const currentImage = images[currentImageIndex] || images[0];

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{
        x: x.get() > 0 ? 300 : -300,
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.3 }
      }}
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
          <Image
            src={currentImage}
            alt={profile.fullName || 'Profil fotosu'}
            fill
            className="object-cover"
            priority={true}
            data-ai-hint="person portrait"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent"></div>
          
          <div className="absolute inset-0 flex">
            <div className="flex-1" onClick={(e) => handleImageNavigation(e, 'prev')} />
            <div className="flex-1" onClick={(e) => handleImageNavigation(e, 'next')} />
          </div>

          {images.length > 1 && (
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
              {images.map((_, index) => (
                <div key={index} className="h-1 flex-1 rounded-full bg-white/40 overflow-hidden">
                   <div className={`h-full rounded-full transition-all duration-300 ${index <= currentImageIndex ? 'bg-white' : ''}`}></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 w-full p-5 text-white z-10 space-y-1">
          <div className="flex items-end justify-between">
            <div className="max-w-[calc(100%-50px)]">
              <h2 className="text-3xl font-bold drop-shadow-lg">
                {profile.fullName || 'Kullanıcı'}, <span className="font-light">{userAge || ''}</span>
              </h2>
               <div className="flex items-center gap-1.5 pt-1">
                 <MapPin className="h-4 w-4" />
                 <p className="font-semibold text-sm">{(Math.random() * 200).toFixed(0)} km uzakta</p>
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
