'use client';

import { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { MapPin, Heart, X, ChevronUp } from 'lucide-react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { langTr } from '@/languages/tr';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from './ui/button';

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
  const [isVisible, setIsVisible] = useState(true);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacityLike = useTransform(x, [10, SWIPE_THRESHOLD], [0, 1]);
  const opacityDislike = useTransform(x, [-SWIPE_THRESHOLD, -10], [1, 0]);

  useEffect(() => {
    setImageIndex(0);
    x.set(0); 
    setIsVisible(true);
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
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!onSwipe || !isDraggable) return;
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > SWIPE_THRESHOLD || velocity > 500) {
      setIsVisible(false);
      onSwipe('liked');
    } else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
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
    exit: { 
      x: x.get() > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3, ease: 'easeIn' }
    }
  } : {};
  

  return (
    <AnimatePresence onExitComplete={() => setIsVisible(false)}>
        {isVisible && (
            <motion.div 
                className={`w-full h-full ${isDraggable ? 'cursor-grab' : 'cursor-default'}`}
                {...motionProps}
            >
                <div
                    className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gray-200"
                >
                    {totalImages > 1 && (
                        <div className="absolute top-2 left-2 right-2 z-20 flex gap-1 px-1">
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
                            className="absolute top-8 left-8 text-green-400 z-20"
                            style={{ opacity: opacityLike }}
                        >
                            <Heart className="h-20 w-20 fill-current" strokeWidth={1} />
                        </motion.div>
                        <motion.div
                            className="absolute top-8 right-8 text-red-500 z-20"
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
                        className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white z-20"
                    >
                       <div className="flex items-end justify-between">
                            <div className="space-y-1 flex-1 min-w-0">
                                <h3 className="text-4xl font-bold truncate">{profile.fullName}{age && `, ${age}`}</h3>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {profile.distance !== undefined ? (
                                        <span>{langTr.anasayfa.distance.replace('{distance}', String(profile.distance))}</span>
                                    ) : profile.address?.city ? (
                                        <span>{profile.address.city}, {profile.address.country}</span>
                                    ) : null}
                                </div>
                            </div>
                             <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm shrink-0 ml-2">
                                        <ChevronUp className="h-6 w-6" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className='h-[90vh] rounded-t-2xl'>
                                    <div className="p-4">
                                        <h2 className="text-xl font-bold">Profil Detayları</h2>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}
     </AnimatePresence>
  );
}