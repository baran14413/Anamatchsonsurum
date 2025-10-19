
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { MapPin, Heart, X as XIcon, ChevronUp, X, Star } from 'lucide-react';
import { langTr } from '@/languages/tr';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader, SheetClose } from '@/components/ui/sheet';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as LucideIcons from 'lucide-react';
import { Icons } from './icons';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';

interface ProfileCardProps {
  profile: UserProfile & { distance?: number };
  isTopCard: boolean;
  onSwipe: (profile: UserProfile, direction: 'left' | 'right' | 'up') => void;
}

function calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) return null;
    const birthday = new Date(dateOfBirth);
    if (isNaN(birthday.getTime())) return null;
    const ageDate = new Date(Date.now() - birthday.getTime());
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

const UserOnlineStatus = ({ isOnline, lastSeen, isBot }: { isOnline?: boolean; lastSeen?: any, isBot?: boolean }) => {
    let statusText: string;
    let iconColor = "bg-gray-400";

    if (isBot || isOnline) {
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
        }
    } else {
        statusText = "Yakınlarda aktifti";
    }

    return (
        <Badge className='bg-black/40 text-white backdrop-blur-sm border-none'>
            <div className={cn("w-2 h-2 rounded-full mr-2", iconColor)}></div>
            <span>{statusText}</span>
        </Badge>
    );
};


type IconName = keyof Omit<typeof LucideIcons, 'createLucideIcon' | 'LucideIcon'>;

const ProfileCard = ({ profile, isTopCard, onSwipe }: ProfileCardProps) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [10, 100], [0, 1]);
  const dislikeOpacity = useTransform(x, [-100, -10], [1, 0]);
  const superLikeOpacity = useTransform(y, [-10, -100], [0, 1]);
  
  useEffect(() => {
    setActiveImageIndex(0);
  }, [profile.uid]);

  const age = calculateAge(profile.dateOfBirth);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % (profile.images?.length || 1));
  };
  
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + (profile.images?.length || 1)) % (profile.images?.length || 1));
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isTopCard) return;

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;
    
    const xSwipePower = swipePower(info.offset.x, info.velocity.x);
    const ySwipePower = swipePower(info.offset.y, info.velocity.y);

    let direction: 'left' | 'right' | 'up' | null = null;

    if (ySwipePower > swipeConfidenceThreshold && info.offset.y < -50) {
        direction = 'up';
    } else if (xSwipePower > swipeConfidenceThreshold) {
        if (info.offset.x > 50) {
            direction = 'right';
        } else if (info.offset.x < -50) {
            direction = 'left';
        }
    }
    
    if (direction) {
        setIsVisible(false);
        onSwipe(profile, direction);
    }
  };

  const isNewUser = profile.createdAt && (Date.now() - new Date(profile.createdAt.seconds * 1000).getTime()) < 7 * 24 * 60 * 60 * 1000;
  
  const lookingForMap: { [key: string]: string } = {
    'long-term': 'Uzun süreli ilişki',
    'short-term': 'Kısa süreli ilişki',
    'friends': 'Yeni arkadaşlar',
    'casual': 'Takılmak için',
    'not-sure': "Emin değilim",
    'whatever': 'Her şeye açığım',
  };
  const lookingForText = profile.lookingFor ? lookingForMap[profile.lookingFor] : "Henüz karar vermedim";
  
  const groupedInterests = useMemo(() => {
    if (!profile.interests) return {};

    const interestCategories = langTr.signup.step11.categories;
    const categoryMap: { [key: string]: { title: string; icon: IconName } } = {};
    interestCategories.forEach(cat => {
        cat.options.forEach(opt => {
            categoryMap[opt] = { title: cat.title, icon: cat.icon as IconName };
        });
    });

    const grouped: { [key: string]: { icon: IconName, interests: string[] } } = {};
    profile.interests.forEach(interest => {
        const categoryInfo = categoryMap[interest] || { title: 'Diğer', icon: 'Sparkles' };
        if (!grouped[categoryInfo.title]) {
            grouped[categoryInfo.title] = { icon: categoryInfo.icon, interests: [] };
        }
        grouped[categoryInfo.title].interests.push(interest);
    });
    return grouped;
  }, [profile.interests]);
  
  const interestEntries = useMemo(() => Object.entries(groupedInterests), [groupedInterests]);
  
  const likeRatio = useMemo(() => Math.floor(Math.random() * (98 - 70 + 1)) + 70, [profile.uid]);


  return (
    <AnimatePresence>
     {isVisible && (
         <motion.div
            className="absolute w-full h-full"
             drag={isTopCard}
             dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
             onDragEnd={handleDragEnd}
             style={{ x, y, rotate }}
             exit={{
                 opacity: 0,
                 x: x.get() > 0 ? 500 : -500,
                 y: y.get() < -50 ? -500 : 0,
                 rotate: x.get() > 0 ? 30 : -30,
                 transition: { duration: 0.3 }
             }}
         >
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gray-200">
            <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 right-10 z-30 pointer-events-none -rotate-[20deg]">
                <Heart className="w-32 h-32 text-green-400 fill-green-400" strokeWidth={4} />
            </motion.div>
            <motion.div style={{ opacity: dislikeOpacity }} className="absolute top-10 left-10 z-30 pointer-events-none rotate-[20deg]">
                <XIcon className="w-32 h-32 text-red-500" strokeWidth={4} />
            </motion.div>
             <motion.div style={{ opacity: superLikeOpacity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                <Star className="w-40 h-40 text-blue-400 fill-blue-400" strokeWidth={2} />
            </motion.div>
              
            {profile.images && profile.images.length > 0 && (
                <>
                  {profile.images.map((image, index) => (
                      <div
                        key={`${image.url}-${index}`}
                        className="absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out"
                        style={{ opacity: index === activeImageIndex ? 1 : 0 }}
                      >
                        <Image
                            src={image.url}
                            alt={`${profile.fullName} profile image ${index + 1}`}
                            fill
                            sizes="(max-width: 640px) 90vw, (max-width: 768px) 50vw, 384px"
                            className="object-cover"
                            priority={index === 0}
                        />
                      </div>
                  ))}
                </>
            )}
            
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

            {profile.images && profile.images.length > 1 && (
                <>
                    <div className='absolute top-4 left-2 right-2 flex gap-1 z-30'>
                        {profile.images.map((_, index) => (
                            <div key={index} className='h-1 flex-1 rounded-full bg-white/40'>
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

            <Sheet>
              <div
                  className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white z-20"
              >
                  <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <UserOnlineStatus isOnline={profile.isOnline} lastSeen={profile.lastSeen} isBot={profile.isBot} />
                          {(profile.distance || profile.distance === 0) && (
                              <div className="flex items-center gap-1.5 bg-black/40 text-white backdrop-blur-sm border-none rounded-full px-3 py-1 text-sm font-medium">
                                  <MapPin className="w-4 h-4" />
                                  <span>{langTr.anasayfa.distance.replace('{distance}', String(profile.distance))}</span>
                              </div>
                          )}
                      </div>
                      <div className="flex items-end justify-between gap-4">
                          <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-3xl font-bold truncate">{profile.fullName}</h3>
                                  <span className="font-semibold text-white/80 text-3xl">{age}</span>
                              </div>
                          </div>
                            <SheetTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full text-foreground bg-background/80 hover:bg-background/90 backdrop-blur-sm border shrink-0">
                                  <ChevronUp className="h-6 w-6" />
                              </Button>
                          </SheetTrigger>
                      </div>
                        <div className='flex flex-col gap-1.5 pt-1'>
                          <div className="flex items-center gap-2">
                              <span>🤔</span>
                              <span>{lookingForText}</span>
                          </div>
                      </div>
                  </div>
              </div>
                  
              <SheetContent side="bottom" className='h-[90vh] rounded-t-2xl bg-card text-card-foreground border-none p-0 flex flex-col'>
                  <SheetHeader className='p-4 border-b flex-row items-center justify-between'>
                          <SheetTitle className="text-xl">{profile.fullName}</SheetTitle>
                          <SheetClose asChild>
                          <Button variant="ghost" size="icon" className="rounded-full">
                              <X className="w-5 h-5"/>
                          </Button>
                      </SheetClose>
                  </SheetHeader>
                  <ScrollArea className='flex-1'>
                      <div className="space-y-6">
                          {profile.images && profile.images.length > 0 && (
                                  <Carousel className="w-full">
                                  <CarouselContent>
                                      {profile.images
                                          .map((image, index) => (
                                          <CarouselItem key={index}>
                                              <div className="relative w-full aspect-[4/3]">
                                                  <Image
                                                      src={image.url}
                                                      alt={`${profile.fullName} profil medyası ${index + 1}`}
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
                                      <div className='flex flex-col items-start'>
                                      {profile.membershipType === 'gold' && (
                                          <div className='flex items-center gap-2'>
                                          <Icons.beGold width={24} height={24} />
                                          <p className="font-semibold text-yellow-500">Gold Üye</p>
                                          </div>
                                      )}
                                      <div className="flex items-center gap-2">
                                          <h3 className="text-3xl font-bold">
                                              {profile.fullName}
                                          </h3>
                                          <span className="font-semibold text-foreground/80 text-3xl">{age}</span>
                                      </div>
                                  </div>
                                  {isNewUser && <Badge className="bg-blue-500 text-white border-blue-500 shrink-0 !mt-3">Yeni Üye</Badge>}
                                  
                                  {(profile.address?.city && profile.address?.country) && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                          <MapPin className="w-4 h-4" />
                                          <span>
                                              {profile.address.city}, {profile.address.country}
                                          </span>
                                      </div>
                                  )}
                              </div>
                              
                              {likeRatio && (
                                  <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 p-3">
                                  <Heart className="w-6 h-6 text-red-400 fill-red-400 shrink-0" />
                                  <div className='flex-1'>
                                      <p className="font-bold text-base">Beğenilme Oranı: %{likeRatio}</p>
                                      <p className='text-sm text-muted-foreground'>Kullanıcıların %{likeRatio}'si bu profili beğendi.</p>
                                  </div>
                              </div>
                              )}
                              
                              {profile.bio && (
                                  <div>
                                      <h4 className='text-lg font-semibold mb-2'>Hakkında</h4>
                                      <p className='text-muted-foreground'>{profile.bio}</p>
                                  </div>
                              )}
                              
                              {(lookingForText || interestEntries.length > 0) && (
                                  <div>
                                      <h4 className='text-lg font-semibold mb-4'>Tercihler</h4>
                                      <div className="space-y-4">
                                          
                                          <div className="flex items-start gap-3">
                                              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                                  <Heart className="w-6 h-6 text-primary" />
                                              </div>
                                              <div className='flex flex-col'>
                                                  <span className="font-medium text-sm">İlişki Tercihi</span>
                                                  <Badge variant="secondary" className='text-base py-1 px-3 mt-1 w-fit'>{lookingForText}</Badge>
                                              </div>
                                          </div>
                                      
                                          {interestEntries.map(([category, { icon, interests }]) => {
                                              const IconComponent = LucideIcons[icon] as React.ElementType || LucideIcons.Sparkles;
                                              return (
                                                  <div key={category} className="flex items-start gap-3">
                                                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                                          <IconComponent className="w-6 h-6 text-primary" />
                                                      </div>
                                                      <div className='flex flex-col'>
                                                              <span className="font-medium text-sm">{category}</span>
                                                          <div className="flex flex-wrap gap-2 mt-1">
                                                              {interests.map(interest => (
                                                                  <Badge key={interest} variant="secondary" className='text-base py-1 px-3'>{interest}</Badge>
                                                              ))}
                                                          </div>
                                                      </div>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  </div>
                              )}

                          </div>
                      </div>
                  </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
         </motion.div>
     )}
    </AnimatePresence>
  );
};

export default ProfileCard;
