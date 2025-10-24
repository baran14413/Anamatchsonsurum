
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'firebase/auth';
import { useUser, useFirestore } from '@/firebase/provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Heart, Star, ShieldCheckIcon, GalleryHorizontal, ChevronRight, Gem, LogOut, Video, Shield } from 'lucide-react';
import { langTr } from '@/languages/tr';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import CircularProgress from '@/components/circular-progress';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import type { Match, UserImage, DenormalizedMatch } from '@/lib/types';
import AppShell from '@/components/app-shell';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


const StatCard = ({ icon: Icon, title, value, href, iconClass }: { icon: React.ElementType, title: string, value: string | number, href?: string, iconClass?: string }) => {
  const content = (
    <div className="flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-card/80 text-card-foreground shadow-sm">
      <Icon className={`h-6 w-6 ${iconClass}`} />
      <span className="text-sm font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{title}</span>
    </div>
  );
  
  if (href) {
    return <Link href={href} className="flex-1">{content}</Link>;
  }
  return content;
};


function ProfilePageContent() {
  const t = langTr;
  const { user, userProfile, auth } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [matches, setMatches] = useState<DenormalizedMatch[]>([]);
  const [likeRatio, setLikeRatio] = useState(75); // Default encouraging value

  const matchesQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'matches'),
      where('status', '==', 'matched')
    );
  }, [user, firestore]);

  // Effect for matches
  useEffect(() => {
    if (!matchesQuery) return;

    const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
        const matchesData = snapshot.docs.map(doc => doc.data() as DenormalizedMatch);
        setMatches(matchesData);
    }, (error) => {
        console.error("Failed to fetch matches:", error);
    });

    return () => unsubscribe();
  }, [matchesQuery]);

  // Effect for calculating real like ratio
   useEffect(() => {
    if (!user || !firestore) return;

    const fetchInteractions = async () => {
        const userUid = user.uid;
        
        const query1 = query(collection(firestore, 'matches'), where('user1Id', '==', userUid));
        const query2 = query(collection(firestore, 'matches'), where('user2Id', '==', userUid));

        try {
            const [snapshot1, snapshot2] = await Promise.all([getDocs(query1), getDocs(query2)]);
            
            let totalLikes = 0;
            let totalDislikes = 0;

            snapshot1.forEach(doc => {
                const data = doc.data() as Match;
                if (data.user2_action === 'liked' || data.user2_action === 'superliked') {
                    totalLikes++;
                } else if (data.user2_action === 'disliked') {
                    totalDislikes++;
                }
            });

            snapshot2.forEach(doc => {
                const data = doc.data() as Match;
                 if (data.user1_action === 'liked' || data.user1_action === 'superliked') {
                    totalLikes++;
                } else if (data.user1_action === 'disliked') {
                    totalDislikes++;
                }
            });
            
            const totalInteractions = totalLikes + totalDislikes;
            
            if (totalInteractions > 0) {
                const ratio = Math.round((totalLikes / totalInteractions) * 100);
                setLikeRatio(ratio);
            }
            
        } catch (error) {
            console.error("Error fetching like ratio data:", error);
        }
    };
    
    fetchInteractions();

  }, [user, firestore]);
    
  const calculateProfileCompletion = (): number => {
      if (!userProfile) return 0;
      let score = 0;
      const maxScore = 7;
      if (userProfile.fullName) score++;
      if (userProfile.dateOfBirth) score++;
      if (userProfile.gender) score++;
      if (userProfile.location) score++;
      if (userProfile.lookingFor) score++;
      if (userProfile.images && userProfile.images.length >= 2) score++;
      if (userProfile.interests && userProfile.interests.length > 0) score++;
      return Math.round((score / maxScore) * 100);
  }

  const profileCompletionPercentage = calculateProfileCompletion();
  const superLikeBalance = userProfile?.superLikeBalance ?? 0;
  
  let isGoldMember = userProfile?.membershipType === 'gold';
  if (isGoldMember && userProfile?.goldMembershipExpiresAt) {
    const expiryDate = userProfile.goldMembershipExpiresAt.toDate();
    if (expiryDate < new Date()) {
      isGoldMember = false;
    }
  }
  
  const galleryImages = userProfile?.images?.slice(0, 4) || [];
  const filteredMatches = matches.filter(match => match.matchedWith !== user?.uid);


  return (
    <div className="flex-1 overflow-y-auto bg-muted/30">
      <div className="p-4 space-y-6">

        {/* Profile Header */}
        <Card className="relative p-4 shadow-sm bg-card/60 backdrop-blur-sm border-white/20 rounded-2xl">
          <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-4 flex-1">
                  <h1 className="text-2xl font-bold">
                      {userProfile?.fullName}
                  </h1>
                  <div className="flex items-stretch gap-2 w-full">
                      <StatCard 
                        icon={Heart}
                        title="Beğeni Oranı"
                        value={`%${likeRatio}`}
                        iconClass="text-pink-500"
                      />
                      <StatCard
                        icon={Star}
                        title="Super Like"
                        value={superLikeBalance}
                        href="/market"
                        iconClass="text-blue-500"
                      />
                      <StatCard
                        icon={Gem}
                        title="Üyelik"
                        value={isGoldMember ? 'Gold' : 'Free'}
                        href="/market"
                        iconClass="text-yellow-500"
                      />
                  </div>
              </div>
               <div className="relative shrink-0 w-24 h-24 flex items-center justify-center">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                      <AvatarImage src={userProfile?.profilePicture || user?.photoURL || ''} alt={userProfile?.fullName || 'User'} />
                      <AvatarFallback>{userProfile?.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                   <div className="absolute inset-0 flex items-center justify-center">
                       <CircularProgress progress={profileCompletionPercentage} size={96} strokeWidth={5} />
                   </div>
              </div>
          </div>
        </Card>

        {filteredMatches.length > 0 && (
          <Card className="shadow-sm bg-card/80 backdrop-blur-sm rounded-2xl">
            <CardContent className='p-4'>
                <ScrollArea>
                    <div className="flex items-center gap-x-2">
                        {filteredMatches.map((match, index, array) => (
                            <div key={match.id} className="flex items-center gap-x-2">
                                 <Link href={`/eslesmeler/${match.id}`}>
                                    <div className='flex flex-col items-center gap-2 w-20'>
                                        <Avatar className="h-16 w-16 border-2 border-primary">
                                            <AvatarImage src={match.profilePicture} />
                                            <AvatarFallback>{(match.fullName || '').charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className='text-xs font-medium truncate w-full text-center'>{match.fullName}</span>
                                    </div>
                                </Link>
                                {index < array.length - 1 && <Heart className='h-4 w-4 text-muted-foreground shrink-0 animate-pulse-heart' />}
                            </div>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
          </Card>
        )}
        
        {galleryImages.length > 0 && (
             <Link href="/profil/galeri">
                <Card className="p-4 shadow-sm bg-card/60 backdrop-blur-sm border-white/20 rounded-2xl cursor-pointer">
                    <div className="grid grid-cols-2 gap-2">
                        {galleryImages.map((image, index) => (
                            <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                                {image.type === 'video' ? (
                                    <>
                                        <video src={image.url} className="w-full h-full object-cover" muted loop playsInline />
                                        <div className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-1.5 backdrop-blur-sm">
                                            <Video className="w-3.5 h-3.5" />
                                        </div>
                                    </>
                                ) : (
                                    <Image src={image.url} alt={`Galeri fotoğrafı ${index + 1}`} fill className="object-cover" />
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            </Link>
        )}
        
        {!isGoldMember && (
          <Card className='shadow-md bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 text-white rounded-2xl'>
              <CardContent className='p-4 flex items-center gap-4'>
                  <Icons.beGold width={48} height={48} />
                  <div className='flex-1'>
                      <h2 className='font-bold'>BeMatch Gold'a eriş</h2>
                      <p className='text-sm text-white/90'>Sınırsız beğeni ve eşsiz özellikler kazan!</p>
                  </div>
                  <Link href="/market">
                    <Button variant='secondary' size='sm' className='rounded-full bg-white text-black hover:bg-gray-200'>
                        {t.profil.upgrade}
                    </Button>
                  </Link>
              </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
    return (
        <AppShell>
            <ProfilePageContent />
        </AppShell>
    );
}

    