
'use client';

import { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { MapPin, Heart, X, ChevronUp } from 'lucide-react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { langTr } from '@/languages/tr';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

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
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reset index when profile changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [profile.uid]);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacityLike = useTransform(x, [10, SWIPE_THRESHOLD], [0, 1]);
  const opacityDislike = useTransform(x, [-SWIPE_THRESHOLD, -10], [1, 0]);
  
  const age = calculateAge(profile.dateOfBirth);
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!onSwipe || !isDraggable) return;
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > SWIPE_THRESHOLD || velocity > 500) {
      handleAction('liked');
    } else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      handleAction('disliked');
    }
  };

  const handleAction = (action: 'liked' | 'disliked') => {
    if (!onSwipe || !isDraggable) return;
    onSwipe(action);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % (profile.images?.length || 1));
  };
  
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + (profile.images?.length || 1)) % (profile.images?.length || 1));
  };
  
  const motionProps = isDraggable ? {
    drag: "x" as const,
    dragConstraints: { left: 0, right: 0, top: 0, bottom: 0 },
    dragElastic: 0.5,
    onDragEnd: handleDragEnd,
    style: { x, rotate },
    whileTap: { cursor: 'grabbing' as const },
  } : {};
  
  return (
    <motion.div 
        className={`w-full h-full ${isDraggable ? 'cursor-grab' : 'cursor-default'}`}
        {...motionProps}
        exit={{ 
            x: x.get() > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.8,
            transition: { duration: 0.3, ease: 'easeIn' }
        }}
    >
        <div
            className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gray-200"
        >
            {/* Image Background */}
            <div className='absolute inset-0'>
                <Image
                    src={profile.images[activeImageIndex].url}
                    alt={`${profile.fullName} profile image ${activeImageIndex + 1}`}
                    fill
                    sizes="(max-width: 640px) 90vw, (max-width: 768px) 50vw, 384px"
                    style={{ objectFit: 'cover' }}
                    className="pointer-events-none"
                    priority={isDraggable}
                />
            </div>
            
             {/* Progress Bars and Navigation */}
            <div className='absolute top-2 left-2 right-2 flex gap-1 z-30'>
                {profile.images.map((_, index) => (
                    <div key={index} className='h-1 flex-1 rounded-full bg-white/40'>
                        <div className={cn('h-full rounded-full bg-white transition-all duration-300', activeImageIndex === index ? 'w-full' : 'w-0')} />
                    </div>
                ))}
            </div>

            {profile.images.length > 1 && (
                <div className='absolute inset-0 flex z-20'>
                    <div className='flex-1 h-full' onClick={handlePrevImage} />
                    <div className='flex-1 h-full' onClick={handleNextImage} />
                </div>
            )}


            {isDraggable && (
                <>
                <motion.div
                    className="absolute top-8 left-8 text-green-400 z-10"
                    style={{ opacity: opacityLike }}
                >
                    <Heart className="h-20 w-20 fill-current" strokeWidth={1} />
                </motion.div>
                <motion.div
                    className="absolute top-8 right-8 text-red-500 z-10"
                    style={{ opacity: opacityDislike }}
                >
                    <X className="h-20 w-20" strokeWidth={3} />
                </motion.div>
                </>
            )}
            
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
                            ) : null}
                        </div>
                    </div>
                     <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm shrink-0 ml-2">
                                <ChevronUp className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className='h-[90vh] rounded-t-2xl bg-card text-card-foreground border-none p-0'>
                            <SheetTitle className='sr-only'>Profil Detayları</SheetTitle>
                            <SheetDescription className='sr-only'>{profile.fullName} kullanıcısının profil detayları.</SheetDescription>
                        </SheetContent>
                    </Sheet>
                </div>
        </div>
    </div>
</motion.div>
  );
}
