
'use client';

import { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { MapPin, Heart, X, ChevronUp } from 'lucide-react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { langTr } from '@/languages/tr';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from './ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

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
  const [isVisible, setIsVisible] = useState(true);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacityLike = useTransform(x, [10, SWIPE_THRESHOLD], [0, 1]);
  const opacityDislike = useTransform(x, [-SWIPE_THRESHOLD, -10], [1, 0]);

  useEffect(() => {
    x.set(0); 
    setIsVisible(true);
  }, [profile.uid, x]);
  
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
    setIsVisible(false); 
    setTimeout(() => onSwipe(action), 300);
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
    <AnimatePresence>
        {isVisible && (
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
                    <Carousel className="w-full h-full">
                        <CarouselContent>
                            {profile.images.map((img, index) => (
                            <CarouselItem key={index}>
                                <div className="relative w-full h-full">
                                <Image
                                    src={img}
                                    alt={`${profile.fullName} profile image ${index + 1}`}
                                    fill
                                    sizes="(max-width: 640px) 90vw, (max-width: 768px) 50vw, 384px"
                                    style={{ objectFit: 'cover' }}
                                    className="pointer-events-none"
                                    priority={isDraggable && index === 0}
                                />
                                </div>
                            </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>

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
                                    {/* Content is intentionally left blank for now */}
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
