'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { Loader2, Heart } from 'lucide-react';
import type { UserProfile, LikerInfo } from '@/lib/types';
import { langTr } from '@/languages/tr';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

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

    useEffect(() => {
        if (!user || !firestore) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        const q = query(collection(firestore, 'matches'));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const potentialLikerTasks: Promise<LikerInfo | null>[] = [];
            const seenLikerIds = new Set<string>();

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                let likerId: string | null = null;
                
                // Scenario 1: Someone liked me, and I haven't acted yet.
                if (data.user2Id === user.uid && data.user1_action === 'liked' && !data.user2_action) {
                    likerId = data.user1Id;
                }
                // Scenario 2: I liked someone, but this page is for who liked ME.
                // But if they also liked me, it's a match, not a "like".
                // The logic here is to show who has an open "liked" action towards the current user.
                
                // This logic is tricky with compound queries. Let's simplify.
                // We fetch all docs where I am involved and one party has liked.
                // Then we filter client-side.

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
    }, [user, firestore]);

    if (isLoading) {
        return (
            <div className="flex h-dvh w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
            <header className="sticky top-0 z-10 p-4 border-b flex items-center justify-center shrink-0 bg-background">
                <h1 className="text-xl font-bold">{t.title} ({likers.length})</h1>
            </header>
            
            {likers.length > 0 ? (
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {likers.map(liker => (
                            <Link href={`/profil/${liker.uid}`} key={liker.uid}>
                                <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md group cursor-pointer">
                                    <Avatar className="h-full w-full rounded-lg">
                                        <AvatarImage src={liker.profilePicture} className="object-cover"/>
                                        <AvatarFallback>{liker.fullName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                    <div className="absolute bottom-0 left-0 p-2 text-white">
                                        <p className="font-bold text-sm truncate">{liker.fullName}{liker.age ? `, ${liker.age}` : ''}</p>
                                    </div>
                                </div>
                            </Link>
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
    );
}
