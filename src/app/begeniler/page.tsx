
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { Heart, Star } from 'lucide-react';
import type { UserProfile, LikerInfo } from '@/lib/types';
import { langTr } from '@/languages/tr';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

function calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) return null;
    const birthday = new Date(dateOfBirth);
    if (isNaN(birthday.getTime())) return null;
    const ageDate = new Date(Date.now() - birthday.getTime());
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export default function BegenilerPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [likers, setLikers] = useState<LikerInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const t = langTr.begeniler;
    
    const matchesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        // This query is broad, but necessary to catch likes from both sides
        return query(collection(firestore, 'matches'));
    }, [user, firestore]);


    useEffect(() => {
        if (!matchesQuery || !firestore || !user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        const unsubscribe = onSnapshot(matchesQuery, async (snapshot) => {
            const potentialLikerTasks: Promise<LikerInfo | null>[] = [];
            const seenLikerIds = new Set<string>();

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                let likerId: string | null = null;
                
                // Scenario 1: Someone liked me, and I haven't acted yet.
                if (data.user2Id === user.uid && data.user1_action === 'liked' && !data.user2_action) {
                    likerId = data.user1Id;
                }
                
                // Scenario 2: I was liked by user2, and I haven't acted.
                if (data.user1Id === user.uid && data.user2_action === 'liked' && !data.user1_action) {
                    likerId = data.user2Id;
                }

                if (likerId && !seenLikerIds.has(likerId)) {
                    seenLikerIds.add(likerId);
                    const task = async (): Promise<LikerInfo | null> => {
                        const userDocSnap = await getDoc(doc(firestore, 'users', likerId!));
                        if (userDocSnap.exists()) {
                            const profileData = userDocSnap.data() as UserProfile;
                            return {
                                uid: likerId!,
                                fullName: profileData.fullName || 'BeMatch User',
                                profilePicture: profileData.images?.[0]?.url || '',
                                age: calculateAge(profileData.dateOfBirth),
                                matchId: docSnap.id,
                            };
                        }
                        return null;
                    };
                    potentialLikerTasks.push(task());
                }
            });
            
            const likerProfiles = (await Promise.all(potentialLikerTasks)).filter((p): p is LikerInfo => p !== null && !!p.profilePicture);
            setLikers(likerProfiles);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching likers:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [matchesQuery, firestore, user]);

    if (isLoading) {
        return (
            <div className="flex h-dvh w-full items-center justify-center">
                <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
            </div>
        );
    }
    
    return (
        <AlertDialog>
            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
                <header className="sticky top-0 z-10 p-4 border-b flex items-center justify-center shrink-0 bg-background">
                    <h1 className="text-xl font-bold">{t.title} ({likers.length})</h1>
                </header>
                
                {likers.length > 0 ? (
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {likers.map(liker => (
                                <AlertDialogTrigger key={liker.uid} asChild>
                                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md group cursor-pointer">
                                        <Avatar className="h-full w-full rounded-lg">
                                            <AvatarImage src={liker.profilePicture} className="object-cover blur-md"/>
                                            <AvatarFallback>{liker.fullName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <span className="text-4xl" role="img" aria-label="lock">🔒</span>
                                        </div>
                                    </div>
                                </AlertDialogTrigger>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                        <Heart className="h-16 w-16 mb-4 text-gray-300" />
                        <h2 className="text-2xl font-semibold text-foreground mb-2">{t.noLikesTitle}</h2>
                        <p>{t.noLikesDescription}</p>
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
