
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, getDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Heart, Star } from 'lucide-react';
import type { UserProfile, LikerInfo } from '@/lib/types';
import { langTr } from '@/languages/tr';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import ProfileCard from '@/components/profile-card';
import { useToast } from '@/hooks/use-toast';

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
    const [likers, setLikers] = useState<(LikerInfo & { profile: UserProfile })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const t = langTr;
    const { toast } = useToast();
    const [isMatching, setIsMatching] = useState<string | null>(null);

    const isGoldMember = userProfile?.membershipType === 'gold';
    
    const matchesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'matches'));
    }, [user, firestore]);

    useEffect(() => {
        if (!matchesQuery || !firestore || !user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        const unsubscribe = onSnapshot(matchesQuery, async (snapshot) => {
            const potentialLikerTasks: Promise<(LikerInfo & { profile: UserProfile }) | null>[] = [];
            const seenLikerIds = new Set<string>();

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                let likerId: string | null = null;
                
                if (data.user2Id === user.uid && data.user1_action === 'liked' && !data.user2_action) {
                    likerId = data.user1Id;
                }
                
                if (data.user1Id === user.uid && data.user2_action === 'liked' && !data.user1_action) {
                    likerId = data.user2Id;
                }

                if (likerId && !seenLikerIds.has(likerId)) {
                    seenLikerIds.add(likerId);
                    const task = async (): Promise<(LikerInfo & { profile: UserProfile }) | null> => {
                        const userDocSnap = await getDoc(doc(firestore, 'users', likerId!));
                        if (userDocSnap.exists()) {
                            const profileData = userDocSnap.data() as UserProfile;
                             if (!profileData.images || profileData.images.length === 0) return null;
                            return {
                                uid: likerId!,
                                fullName: profileData.fullName || 'BeMatch User',
                                profilePicture: profileData.images?.[0]?.url || '',
                                age: calculateAge(profileData.dateOfBirth),
                                matchId: docSnap.id,
                                profile: { ...profileData, uid: likerId!, id: likerId! }
                            };
                        }
                        return null;
                    };
                    potentialLikerTasks.push(task());
                }
            });
            
            const likerProfiles = (await Promise.all(potentialLikerTasks)).filter((p): p is (LikerInfo & { profile: UserProfile }) => p !== null && !!p.profilePicture);
            setLikers(likerProfiles);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching likers:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [matchesQuery, firestore, user]);

    const handleInstantMatch = async (liker: LikerInfo & { profile: UserProfile }) => {
        if (!user || !firestore || !userProfile) return;

        setIsMatching(liker.uid);
        try {
            const batch = writeBatch(firestore);

            const matchDocRef = doc(firestore, 'matches', liker.matchId);
            batch.update(matchDocRef, {
                status: 'matched',
                matchDate: serverTimestamp(),
            });

            const currentUserMatchData = { id: liker.matchId, matchedWith: liker.uid, lastMessage: t.eslesmeler.defaultMessage, timestamp: serverTimestamp(), fullName: liker.fullName, profilePicture: liker.profilePicture, status: 'matched' };
            const likerMatchData = { id: liker.matchId, matchedWith: user.uid, lastMessage: t.eslesmeler.defaultMessage, timestamp: serverTimestamp(), fullName: userProfile.fullName, profilePicture: userProfile.profilePicture || '', status: 'matched' };

            batch.set(doc(firestore, `users/${user.uid}/matches`, liker.matchId), currentUserMatchData);
            batch.set(doc(firestore, `users/${liker.uid}/matches`, liker.matchId), likerMatchData);
            
            await batch.commit();

            toast({ title: t.anasayfa.matchToastTitle, description: `${liker.fullName} ${t.anasayfa.matchToastDescription}` });

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

    const LikerCard = ({ liker }: { liker: LikerInfo }) => (
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
                <p className="font-bold text-lg truncate">{liker.fullName}{liker.age && `, ${liker.age}`}</p>
            </div>
        </div>
    );
    
    return (
        <AlertDialog>
            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
                <header className="sticky top-0 z-10 p-4 border-b flex items-center justify-center shrink-0 bg-background">
                    <h1 className="text-xl font-bold">{t.begeniler.title} ({likers.length})</h1>
                </header>
                
                {likers.length > 0 ? (
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {likers.map(liker => (
                                isGoldMember ? (
                                    <Sheet key={liker.uid}>
                                        <SheetTrigger>
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
                                                <ProfileCard profile={liker.profile} isDraggable={false} />
                                                <div className='absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent z-30'>
                                                    <Button 
                                                        className='w-full h-14 rounded-full bg-green-500 hover:bg-green-600 text-white' 
                                                        onClick={() => handleInstantMatch(liker)}
                                                        disabled={isMatching === liker.uid}
                                                    >
                                                        {isMatching === liker.uid ? (
                                                            <Icons.logo className='h-6 w-6 animate-pulse' />
                                                        ) : (
                                                            <Heart className="mr-2 h-6 w-6 fill-white" />
                                                        )}
                                                        <span className='font-bold text-lg'>Beğen ve Eşleş</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                ) : (
                                    <AlertDialogTrigger key={liker.uid} asChild>
                                       <div>
                                            <LikerCard liker={liker} />
                                       </div>
                                    </AlertDialogTrigger>
                                )
                            ))}
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
                        <Button className='bg-yellow-400 text-yellow-900 hover:bg-yellow-500'>
                            <Star className="mr-2 h-4 w-4" /> Gold'a Yükselt
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
