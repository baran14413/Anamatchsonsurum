

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { useUser, useFirestore } from '@/firebase/provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Heart, Star, ShieldCheckIcon, GalleryHorizontal, ChevronRight, Gem } from 'lucide-react';
import { langTr } from '@/languages/tr';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import CircularProgress from '@/components/circular-progress';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import type { Match } from '@/lib/types';


export default function ProfilePage() {
  const t = langTr;
  const { user, userProfile, auth } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [likeRatio, setLikeRatio] = useState(75); // Default encouraging value

  const matchesQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'matches'),
      where('status', '==', 'matched')
    );
  }, [user, firestore]);

  // Effect for match count
  useEffect(() => {
    if (!matchesQuery) return;

    const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
        setMatchCount(snapshot.size);
    }, (error) => {
        console.error("Failed to fetch match count:", error);
    });

    return () => unsubscribe();
  }, [matchesQuery]);

  // Effect for calculating real like ratio
   useEffect(() => {
    if (!user || !firestore) return;

    const fetchInteractions = async () => {
        const userUid = user.uid;
        
        // Query where the user is user1 and was rated by user2
        const query1 = query(collection(firestore, 'matches'), where('user1Id', '==', userUid));
        // Query where the user is user2 and was rated by user1
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
            // If no interactions, keep the default encouraging value
            
        } catch (error) {
            console.error("Error fetching like ratio data:", error);
            // In case of error, fallback to the default value
        }
    };
    
    fetchInteractions();

  }, [user, firestore]);


  const handleLogout = async () => {
    if (!auth) return;
    setIsLoggingOut(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: t.ayarlar.toasts.logoutErrorTitle,
        description: t.ayarlar.toasts.logoutErrorDesc,
        variant: "destructive"
      });
      setIsLoggingOut(false);
    }
  };
  
  const calculateAge = (dateOfBirth: string | undefined | null): number | null => {
      if (!dateOfBirth) return null;
      const birthday = new Date(dateOfBirth);
      if (isNaN(birthday.getTime())) return null;
      const ageDifMs = Date.now() - birthday.getTime();
      const ageDate = new Date(ageDifMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
  };
    
  const calculateProfileCompletion = (): number => {
      if (!userProfile) return 0;
      let score = 0;
      const maxScore = 7;
      if (userProfile.fullName) score++;
      if (userProfile.dateOfBirth) score++;
      if (userProfile.gender) score++;
      if (userProfile.location) score++;
      if (userProfile.lookingFor) score++;
      if (userProfile.media && userProfile.media.length >= 2) score++;
      if (userProfile.interests && userProfile.interests.length > 0) score++;
      return Math.round((score / maxScore) * 100);
  }

  const age = calculateAge(userProfile?.dateOfBirth);
  const profileCompletionPercentage = calculateProfileCompletion();
  const superLikeBalance = userProfile?.superLikeBalance ?? 0;
  
  let isGoldMember = userProfile?.membershipType === 'gold';
  if (isGoldMember && userProfile?.goldMembershipExpiresAt) {
    const expiryDate = userProfile.goldMembershipExpiresAt.toDate();
    if (expiryDate < new Date()) {
      isGoldMember = false;
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto max-w-2xl p-4 space-y-6">

        {/* Profile Header */}
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
              <AvatarImage src={userProfile?.profilePicture || user?.photoURL || ''} alt={userProfile?.fullName || 'User'} />
              <AvatarFallback>{userProfile?.fullName?.charAt(0)}</AvatarFallback>
            </Avatar>
             {profileCompletionPercentage < 100 && (
                <div className="absolute -bottom-1 -right-1">
                    <CircularProgress progress={profileCompletionPercentage} size={44} />
                </div>
            )}
          </div>
          
          <div className="text-center space-y-1">
             <h1 className="text-2xl font-bold flex items-center gap-2">
                {userProfile?.fullName || t.profil.user}{age && `, ${age}`}
                {isGoldMember ? <Icons.beGold width={24} height={24} /> : <ShieldCheckIcon className="h-6 w-6 text-blue-500" />}
            </h1>
            {isGoldMember && <p className="font-semibold text-yellow-500">Gold Üye</p>}
          </div>
        </div>

        {/* Gold Card */}
        {!isGoldMember && (
          <Card className='shadow-md bg-gradient-to-r from-red-500 to-yellow-400 text-white'>
              <CardContent className='p-4 flex items-center gap-4'>
                  <Icons.beGold width={48} height={48} />
                  <div className='flex-1'>
                      <h2 className='font-bold'>BeMatch Gold'a eriş</h2>
                      <p className='text-sm text-white/90'>Eşsiz özellikleri kazan!</p>
                  </div>
                  <Link href="/market">
                    <Button variant='secondary' size='sm' className='rounded-full bg-white text-black hover:bg-gray-200'>
                        {t.profil.upgrade}
                    </Button>
                  </Link>
              </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
           <Card className="p-3 flex flex-col items-center justify-center space-y-1 border-0 bg-card/30 backdrop-blur-sm">
              <Heart className="h-6 w-6 text-red-500 fill-red-500" />
              <p className="text-base font-bold">{matchCount}</p>
              <span className="text-xs text-muted-foreground">Eşleşme</span>
          </Card>
           <Card className="p-3 flex flex-col items-center justify-center space-y-1 border-0 bg-card/30 backdrop-blur-sm">
              <Star className="h-6 w-6 text-blue-400 fill-blue-400" />
              <p className="text-base font-bold">{superLikeBalance}</p>
               <Link href="/market">
                <span className="text-xs font-semibold text-blue-500 cursor-pointer">{t.profil.getMore}</span>
              </Link>
          </Card>
          <Card className="p-3 flex flex-col items-center justify-center space-y-1 border-0 bg-card/30 backdrop-blur-sm">
              <Heart className="h-6 w-6 text-pink-400 fill-pink-400" />
              <p className="text-base font-bold">% {likeRatio}</p>
               <span className="text-xs text-muted-foreground">Beğeni Oranı</span>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
           <Link href="/profil/galeri">
            <Button className="w-full h-14 rounded-full font-bold text-base bg-gradient-to-r from-pink-500 to-orange-400 text-white">
                Galerini Düzenle
            </Button>
          </Link>
        </div>

        {/* Logout */}
        <div className="pt-8">
           <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full text-muted-foreground font-bold">
                        {t.profil.logout}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t.common.logoutConfirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t.common.logoutConfirmDescription}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
                        {isLoggingOut ? <Icons.logo width={16} height={16} className="h-4 w-4 animate-pulse" /> : t.common.logout}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
    </div>
  );
}
