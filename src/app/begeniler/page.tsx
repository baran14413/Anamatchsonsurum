'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase/provider';
import { collection, query, where, onSnapshot, getDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Heart, Star, CheckCircle } from 'lucide-react';
import type { UserProfile, LikerInfo, DenormalizedMatch } from '@/lib/types';
import { langTr } from '@/languages/tr';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import ProfileCard from '@/components/profile-card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

function calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) return null;
    const birthday = new Date(dateOfBirth);
    if (isNaN(birthday.getTime())) return null;
    const ageDate = new Date(Date.now() - birthday.getTime());
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export default function BegenilerPage() {
    const { user, userProfile } = useUser();
    const firestore = useFirestore();
    const [likers, setLikers] = useState<(DenormalizedMatch & { profile?: UserProfile })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const t = langTr;
    const { toast } = useToast();
    const router = useRouter();
    const [isMatching, setIsMatching] = useState<string | null>(null);

    const isGoldMember = userProfile?.membershipType === 'gold';
    
    const superLikesQuery = useMemo(() => {
        if (!user || !firestore) return null;
        // Query for Super Likes where the current user is NOT the initiator
        return query(
            collection(firestore, `users/${user.uid}/matches`), 
            where('status', '==', 'superlike_pending'),
            where('superLikeInitiator', '!=', user.uid)
        );
    }, [user, firestore]);

    useEffect(() => {
        if (!superLikesQuery) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        const unsubscribe = onSnapshot(superLikesQuery, async (snapshot) => {
            const potentialLikerTasks = snapshot.docs.map(async (matchDoc) => {
                const matchData = matchDoc.data() as DenormalizedMatch;
                const likerId = matchData.matchedWith;

                if (!likerId) return null;

                const userDocSnap = await getDoc(doc(firestore, 'users', likerId));
                if (userDocSnap.exists()) {
                    const profileData = userDocSnap.data() as UserProfile;
                    if (!profileData.images || profileData.images.length === 0) return null;

                    return {
                        ...matchData,
                        profile: { ...profileData, uid: likerId, id: likerId }
                    };
                }
                return null;
            });
            
            const likerProfiles = (await Promise.all(potentialLikerTasks))
              .filter((p): p is (DenormalizedMatch & { profile: UserProfile }) => p !== null && !!p.profile?.profilePicture);
              
            setLikers(likerProfiles);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching super likers:", error);
            setIsLoading(false);
            toast({
                title: "Hata",
                description: "Seni beğenenleri getirirken bir sorun oluştu.",
                variant: "destructive"
            });
        });

        return () => unsubscribe();
    }, [superLikesQuery, firestore, toast]);

    const handleInstantMatch = async (liker: DenormalizedMatch & { profile: UserProfile }) => {
        if (!user || !firestore || !userProfile || liker.status === 'matched') return;

        setIsMatching(liker.matchedWith);
        try {
            const batch = writeBatch(firestore);

            const mainMatchDocRef = doc(firestore, 'matches', liker.id);
            batch.update(mainMatchDocRef, {
                status: 'matched',
                matchDate: serverTimestamp(),
            });

            const currentUserMatchRef = doc(firestore, `users/${user.uid}/matches`, liker.id);
            batch.update(currentUserMatchRef, { status: 'matched', lastMessage: t.eslesmeler.defaultMessage });
            
            const likerMatchRef = doc(firestore, `users/${liker.matchedWith}/matches`, liker.id);
            batch.update(likerMatchRef, { status: 'matched', lastMessage: t.eslesmeler.defaultMessage });

            await batch.commit();

            toast({ title: t.anasayfa.matchToastTitle, description: `${liker.fullName} ${t.anasayfa.matchToastDescription}` });
            
            setLikers(prevLikers => prevLikers.filter(l => l.id !== liker.id));

        } catch (error) {
            console.error("Error creating instant match:", error);
            toast({
                title: t.common.error,
                description: "Eşleşme oluşturulurken bir hata oluştu.",
                variant: 'destructive',
            });
        } finally {
            setIsMatching(null);
        }
    };


    if (isLoading) {
        return (
            <div className="flex h-dvh w-full items-center justify-center">
                <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
            </div>
        );
    }

    const LikerCard = ({ liker }: { liker: DenormalizedMatch & { profile?: UserProfile } }) => {
        const age = liker.profile ? calculateAge(liker.profile.dateOfBirth) : null;
        return (
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md group cursor-pointer">
                <Avatar className="h-full w-full rounded-lg">
                    <AvatarImage src={liker.profilePicture} className={!isGoldMember ? "object-cover blur-md" : "object-cover"} />
                    <AvatarFallback>{liker.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                {!isGoldMember && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-4xl" role="img" aria-label="lock">🔒</span>
                    </div>
                )}
                 <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white">
                    <p className="font-bold text-lg truncate">{liker.fullName}{age && `, ${age}`}</p>
                </div>
                 {liker.status === 'matched' && (
                     <div className="absolute inset-0 bg-green-900/40 flex items-center justify-center">
                        <Badge className='bg-green-500 text-white text-base py-2 px-4'>
                            <CheckCircle className='mr-2 h-5 w-5'/>
                            Eşleştiniz
                        </Badge>
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <AlertDialog>
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="sticky top-0 z-10 p-4 border-b flex items-center justify-center shrink-0 bg-background">
                    <h1 className="text-xl font-bold">{t.begeniler.title} ({likers.length})</h1>
                </header>
                
                {likers.length > 0 ? (
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {likers.map(liker => {
                                if (!liker.profile) return null;
                                return (
                                isGoldMember ? (
                                    <Sheet key={liker.id}>
                                        <SheetTrigger disabled={liker.status === 'matched'}>
                                            <LikerCard liker={liker} />
                                        </SheetTrigger>
                                        <SheetContent side="bottom" className='h-dvh max-h-dvh p-0 border-none bg-transparent'>
                                            <SheetHeader className='sr-only'>
                                                <SheetTitle>Profil Detayları</SheetTitle>
                                                <SheetDescription>
                                                    {liker.fullName} kullanıcısının profil detayları.
                                                </SheetDescription>
                                            </SheetHeader>
                                            <div className='relative h-full w-full bg-card rounded-t-2xl overflow-hidden flex flex-col'>
                                                <ProfileCard profile={liker.profile} />
                                                <div className='absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent z-30'>
                                                     {liker.status !== 'matched' && (
                                                         <Button 
                                                            className='w-full h-14 rounded-full bg-green-500 hover:bg-green-600 text-white' 
                                                            onClick={() => handleInstantMatch(liker as DenormalizedMatch & { profile: UserProfile })}
                                                            disabled={isMatching === liker.matchedWith}
                                                        >
                                                            {isMatching === liker.matchedWith ? (
                                                                <Icons.logo className='h-6 w-6 animate-pulse' />
                                                            ) : (
                                                                <Heart className="mr-2 h-6 w-6 fill-white" />
                                                            )}
                                                            <span className='font-bold text-lg'>Beğen ve Eşleş</span>
                                                        </Button>
                                                     )}
                                                </div>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                ) : (
                                    <AlertDialogTrigger key={liker.id} asChild>
                                       <div>
                                            <LikerCard liker={liker} />
                                       </div>
                                    </AlertDialogTrigger>
                                )
                            )})}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                        <Heart className="h-16 w-16 mb-4 text-gray-300" />
                        <h2 className="text-2xl font-semibold text-foreground mb-2">{t.begeniler.noLikesTitle}</h2>
                        <p>{t.begeniler.noLikesDescription}</p>
                    </div>
                )}
            </div>

            <AlertDialogContent>
                <AlertDialogHeader className='items-center text-center'>
                     <div className="w-16 h-16 rounded-full bg-yellow-400/20 flex items-center justify-center mb-4">
                        <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" />
                     </div>
                    <AlertDialogTitle className="text-2xl">Seni Kimin Beğendiğini Gör!</AlertDialogTitle>
                    <AlertDialogDescription>
                       BeMatch Gold'a yükselterek seni beğenen herkesi anında görebilir ve eşleşme şansını artırabilirsin.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                    <AlertDialogCancel>Şimdi Değil</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button className='bg-yellow-400 text-yellow-900 hover:bg-yellow-500' onClick={() => router.push('/market')}>
                            <Star className="mr-2 h-4 w-4" /> Gold'a Yükselt
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
