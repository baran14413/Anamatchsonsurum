
'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { MapPin, Info, Heart, X as XIcon } from 'lucide-react';
import { langTr } from '@/languages/tr';

interface ProfileCardProps {
  profile: UserProfile;
  onSwipe: (direction: 'left' | 'right') => void;
}

const SWIPE_THRESHOLD = 80;

function calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) return null;
    const birthday = new Date(dateOfBirth);
    if (isNaN(birthday.getTime())) return null;
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}


export default function ProfileCard({ profile, onSwipe }: ProfileCardProps) {
  const t = langTr;
  const x = useMotionValue(0);
  
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [10, SWIPE_THRESHOLD / 2], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD / 2, -10], [1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe('right');
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe('left');
    }
  };
  
  const [imageIndex, setImageIndex] = useState(0);
  const images = profile.images && profile.images.length > 0 ? profile.images : [];

  const handleImageNavigation = (e: React.MouseEvent<HTMLDivElement>) => {
    const cardWidth = e.currentTarget.offsetWidth;
    const clickX = e.nativeEvent.offsetX;
    
    if (clickX < cardWidth / 2) {
      // Clicked on the left side
      setImageIndex(prev => Math.max(0, prev - 1));
    } else {
      // Clicked on the right side
      setImageIndex(prev => Math.min(images.length - 1, prev + 1));
    }
  };

  const age = calculateAge(profile.dateOfBirth);

  return (
     <motion.div
      className="absolute inset-0 flex items-center justify-center p-4 pt-4 pb-28"
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ x, rotate, opacity }}
        className="w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gray-200 cursor-grab active:cursor-grabbing"
      >
        <div className="relative w-full h-full" onClick={handleImageNavigation}>
            {/* Image Progress Bars */}
            {images.length > 1 && (
                <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
                    {images.map((_, index) => (
                    <div key={index} className="flex-1 h-1 rounded-full bg-white/50">
                        <motion.div
                         className="h-1 rounded-full bg-white"
                         initial={{ width: '0%' }}
                         animate={{ width: index === imageIndex ? '100%' : (index < imageIndex ? '100%' : '0%') }}
                         transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                    </div>
                    ))}
                </div>
            )}
            
            {/* Main Image */}
            {images.length > 0 ? (
                 <AnimatePresence initial={false}>
                    <motion.div
                        key={imageIndex}
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Image
                            src={images[imageIndex]}
                            alt={profile.fullName || 'Profile image'}
                            fill
                            style={{ objectFit: 'cover' }}
                            className="pointer-events-none"
                            priority
                        />
                    </motion.div>
                </AnimatePresence>
            ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <p className="text-gray-500">No image</p>
                </div>
            )}

            {/* Like/Nope Indicators */}
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-8 left-8 text-green-400 font-bold text-4xl border-4 border-green-400 p-2 rounded-lg transform -rotate-20"
            >
              <Heart className="h-16 w-16 fill-current" />
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-8 right-8 text-red-500 font-bold text-4xl border-4 border-red-500 p-2 rounded-lg transform rotate-20"
            >
              <XIcon className="h-16 w-16" />
            </motion.div>

            {/* Profile Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white z-20">
              <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold">{profile.fullName}{age && `, ${age}`}</h3>
                    {profile.location && (
                        <div className="flex items-center gap-2 text-base">
                          <MapPin size={16} />
                          <span>{t.anasayfa.distance.replace('{distance}', '154')}</span>
                        </div>
                    )}
                </div>
                <button className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                     <Info size={24} />
                </button>
              </div>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
