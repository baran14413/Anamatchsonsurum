'use client';

import { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { ChevronUp, GraduationCap, Dumbbell, MapPin, Heart, X } from 'lucide-react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { langTr } from '@/languages/tr';

interface ProfileCardProps {
  profile: UserProfile & { distance?: number };
  onSwipe?: (action: 'liked' | 'disliked') => void;
  isDraggable: boolean;
}

function calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) return null;
    const birthday = new Date(dateOfBirth);
    if (isNaN(birthday.getTime())) return null;
    const ageDate = new Date(Date.now() - birthday.getTime());
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

const SWIPE_THRESHOLD = 80;

export default function ProfileCard({ profile, onSwipe, isDraggable }: ProfileCardProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Motion values for drag gesture
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacityLike = useTransform(x, [10, SWIPE_THRESHOLD], [0, 1]);
  const opacityDislike = useTransform(x, [-SWIPE_THRESHOLD, -10], [1, 0]);

  useEffect(() => {
    // Reset internal state when the profile prop changes
    setImageIndex(0);
    setShowDetails(false);
    x.set(0); 
    setIsVisible(true);
    setSwipeDirection(null);
  }, [profile.uid, x]);
  
  const age = calculateAge(profile.dateOfBirth);
  const totalImages = profile.images?.length || 0;
  const currentImage = (profile.images && profile.images.length > 0) ? profile.images[imageIndex] : 'https://picsum.photos/seed/placeholder/600/800';

  const handleAreaClick = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    if (totalImages <= 1 || !isDraggable) return;

    if (side === 'right') {
      setImageIndex((prev) => (prev + 1) % totalImages);
    } else {
      setImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };
  
  const getProfileHighlights = (profile: UserProfile): string[] => {
      const highlights: string[] = [];
      if (profile.lookingFor) {
          highlights.push(profile.lookingFor);
      }
      return highlights;
  }

  const highlights = getProfileHighlights(profile);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!onSwipe || !isDraggable) return;
    const offset = info.offset.x;
    if (offset > SWIPE_THRESHOLD) {
      setSwipeDirection('right');
      setIsVisible(false);
      onSwipe('liked');
    } else if (offset < -SWIPE_THRESHOLD) {
      setSwipeDirection('left');
      setIsVisible(false);
      onSwipe('disliked');
    }
  };

  const motionProps = isDraggable ? {
    drag: "x" as const,
    dragConstraints: { left: 0, right: 0, top: 0, bottom: 0 },
    dragElastic: 0.5,
    onDragEnd: handleDragEnd,
    style: { x, rotate },
    whileTap: { cursor: 'grabbing' as const },
  } : {};
  
  const exitAnimation = {
    x: swipeDirection === 'right' ? 300 : -300,
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.3, ease: 'easeIn' }
  };

  return (
    <AnimatePresence>
        {isVisible && (
            <motion.div 
                className={`w-full h-full ${isDraggable ? 'cursor-grab' : 'cursor-default'}`}
                {...motionProps}
                exit={exitAnimation}
            >
                <div
                    className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gray-200"
                >
                    {totalImages > 1 && (
                        <div className="absolute top-2 left-2 right-2 z-[2] flex gap-1 px-1">
                            {profile.images.map((_, index) => (
                            <div key={index} className="relative h-1 flex-1 bg-white/40 rounded-full overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-white"
                                    style={{ width: index < imageIndex ? '100%' : (index === imageIndex ? '100%' : '0%'), transition: 'width 0.3s ease-in-out' }}
                                />
                            </div>
                            ))}
                        </div>
                    )}

                    {isDraggable && (
                        <>
                        <motion.div
                            className="absolute top-8 left-8 text-green-400 z-[2]"
                            style={{ opacity: opacityLike }}
                        >
                            <Heart className="h-20 w-20 fill-current" strokeWidth={1} />
                        </motion.div>
                        <motion.div
                            className="absolute top-8 right-8 text-red-500 z-[2]"
                            style={{ opacity: opacityDislike }}
                        >
                            <X className="h-20 w-20" strokeWidth={3} />
                        </motion.div>
                        </>
                    )}

                    <div
                    className={`absolute left-0 top-0 h-full w-1/2 z-10 ${isDraggable ? 'cursor-pointer' : ''}`}
                    onClick={(e) => handleAreaClick(e, 'left')}
                    ></div>
                    <div
                    className={`absolute right-0 top-0 h-full w-1/2 z-10 ${isDraggable ? 'cursor-pointer' : ''}`}
                    onClick={(e) => handleAreaClick(e, 'right')}
                    ></div>

                    <Image
                        src={currentImage}
                        alt={profile.fullName || 'Profile image'}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 768px) 50vw, 384px"
                        style={{ objectFit: 'cover' }}
                        className="pointer-events-none"
                        priority={isDraggable}
                    />

                    <div
                        className={`absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white z-[1] ${isDraggable ? 'cursor-pointer' : ''}`}
                        onClick={() => isDraggable && setShowDetails(prev => !prev)}
                    >
                        <div className='flex items-end justify-between'>
                            <div className="max-w-[calc(100%-4rem)]">
                                <h3 className="text-4xl font-bold truncate">{profile.fullName}{age && `, ${age}`}</h3>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        {profile.distance !== undefined ? (
                                            <span>{langTr.anasayfa.distance.replace('{distance}', String(profile.distance))}</span>
                                        ) : profile.address?.city ? (
                                            <span>{profile.address.city}, {profile.address.country}</span>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {highlights.map((highlight, index) => (
                                    <Badge key={index} variant="secondary" className='bg-white/20 backdrop-blur-sm border-none text-white text-xs capitalize'>
                                        {highlight}
                                    </Badge>
                                    ))}
                                </div>
                            </div>
                        {isDraggable && (
                            <div className='self-end p-2 rounded-full border border-white/50 bg-black/20'>
                                <ChevronUp className={`w-6 h-6 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} />
                            </div>
                        )}
                        </div>

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
                </div>
            </motion.div>
        )}
     </AnimatePresence>
  );
}
