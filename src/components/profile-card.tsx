'use client';

import { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { ChevronUp, GraduationCap, Dumbbell, MapPin, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileCardProps {
  profile: UserProfile;
  onSwipe: (action: 'liked' | 'disliked') => void;
}

function calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) return null;
    const birthday = new Date(dateOfBirth);
    if (isNaN(birthday.getTime())) return null;
    const ageDate = new Date(Date.now() - birthday.getTime());
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export default function ProfileCard({ profile, onSwipe }: ProfileCardProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Reset image index when profile changes
  useEffect(() => {
    setImageIndex(0);
    setShowDetails(false);
  }, [profile.uid]);
  
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
  
  // Create a helper to get a few key details to show as badges
  const getProfileHighlights = (profile: UserProfile): string[] => {
      const highlights: string[] = [];
      if (profile.lookingFor) {
          highlights.push(profile.lookingFor);
      }
      if (profile.interests) {
          highlights.push(...profile.interests.slice(0, 3)); // Show first 3 interests
      }
      return highlights;
  }

  const highlights = getProfileHighlights(profile);

  return (
    <motion.div
        className="relative w-full max-w-sm h-full max-h-[75vh] rounded-2xl overflow-hidden shadow-2xl bg-gray-200"
    >
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
                    <h3 className="text-4xl font-bold truncate">{profile.fullName}{age && `, ${age}`}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {highlights.map((highlight, index) => (
                           <Badge key={index} variant="secondary" className='bg-white/20 backdrop-blur-sm border-none text-white text-xs capitalize'>
                             {highlight}
                           </Badge>
                        ))}
                    </div>
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
                    {profile.bio && <p className="text-base">{profile.bio}</p>}
                    
                    <div className="space-y-2 text-sm">
                        {profile.school && (
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                <span>{profile.school}</span>
                            </div>
                        )}
                         {profile.lifestyle?.workout && (
                            <div className="flex items-center gap-2 capitalize">
                                <Dumbbell className="w-4 h-4" />
                                <span>{profile.lifestyle.workout}</span>
                            </div>
                        )}
                    </div>

                </div>
            </motion.div>
        </div>
    </motion.div>
  );
}