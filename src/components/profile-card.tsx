
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { MapPin, Heart, X as XIcon, ChevronUp, X, Star, Venus, Mars, BarChart2, Hand } from 'lucide-react';
import { langTr } from '@/languages/tr';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader, SheetClose } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow, differenceInHours, differenceInMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as LucideIcons from 'lucide-react';
import { Icons } from './icons';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useUser } from '@/firebase/provider';
import CircularProgress from './circular-progress';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface ProfileCardProps {
  profile: UserProfile & { distance?: number };
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

    if (isBot) {
        statusText = "Şu an aktif";
        iconColor = "bg-green-400";
    } else if (isOnline) {
        statusText = "Şu an aktif";
        iconColor = "bg-green-400";
    } else if (lastSeen) {
        const lastSeenDate = typeof lastSeen === 'number' ? new Date(lastSeen) : lastSeen?.toDate();
        if (lastSeenDate && !isNaN(lastSeenDate.getTime())) {
             const minutesAgo = differenceInMinutes(new Date(), lastSeenDate);
             if (minutesAgo < 10) {
                statusText = `Az önce aktifti`;
                iconColor = "bg-yellow-400";
             } else {
                 statusText = "Yakınlarda aktifti";
             }
        } else {
            statusText = "Yakınlarda aktifti";
        }
    } else {
        statusText = "Çevrimdışı";
    }


    return (
        <Badge className='bg-black/40 text-white backdrop-blur-sm border-none'>
            <div className={cn("w-2 h-2 rounded-full mr-2", iconColor)}></div>
            <span className='truncate whitespace-nowrap'>{statusText}</span>
        </Badge>
    );
};

const calculateCompatibility = (currentUser: UserProfile, otherUser: UserProfile): { score: number; message: string; commonInterests: string[] } => {
    let score = 0;
    let maxScore = 0;
    const commonInterests: string[] = [];

    // 1. Interests (Max 40 points)
    if (currentUser.interests && otherUser.interests) {
        maxScore += 40;
        const currentUserInterests = new Set(currentUser.interests);
        otherUser.interests.forEach(interest => {
            if (currentUserInterests.has(interest)) {
                score += 4; // Each common interest is 4 points (max 10 interests)
                commonInterests.push(interest);
            }
        });
    }

    // 2. Looking For (25 points)
    if (currentUser.lookingFor && otherUser.lookingFor) {
        maxScore += 25;
        if (currentUser.lookingFor === otherUser.lookingFor) {
            score += 25;
        } else {
            // Partial match for similar goals
            const similarPairs = [
                ['long_term', 'long_term_short_ok'],
                ['long_term_short_ok', 'short_term_long_ok'],
                ['short_term_fun', 'short_term_long_ok']
            ];
            if (similarPairs.some(p => p.includes(currentUser.lookingFor!) && p.includes(otherUser.lookingFor!))) {
                score += 15;
            }
        }
    }

    // 3. Lifestyle (35 points total)
    if (currentUser.lifestyle && otherUser.lifestyle) {
        const lifestyleKeys: (keyof typeof currentUser.lifestyle)[] = ['drinking', 'smoking', 'workout'];
        maxScore += 35;
        let lifestyleScore = 0;

        // Drinking (15 points)
        if (currentUser.lifestyle.drinking && otherUser.lifestyle.drinking) {
            if (currentUser.lifestyle.drinking === otherUser.lifestyle.drinking) {
                lifestyleScore += 15;
            } else if (['not_for_me', 'dont_drink'].includes(currentUser.lifestyle.drinking) && ['not_for_me', 'dont_drink'].includes(otherUser.lifestyle.drinking)) {
                 lifestyleScore += 15;
            }
        }

        // Smoking (10 points)
        if (currentUser.lifestyle.smoking && otherUser.lifestyle.smoking) {
             if (currentUser.lifestyle.smoking === 'non_smoker' && otherUser.lifestyle.smoking === 'non_smoker') {
                lifestyleScore += 10;
            } else if (currentUser.lifestyle.smoking === otherUser.lifestyle.smoking) {
                lifestyleScore += 5;
            }
        }

        // Workout (10 points)
        if (currentUser.lifestyle.workout && otherUser.lifestyle.workout) {
            if (currentUser.lifestyle.workout === otherUser.lifestyle.workout) {
                lifestyleScore += 10;
            } else if (['everyday', 'often'].includes(currentUser.lifestyle.workout) && ['everyday', 'often'].includes(otherUser.lifestyle.workout)) {
                lifestyleScore += 7;
            }
        }
        score += lifestyleScore;
    }
    
    const finalScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    let message;
    if (finalScore > 75) {
        message = "Eşleşme Şansınız Çok Yüksek!";
    } else if (finalScore > 50) {
        message = "Harika Bir Uyum Yakalayabilirsiniz!";
    } else if (finalScore > 25) {
        message = "Biraz Farklısınız Ama Neden Olmasın?";
    } else {
        message = "Zıt Kutuplar Birbirini Çeker Derler...";
    }
    
    return { score: finalScore, message, commonInterests };
};



type IconName = keyof Omit<typeof LucideIcons, 'createLucideIcon' | 'LucideIcon'>;

const ProfileCard = ({ profile, onSwipe }: ProfileCardProps) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { userProfile: currentUserProfile } = useUser();
  const [compatibilityResult, setCompatibilityResult] = useState<{ score: number; message: string; commonInterests: string[] } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout>();
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const hintTimer = useRef<NodeJS.Timeout>();


  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [10, 100], [0, 1]);
  const dislikeOpacity = useTransform(x, [-100, -10], [1, 0]);
  const superLikeOpacity = useTransform(y, [-10, -100], [0, 1]);

  useEffect(() => {
    setActiveImageIndex(0);
    x.set(0);
    y.set(0);
    setIsLongPress(false);
    setShowSwipeHint(false);

    // Set a timer to show the swipe hint
    hintTimer.current = setTimeout(() => {
        setShowSwipeHint(true);
    }, 2500);

    return () => {
        clearTimeout(hintTimer.current);
        clearTimeout(pressTimer.current);
    }

  }, [profile.uid, x, y]);

  const age = calculateAge(profile.dateOfBirth);
  const isGoldMember = profile.membershipType === 'gold';
  const isNewUser = profile.createdAt && (Date.now() - new Date(profile.createdAt.seconds * 1000).getTime()) < 7 * 24 * 60 * 60 * 1000;

  const handlePressStart = () => {
    clearTimeout(hintTimer.current);
    setShowSwipeHint(false);
    pressTimer.current = setTimeout(() => {
        setIsLongPress(true);
    }, 500); // 500ms for long press
  };

  const handlePressEnd = () => {
      clearTimeout(pressTimer.current);
      // Only toggle if it was a real long press, not just a click
      if (isLongPress) {
        setIsLongPress(false);
      }
  };
  
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(isLongPress) {
        setIsLongPress(false);
        return;
    };
    setActiveImageIndex((prev) => (prev + 1) % (profile.images?.length || 1));
  };
  
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
     if(isLongPress) {
        setIsLongPress(false);
        return;
    };
    setActiveImageIndex((prev) => (prev - 1 + (profile.images?.length || 1)) % (profile.images?.length || 1));
  };
  
  const handleCompatibilityCheck = () => {
    if (currentUserProfile) {
        const result = calculateCompatibility(currentUserProfile, profile);
        setCompatibilityResult(result);
        setIsDialogOpen(true);
    }
  };

  const handleDragStart = () => {
    setShowSwipeHint(false);
    clearTimeout(hintTimer.current);
  }

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -50) {
        onSwipe(profile, 'up');
    } else if (info.offset.x > 50) {
        onSwipe(profile, 'right');
    } else if (info.offset.x < -50) {
        onSwipe(profile, 'left');
    }
  };
  
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

  const displayDistance = useMemo(() => {
    if (profile.distance === undefined || profile.distance === null) return null;
    if (profile.distance < 1) {
      return `${Math.round(profile.distance * 1000)} m`;
    }
    return `${Math.round(profile.distance)} km`;
  }, [profile.distance]);


  return (
    <motion.div
        className="absolute w-full h-full cursor-grab transform-gpu"
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        style={{ x, y, rotate }}
        exit={{
            x: x.get() > 0 ? 500 : (x.get() < 0 ? -500 : 0),
            y: y.get() < -50 ? -500 : y.get(),
            opacity: 0,
            scale: 0.8,
            transition: { duration: 0.3 }
        }}
    >
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
              setCompatibilityResult(null);
          }
      }}>
        <div className={cn(
            "relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gray-200",
            isGoldMember && "border-4 border-yellow-400"
        )}>
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
                    {profile.images.map((image, index) => {
                        if (!image || !image.url) return null;
                        return (
                          <div
                            key={`${profile.uid}-img-${index}`}
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
                        );
                    })}
                </>
            )}
            
             <AnimatePresence>
                {showSwipeHint && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 pointer-events-none"
                >
                    <div className="flex items-center gap-8">
                    <XIcon className="w-16 h-16 text-white/80" />
                    <Hand className="w-20 h-20 text-white animate-pulse" />
                    <Heart className="w-16 h-16 text-white/80 fill-white/80" />
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
            
             <div className={cn("absolute inset-0 transition-opacity duration-300", isLongPress ? "opacity-0" : "opacity-100")}>

                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

                <div className="absolute top-4 left-4 z-40 flex flex-col items-start gap-2">
                    {isNewUser && (
                        <Badge className="bg-blue-500/50 text-white backdrop-blur-sm border-none gap-1 py-0.5 px-2 text-xs">
                            <Star className="w-3 h-3 fill-white"/>
                            <span className='font-bold'>Yeni Üye</span>
                        </Badge>
                    )}
                    <Badge className="bg-gradient-to-r from-pink-500/50 to-orange-400/50 text-white backdrop-blur-sm border-none gap-1 py-0.5 px-2 text-xs">
                        <Heart className="w-3 h-3 fill-white"/>
                        <span className='font-bold'>%{likeRatio} Beğenilme</span>
                    </Badge>
                </div>

                <Button onClick={handleCompatibilityCheck} variant="ghost" size="icon" className="absolute top-4 right-4 z-40 h-10 w-10 rounded-full bg-black/30 hover:bg-black/50 text-white hover:text-white backdrop-blur-sm animate-pulse">
                    <BarChart2 className="h-5 w-5" />
                </Button>

                {profile.images && profile.images.length > 1 && (
                    <>
                        <div className='absolute top-2 left-2 right-2 flex gap-1 z-20'>
                            {profile.images.map((_, index) => (
                                <div key={index} className='h-1 flex-1 rounded-full bg-white/40'>
                                    <div className={cn('h-full rounded-full bg-white transition-all duration-300', activeImageIndex === index ? 'w-full' : 'w-0')} />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                 {/* Clickable areas for image navigation */}
                <div className='absolute inset-0 flex z-10'>
                    <div className='flex-1 h-full' onClick={handlePrevImage} />
                    <div className='flex-1 h-full' onClick={handleNextImage} />
                </div>


                <Sheet>
                    <div
                        className="absolute bottom-0 left-0 right-0 p-4 pb-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white z-20"
                    >
                        <div className="space-y-1">
                            <UserOnlineStatus isOnline={profile.isOnline} lastSeen={profile.lastSeen} isBot={profile.isBot} />
                            
                            <div className="inline-flex items-center gap-3 p-1 rounded-lg">
                                <h3 className="text-2xl font-bold truncate">{profile.fullName},</h3>
                                <span className="text-2xl font-semibold text-white/90">{age}</span>
                                {profile.gender === 'female' && <Venus className="w-5 h-5 text-pink-300" />}
                                {profile.gender === 'male' && <Mars className="w-5 h-5 text-blue-300" />}
                                {displayDistance && (
                                    <div className="flex items-center gap-1.5 text-sm font-medium border-l border-white/30 pl-3">
                                        <MapPin className="w-4 h-4" />
                                        <span>{displayDistance}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="absolute right-4 bottom-6">
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full text-foreground bg-background/80 hover:bg-background/90 backdrop-blur-sm border shrink-0">
                                    <ChevronUp className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                        </div>
                    </div>
                        
                    <SheetContent side="bottom" className='h-[90vh] rounded-t-2xl bg-card text-card-foreground border-none p-0 flex flex-col'>
                        <SheetHeader className='p-2 flex-row items-center justify-between'>
                                <SheetTitle className="text-xl">{profile.fullName}</SheetTitle>
                                <SheetClose asChild>
                                <Button variant="ghost" size="icon" className="rounded-full" type="button">
                                    <X className="h-5 w-5" />
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
                                        
                                        {displayDistance && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="w-4 h-4" />
                                                <span>
                                                    {displayDistance}
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
                                    
                                    {interestEntries.length > 0 && (
                                        <div>
                                            <h4 className='text-lg font-semibold mb-4'>İlgi Alanları</h4>
                                            <div className="space-y-4">
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
        </div>

        {compatibilityResult && (
             <DialogContent className="sm:max-w-xs bg-background/60 backdrop-blur-sm border-border rounded-xl">
                <DialogHeader className="items-center text-center space-y-4">
                     <div className="relative flex items-center justify-center space-x-2">
                         <Avatar className="w-16 h-16 border-2">
                            <AvatarImage src={currentUserProfile?.profilePicture || ''} />
                            <AvatarFallback>{currentUserProfile?.fullName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <Heart className="w-10 h-10 text-red-500 fill-red-500" />

                        <Avatar className="w-16 h-16 border-2">
                            <AvatarImage src={profile.profilePicture || ''} />
                            <AvatarFallback>{profile.fullName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                         <div className='absolute inset-0 flex items-center justify-center text-xl font-bold text-white drop-shadow-md'>
                                %{compatibilityResult.score}
                         </div>
                    </div>

                    <DialogTitle className="text-xl pt-2">{compatibilityResult.message}</DialogTitle>
                    <DialogDescription>
                        Seninle aranızdaki benzerlik oranına göre bir değerlendirme.
                    </DialogDescription>
                </DialogHeader>
                {compatibilityResult.commonInterests.length > 0 && (
                    <div className="text-center py-4">
                        <h4 className="font-semibold mb-2">Ortak İlgi Alanlarınız</h4>
                        <div className="flex flex-wrap justify-center gap-2">
                        {compatibilityResult.commonInterests.map(interest => (
                            <Badge key={interest} variant="default">{interest}</Badge>
                        ))}
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button onClick={() => setIsDialogOpen(false)} className="w-full">Harika!</Button>
                </DialogFooter>
            </DialogContent>
        )}
      </Dialog>
    </motion.div>
  );
};

export default ProfileCard;
