
'use client';

import { useState, useEffect, useRef } from 'react';
import type { UserProfile, UserImage } from '@/lib/types';
import Image from 'next/image';
import { MapPin, Heart, X, ChevronUp, Star, Info, Clock } from 'lucide-react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { langTr } from '@/languages/tr';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader } from '@/components/ui/sheet';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ProfileCardProps {
  profile: UserProfile & { distance?: number };
  onSwipe?: (action: 'liked' | 'disliked' | 'superliked') => void;
  isDraggable: boolean;
}

function calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) return null;
    const birthday = new Date(dateOfBirth);
    if (isNaN(birthday.getTime())) return null;
    const ageDate = new Date(Date.now() - birthday.getTime());
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

const UserOnlineStatus = ({ isOnline, lastSeen }: { isOnline?: boolean; lastSeen?: any }) => {
    let statusText: string;
    let iconColor = "bg-gray-400";

    if (isOnline) {
        statusText = "Şu an aktif";
        iconColor = "bg-green-400";
    } else if (lastSeen?.toDate) {
        const lastSeenDate = lastSeen.toDate();
        const hoursAgo = differenceInHours(new Date(), lastSeenDate);
        if (hoursAgo < 10) {
            statusText = `${formatDistanceToNow(lastSeenDate, { locale: tr, addSuffix: true })} aktifti`;
            iconColor = "bg-yellow-400";
        } else {
            statusText = "Yakınlarda aktifti";
            iconColor = "bg-red-400";
        }
    } else {
        statusText = "Yakınlarda aktifti";
    }

    return (
        <div className="inline-flex items-center gap-2 text-xs text-white font-semibold mb-2 rounded-full px-3 py-1 bg-gradient-to-r from-green-500/30 via-yellow-500/10 to-red-500/30 backdrop-blur-sm">
            <div className={cn("w-2 h-2 rounded-full", iconColor)}></div>
            <span>{statusText}</span>
        </div>
    );
};


const SWIPE_THRESHOLD = 80;

export default function ProfileCard({ profile, onSwipe, isDraggable }: ProfileCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [profile.uid]);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacityLike = useTransform(x, [10, SWIPE_THRESHOLD], [0, 1]);
  const opacityDislike = useTransform(x, [-SWIPE_THRESHOLD, -10], [1, 0]);
  const opacitySuperLike = useTransform(y, [-SWIPE_THRESHOLD, -10], [1, 0]);
  
  const age = calculateAge(profile.dateOfBirth);
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!onSwipe || !isDraggable) return;

    if (info.offset.y < -SWIPE_THRESHOLD) {
      handleAction('superliked');
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      handleAction('liked');
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      handleAction('disliked');
    }
  };

  const handleAction = (action: 'liked' | 'disliked' | 'superliked') => {
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
    drag: true as const,
    dragConstraints: { left: 0, right: 0, top: 0, bottom: 0 },
    dragElastic: 0.5,
    onDragEnd: handleDragEnd,
    style: { x, y, rotate },
    whileTap: { cursor: 'grabbing' as const },
  } : {};

  const currentImage = profile.images && profile.images.length > 0 ? profile.images[activeImageIndex] : null;

  const isNewUser = profile.createdAt && (Date.now() - new Date(profile.createdAt.seconds * 1000).getTime()) < 7 * 24 * 60 * 60 * 1000;
  
  const lookingForMap: { [key: string]: string } = {
    'long-term': 'Uzun süreli ilişki',
    'short-term': 'Kısa süreli ilişki',
    'friends': 'Yeni arkadaşlar',
    'casual': 'Takılmak için',
    'not-sure': "Emin değil",
    'whatever': 'Her şeye açık',
  };
  const lookingForText = profile.lookingFor ? lookingForMap[profile.lookingFor] : null;


  return (
    <motion.div 
        className={`w-full h-full ${isDraggable ? 'cursor-grab' : 'cursor-default'}`}
        {...motionProps}
        exit={{ 
            x: x.get() > 0 ? 300 : -300,
            y: y.get() < 0 ? -300 : 0,
            opacity: 0,
            scale: 0.8,
            transition: { duration: 0.3, ease: 'easeIn' }
        }}
    >
        <div
            className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gray-200"
        >
            <div className='absolute inset-0'>
                {currentImage?.url && (
                    <Image
                        src={currentImage.url}
                        alt={`${profile.fullName} profile image ${activeImageIndex + 1}`}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 768px) 50vw, 384px"
                        style={{ objectFit: 'cover' }}
                        className="pointer-events-none"
                        priority={isDraggable}
                    />
                )}
            </div>
            
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

            {profile.images && profile.images.length > 1 && (
                <>
                    <div className='absolute top-4 left-2 right-2 flex gap-1 z-30'>
                        {profile.images.map((_, index) => (
                            <div key={index} className='h-1 flex-1 rounded-full bg-white/40 group'>
                                <div className={cn('h-full rounded-full bg-white transition-all duration-300', activeImageIndex === index ? 'w-full' : 'w-0')} />
                            </div>
                        ))}
                    </div>
                    <div className='absolute inset-0 flex z-20'>
                        <div className='flex-1 h-full' onClick={handlePrevImage} />
                        <div className='flex-1 h-full' onClick={handleNextImage} />
                    </div>
                </>
            )}

             {isNewUser && (
                 <div className="absolute top-8 left-4 z-30">
                    <Badge className="bg-blue-500 text-white border-blue-500">Yeni Üye</Badge>
                </div>
            )}

            {isDraggable && (
                <>
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 z-10"
                    style={{ opacity: opacitySuperLike }}
                >
                    <Star className="h-24 w-24 fill-current" strokeWidth={1.5} />
                </motion.div>
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
                        <UserOnlineStatus isOnline={profile.isOnline} lastSeen={profile.lastSeen} />
                        <div className='flex items-center gap-4'>
                          <h3 className="text-3xl font-bold truncate">{profile.fullName}{age && `, ${age}`}</h3>
                        </div>
                        <div className='flex flex-col gap-1.5'>
                            {profile.distance !== undefined && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{langTr.anasayfa.distance.replace('{distance}', String(profile.distance))}</span>
                                </div>
                            )}
                        </div>
                    </div>
                     <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm shrink-0 ml-2">
                                <ChevronUp className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className='h-[90vh] rounded-t-2xl bg-card text-card-foreground border-none p-0 flex flex-col'>
                            <SheetHeader className='sr-only'>
                                <SheetTitle>Profil Detayları</SheetTitle>
                                <SheetDescription>{profile.fullName} kullanıcısının profil detayları.</SheetDescription>
                            </SheetHeader>
                            <ScrollArea className='flex-1'>
                                <div className="space-y-6">
                                     {profile.images && profile.images.length > 0 && (
                                        <Carousel className="w-full">
                                            <CarouselContent>
                                                {profile.images.map((image, index) => (
                                                    <CarouselItem key={index}>
                                                        <div className="relative w-full aspect-[4/3]">
                                                            <Image
                                                                src={image.url}
                                                                alt={`${profile.fullName} profil fotoğrafı ${index + 1}`}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    </CarouselItem>
                                                ))}
                                            </CarouselContent>
                                            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 text-white border-none hover:bg-black/50" />
                                            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 text-white border-none hover:bg-black/50" />
                                        </Carousel>
                                    )}
                                    
                                    <div className="p-6 space-y-6 !pt-2">
                                        <div className="text-left space-y-2">
                                            <div className='flex items-center gap-3'>
                                                <h3 className="text-3xl font-bold">{profile.fullName}{age && `, ${age}`}</h3>
                                                {isNewUser && <Badge className="bg-blue-500 text-white border-blue-500 shrink-0">Yeni Üye</Badge>}
                                            </div>
                                            
                                            {(profile.address?.city && profile.address?.country) && (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>
                                                        {profile.address.city}, {profile.address.country}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {profile.bio && (
                                            <div>
                                                <h4 className='text-lg font-semibold mb-2'>Hakkında</h4>
                                                <p className='text-muted-foreground'>{profile.bio}</p>
                                            </div>
                                        )}
                                        
                                         {lookingForText && (
                                            <div>
                                                <h4 className='text-lg font-semibold mb-2'>Tercihler</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">İlişki Tercihi:</span>
                                                    <Badge variant="secondary" className='text-base py-1 px-3'>{lookingForText}</Badge>
                                                </div>
                                            </div>
                                        )}

                                        {profile.interests && profile.interests.length > 0 && (
                                            <div>
                                                <h4 className='text-lg font-semibold mb-2'>İlgi Alanları</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.interests.map(interest => (
                                                        <Badge key={interest} variant="secondary" className='text-base py-1 px-3'>{interest}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </ScrollArea>
                        </SheetContent>
                    </Sheet>
                </div>
        </div>
    </div>
</motion.div>
  );
}
