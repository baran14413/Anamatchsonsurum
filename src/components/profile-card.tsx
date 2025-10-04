'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { MapPin, Info, Heart, X as XIcon } from 'lucide-react';
import { langTr } from '@/languages/tr';

interface ProfileCardProps {
  profile: UserProfile;
  onSwipe: (direction: 'left' | 'right') => void;
}

const SWIPE_THRESHOLD = 80;

function calculateAge(dateOfBirth: string | undefined) {
    if (!dateOfBirth) return '';
    const birthday = new Date(dateOfBirth);
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

  const handleImageNavigation = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent card drag
    const cardWidth = e.currentTarget.offsetWidth;
    const clickX = e.nativeEvent.offsetX;
    
    // Define a dead zone in the middle to prevent accidental navigation
    const deadZone = cardWidth * 0.2; // 20% of the width
    const leftBoundary = (cardWidth - deadZone) / 2;
    const rightBoundary = leftBoundary + deadZone;

    if (clickX < leftBoundary) {
      // Clicked on the left side
      setImageIndex(prev => Math.max(0, prev - 1));
    } else if (clickX > rightBoundary) {
      // Clicked on the right side
      setImageIndex(prev => Math.min((profile.images || []).length - 1, prev + 1));
    }
  };

  const age = calculateAge(profile.dateOfBirth);
  const images = profile.images || [];

  return (
     <motion.div
      className="absolute inset-0 flex items-center justify-center p-4 pt-4 pb-28" 
      style={{ touchAction: 'pan-y' }}
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ x, rotate, opacity }}
        className="w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gray-200 cursor-grab active:cursor-grabbing relative"
      >
        <div className="relative w-full h-full" onClick={handleImageNavigation}>
            {images.length > 1 && (
                <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
                    {images.map((_, index) => (
                    <div key={index} className="flex-1 h-1 rounded-full bg-white/50 transition-colors duration-300">
                        <div 
                          className={`h-1 rounded-full ${index === imageIndex ? 'bg-white' : index < imageIndex ? 'bg-white' : ''}`}
                          style={{width: index === imageIndex ? '100%' : '100%'}}
                        />
                    </div>
                    ))}
                </div>
            )}
            {images.length > 0 ? (
                <Image
                    src={images[imageIndex]}
                    alt={profile.fullName || 'Profile image'}
                    fill
                    objectFit="cover"
                    className="pointer-events-none"
                    priority
                />
            ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <p className="text-gray-500">No image</p>
                </div>
            )}

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
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white z-10">
          <div className="flex items-center justify-between">
            <div>
                <h3 className="text-2xl font-bold">{profile.fullName}{age && `, ${age}`}</h3>
                <div className="flex items-center gap-2 text-base">
                  <MapPin size={16} />
                  <span>{t.anasayfa.distance.replace('{distance}', '154')}</span>
                </div>
            </div>
            <button className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                 <Info size={24} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
