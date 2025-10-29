

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase/provider';
import { collection, query, where, onSnapshot, getDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Heart, Star, CheckCircle, Lock, ArrowLeft, X } from 'lucide-react';
import type { UserProfile, DenormalizedMatch } from '@/lib/types';
import { langTr } from '@/languages/tr';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import ProfileCard from '@/components/profile-card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/app-shell';

function calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) return null;
    const birthday = new Date(dateOfBirth);
    if (isNaN(birthday.getTime())) return null;
    const ageDate = new Date(Date.now() - birthday.getTime());
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function BegenilerPageContent() {
    const { user, userProfile } = useUser();
    const firestore = useFirestore();
    const [likers, setLikers] = useState<(DenormalizedMatch & { uid: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const t = langTr;
    const { toast } = useToast();
    const router = useRouter();
    const [isMatching, setIsMatching] = useState<string | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);


    const isGoldMember = userProfile?.membershipType === 'gold';
    
    const likesQuery = useMemo(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, `users/${user.uid}/matches`),
            where('status', 'in', ['pending', 'superlike_pending'])
        );
    }, [user, firestore]);
    

    useEffect(() => {
        if (!likesQuery || !user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        const unsubscribe = onSnapshot(likesQuery, (snapshot) => {
            const likerProfiles = snapshot.docs
                .map(doc => {
                    const data = doc.data() as DenormalizedMatch;
                    return { ...data, uid: data.matchedWith };
                })
                .filter(match => {
                    if (match.status === 'superlike_pending') {
                        return match.superLikeInitiator !== user.uid;
                    }
                    return true;
                });
            
            setLikers(likerProfiles);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching likers:", error);
            setIsLoading(false);
            toast({
                title: "Hata",
                description: "Seni beğenenleri getirirken bir sorun oluştu.",
                variant: "destructive"
            });
        });

        return () => unsubscribe();
    }, [likesQuery, user, toast]);

    const handleCardClick = async (liker: DenormalizedMatch & { uid: string }) => {
        if (isGoldMember) {
            if (firestore && liker.uid) { 
                 const profileDoc = await getDoc(doc(firestore, 'users', liker.uid));
                 if(profileDoc.exists()) {
                     setSelectedProfile({ ...profileDoc.data(), uid: profileDoc.id } as UserProfile);
                 }
            }
        }
    };

    const handleInstantMatch = async (liker: DenormalizedMatch & { uid: string }) => {
        if (!user || !firestore || !userProfile || !liker.uid || liker.status === 'matched') return;

        setIsMatching(liker.uid);
        try {
            const batch = writeBatch(firestore);
            const user1IsCurrentUser = user.uid < liker.uid;
            const defaultLastMessage = langTr.eslesmeler.defaultMessage;

            const mainMatchDocRef = doc(firestore, 'matches', liker.id);
            batch.update(mainMatchDocRef, {
                status: 'matched',
                matchDate: serverTimestamp(),
                [user1IsCurrentUser ? 'user1_action' : 'user2_action']: 'liked',
                [user1IsCurrentUser ? 'user1_timestamp' : 'user2_timestamp']: serverTimestamp(),
            });

            const currentUserMatchRef = doc(firestore, `users/${user.uid}/matches`, liker.id);
            batch.update(currentUserMatchRef, { status: 'matched', lastMessage: defaultLastMessage });
            
            const likerMatchRef = doc(firestore, `users/${liker.uid}/matches`, liker.id);
            batch.update(likerMatchRef, { status: 'matched', lastMessage: defaultLastMessage });

            await batch.commit();

            toast({ title: t.anasayfa.matchToastTitle, description: `${liker.fullName} ${t.anasayfa.matchToastDescription}` });
            
            setSelectedProfile(null);
            router.push(`/eslesmeler/${liker.id}`);

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
            <div className="flex h-dvh w-full items-center justify-center bg-background">
                <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
            </div>
        );
    }

    const LikerCard = ({ liker }: { liker: DenormalizedMatch }) => {
        const age = calculateAge(undefined);
        return (
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md group cursor-pointer">
                <Avatar className="h-full w-full rounded-lg">
                    <AvatarImage src={liker.profilePicture} className={cn("object-cover", !isGoldMember && "blur-md scale-110")} />
                    <AvatarFallback>{liker.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                
                {!isGoldMember && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Lock className="w-12 h-12 text-white/70" />
                    </div>
                )}

                 <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white">
                    <p className="font-bold text-lg truncate">
                       {isGoldMember ? `${liker.fullName}${age ? `, ${age}` : ''}` : liker.fullName?.split(' ')[0] || 'Birisi'}
                    </p>
                 </div>

                 {liker.isSuperLike && (
                     <div className='absolute top-2 right-2'>
                        <Star className='w-8 h-8 text-blue-400 fill-blue-400' />
                    </div>
                 )}
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
             <Sheet open={!!selectedProfile} onOpenChange={(isOpen) => !isOpen && setSelectedProfile(null)}>
                <div className="flex-1 flex flex-col overflow-hidden bg-background">
                    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-lg font-semibold">{t.begeniler.title}</h1>
                        <div className="w-9"></div>
                    </header>
                    {likers.length > 0 ? (
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {likers.map(liker => (
                                    <div key={liker.id} onClick={() => handleCardClick(liker)}>
                                        {isGoldMember ? (
                                            <SheetTrigger asChild disabled={liker.status === 'matched'}>
                                                <div>
                                                    <LikerCard liker={liker}/>
                                                </div>
                                            </SheetTrigger>
                                        ) : (
                                            <AlertDialogTrigger asChild>
                                                <div>
                                                    <LikerCard liker={liker} />
                                                </div>
                                            </AlertDialogTrigger>
                                        )}
                                    </div>
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

                {selectedProfile && (
                <SheetContent side="bottom" className='h-dvh max-h-dvh p-0 border-none bg-transparent'>
                     <SheetHeader className='absolute top-2 right-2 z-50'>
                         <SheetClose asChild>
                            <Button variant="ghost" size="icon" className="rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white" type="button">
                                <X className="h-6 w-6" />
                            </Button>
                        </SheetClose>
                    </SheetHeader>
                    <div className='relative h-full w-full bg-card rounded-t-2xl overflow-hidden flex flex-col'>
                        <ProfileCard profile={selectedProfile} onSwipe={() => {}} />
                        <div className='absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent z-30'>
                                <Button 
                                    className='w-full h-14 rounded-full bg-green-500 hover:bg-green-600 text-white' 
                                    onClick={() => handleInstantMatch(likers.find(l => l.uid === selectedProfile.uid)!)}
                                    disabled={isMatching === selectedProfile.uid}
                                >
                                    {isMatching === selectedProfile.uid ? (
                                        <Icons.logo className='h-6 w-6 animate-pulse' />
                                    ) : (
                                        <Heart className="mr-2 h-6 w-6 fill-white" />
                                    )}
                                    <span className='font-bold text-lg'>Beğen ve Eşleş</span>
                                </Button>
                        </div>
                    </div>
                </SheetContent>
                )}

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
            </Sheet>
        </AlertDialog>
    );
}

export default function BegenilerPage() {
    return (
        <AppShell>
            <BegenilerPageContent />
        </AppShell>
    );
}
