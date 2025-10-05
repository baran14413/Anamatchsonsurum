
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Heart, Loader2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import { type LikerInfo } from '@/lib/types';
import Image from 'next/image';

function calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) return null;
    const birthday = new Date(dateOfBirth);
    if (isNaN(birthday.getTime())) return null;
    const ageDate = new Date(Date.now() - birthday.getTime());
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export default function BegenilerPage() {
  const t = langTr;
  const { user } = useUser();
  const firestore = useFirestore();
  const [likers, setLikers] = useState<LikerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const likesQuery = query(collection(firestore, 'matches'));
    
    const unsubscribe = onSnapshot(likesQuery, async (snapshot) => {
        const potentialLikerPromises: Promise<LikerInfo | null>[] = [];
        const seenLikerIds = new Set<string>();

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            let likerId: string | null = null;
            let matchId = docSnap.id;

            // Scenario 1: I am user2, user1 liked me, and I haven't acted yet.
            if (data.user2Id === user.uid && data.user1_action === 'liked' && !data.user2_action) {
                likerId = data.user1Id;
            } 
            // Scenario 2: I am user1, user2 liked me, and I haven't acted yet.
            else if (data.user1Id === user.uid && data.user2_action === 'liked' && !data.user1_action) {
                likerId = data.user2Id;
            }

            if (likerId && !seenLikerIds.has(likerId)) {
                seenLikerIds.add(likerId);
                const likerPromise = (async () => {
                    const userDocRef = doc(firestore, 'users', likerId!);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const profileData = userDocSnap.data();
                        return {
                            uid: likerId!,
                            fullName: profileData.fullName || 'BeMatch User',
                            profilePicture: profileData.images?.[0] || '',
                            age: calculateAge(profileData.dateOfBirth),
                            matchId: matchId,
                        };
                    }
                    return null;
                })();
                potentialLikerPromises.push(likerPromise);
            }
        });
        
        const likerProfiles = (await Promise.all(potentialLikerPromises)).filter((p): p is LikerInfo => p !== null && !!p.profilePicture);
        setLikers(likerProfiles);
        setIsLoading(false);
        
    }, (error) => {
        console.error("Error fetching likers: ", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestore]);

  const hasNoContent = !isLoading && likers.length === 0;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
       <div className="flex items-center gap-2 mb-6 p-4">
         <h1 className="text-3xl font-bold tracking-tight">{t.begeniler.title}</h1>
         {!isLoading && likers.length > 0 && (
            <span className="flex items-center justify-center h-7 w-7 bg-primary text-primary-foreground rounded-full text-sm font-bold">
              {likers.length}
            </span>
         )}
       </div>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : hasNoContent ? (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-20 flex flex-col items-center justify-center h-full text-muted-foreground">
                <Heart className="h-16 w-16 mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">{t.begeniler.noLikesTitle}</h2>
                <p>{t.begeniler.noLikesDescription}</p>
            </div>
        </div>
      ) : (
        <div className='h-full overflow-y-auto px-4'>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {likers.map(liker => (
                    <Card key={liker.uid} className="overflow-hidden rounded-lg shadow-lg relative aspect-[3/4] cursor-pointer hover:opacity-90 transition-opacity">
                        <Image 
                            src={liker.profilePicture} 
                            alt={liker.fullName}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            style={{ objectFit: 'cover' }}
                            className="pointer-events-none"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                         <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                            <p className="font-bold truncate">{liker.fullName}{liker.age ? `, ${liker.age}`: ''}</p>
                        </div>
                    </Card>
                ))}
            </div>
         </div>
      )}
    </div>
  );
}
