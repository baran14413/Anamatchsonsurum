
'use client';

import { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { ChevronUp, Eye, X, Heart, Dumbbell, Cigarette, GlassWater, PawPrint } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface ProfileCardProps {
  profile: UserProfile;
  onSwipe: (action: 'liked' | 'disliked', profile: UserProfile) => void;
}

function calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) return null;
    const birthday = new Date(dateOfBirth);
    if (isNaN(birthday.getTime())) return null;
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

const lifestyleIcons: { [key: string]: React.ElementType } = {
  workout: Dumbbell,
  smoking: Cigarette,
  drinking: GlassWater,
  pets: PawPrint,
};

export default function ProfileCard({ profile, onSwipe }: ProfileCardProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Animation values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-20, 0, 20], { clamp: false });
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  // Reset image index when profile changes
  useEffect(() => {
    setImageIndex(0);
    setShowDetails(false);
    x.set(0); // Reset animation state
  }, [profile.uid, x]);
  
  const age = calculateAge(profile.dateOfBirth);
  const totalImages = profile.images?.length || 0;
  const currentImage = (profile.images && profile.images.length > 0) ? profile.images[imageIndex] : 'https://picsum.photos/seed/placeholder/600/800';

  const handleAreaClick = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    if (totalImages <= 1) return;

    if (side === 'right') {
      setImageIndex((prev) => (prev + 1) % totalImages);
    } else {
      setImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe('liked', profile);
    } else if (info.offset.x < -100) {
      onSwipe('disliked', profile);
    }
  };
  
  const lifestyleInfo = [
      { key: 'workout', label: profile.lifestyle?.workout, icon: Dumbbell },
      { key: 'drinking', label: profile.lifestyle?.drinking, icon: GlassWater },
      { key: 'smoking', label: profile.lifestyle?.smoking, icon: Cigarette },
      ...(profile.lifestyle?.pets?.map(p => ({ key: p, label: p, icon: PawPrint })) || [])
  ].filter(item => item.label);


  return (
    <motion.div
        drag="x"
        onDragEnd={handleDragEnd}
        style={{ x, rotate, opacity }}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={1}
        className="relative w-full max-w-sm h-full max-h-[75vh] rounded-2xl overflow-hidden shadow-2xl bg-gray-200 cursor-grab active:cursor-grabbing"
    >
        {/* LIKE / NOPE Overlays */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 right-8 z-20">
            <Heart className="w-20 h-20 text-green-400" fill="currentColor" />
        </motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 left-8 z-20">
            <X className="w-20 h-20 text-red-500" />
        </motion.div>

        {/* Image Progress Bars */}
        {totalImages > 1 && (
            <div className="absolute top-2 left-2 right-2 z-10 flex gap-1 px-1">
                {profile.images.map((_, index) => (
                <div key={index} className="relative h-1 flex-1 bg-white/40 rounded-full overflow-hidden">
                    <div
                    className="absolute top-0 left-0 h-full bg-white transition-all duration-300"
                    style={{
                        width: index === imageIndex ? '100%' : '0%',
                        opacity: index === imageIndex ? 1 : 0.6,
                    }}
                    />
                </div>
                ))}
            </div>
        )}

        {/* Clickable Areas for Navigation */}
        <div
          className="absolute left-0 top-0 h-full w-1/2 z-[5]"
          onClick={(e) => handleAreaClick(e, 'left')}
        ></div>
        <div
          className="absolute right-0 top-0 h-full w-1/2 z-[5]"
          onClick={(e) => handleAreaClick(e, 'right')}
        ></div>

        <Image
            src={currentImage}
            alt={profile.fullName || 'Profile image'}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 768px) 50vw, 384px"
            style={{ objectFit: 'cover' }}
            className="pointer-events-none"
            priority
        />

        {/* Profile Info Overlay */}
        <div
            className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white z-10 cursor-pointer"
            onClick={() => setShowDetails(prev => !prev)}
        >
             <div className='flex items-end justify-between'>
                <div className="max-w-[calc(100%-4rem)]">
                    {/* Basic Info */}
                    <h3 className="text-4xl font-bold truncate">{profile.fullName}{age && `, ${age}`}</h3>
                    {profile.lookingFor && (
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className='bg-white/20 backdrop-blur-sm border-none text-white text-xs'>
                                {profile.lookingFor}
                            </Badge>
                        </div>
                    )}
                </div>
                <div className='self-end p-2 rounded-full border border-white/50 bg-black/20'>
                    <ChevronUp className={`w-6 h-6 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Detailed Info (Collapsible) */}
            <motion.div
                initial={false}
                animate={{ height: showDetails ? 'auto' : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
            >
                <div className="pt-4 space-y-4">
                    {/* Bio */}
                    {profile.bio && <p className="text-sm">{profile.bio}</p>}

                    {/* Lifestyle Tags */}
                    {lifestyleInfo.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {lifestyleInfo.map(({ key, label, icon: Icon }) => (
                                <Badge key={key} variant="secondary" className="bg-white/20 backdrop-blur-sm border-none text-white text-xs items-center gap-1.5">
                                    <Icon className="w-3 h-3" />
                                    <span>{label}</span>
                                </Badge>
                            ))}
                        </div>
                    )}
                    
                    {/* More Info */}
                    <div className="text-sm space-y-1">
                        {profile.school && <p>🎓 {profile.school}</p>}
                        {profile.moreInfo?.zodiacSign && <p>✨ {profile.moreInfo.zodiacSign}</p>}
                    </div>
                </div>
            </motion.div>
        </div>
    </motion.div>
  );
}

    