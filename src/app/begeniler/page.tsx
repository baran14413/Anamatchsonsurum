
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc, or } from 'firebase/firestore';
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
    };

    const fetchLikers = async () => {
      setIsLoading(true);
      try {
        
        const likesQuery1 = query(
          collection(firestore, 'matches'),
          where('user2Id', '==', user.uid),
          where('user1_action', '==', 'liked')
        );
        
        const likesQuery2 = query(
          collection(firestore, 'matches'),
          where('user1Id', '==', user.uid),
          where('user2_action', '==', 'liked')
        );
        
        const [query1Snapshot, query2Snapshot] = await Promise.all([
            getDocs(likesQuery1),
            getDocs(likesQuery2)
        ]);

        const potentialLikers: { likerId: string }[] = [];

        query1Snapshot.forEach(docSnap => {
            const data = docSnap.data();
            // If I am user2, and user1 has liked me, but I haven't acted yet.
            if (!data.user2_action) {
                potentialLikers.push({ likerId: data.user1Id });
            }
        });

        query2Snapshot.forEach(docSnap => {
            const data = docSnap.data();
            // If I am user1, and user2 has liked me, but I haven't acted yet.
            if (!data.user1_action) {
                potentialLikers.push({ likerId: data.user2Id });
            }
        });


        if (potentialLikers.length === 0) {
            setLikers([]);
            setIsLoading(false);
            return;
        }

        const likerIds = [...new Set(potentialLikers.map(p => p.likerId))];
        
        const profilePromises = likerIds.map(async (uid) => {
            const userDocRef = doc(firestore, 'users', uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const profileData = userDocSnap.data();
                return {
                    uid: uid,
                    fullName: profileData.fullName || 'BeMatch User',
                    profilePicture: profileData.images?.[0] || '',
                    age: calculateAge(profileData.dateOfBirth),
                };
            }
            return null;
        });

        const likerProfiles = (await Promise.all(profilePromises)).filter((p): p is LikerInfo => p !== null && !!p.profilePicture);

        setLikers(likerProfiles);

      } catch (error) {
        console.error("Error fetching likers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikers();
  }, [user, firestore]);

  return (
    <div className="container mx-auto max-w-2xl p-4 md:py-8 h-full flex flex-col">
       <div className="flex items-center gap-2 mb-6">
         <h1 className="text-3xl font-bold tracking-tight">{t.begeniler.title}</h1>
         {likers.length > 0 && (
            <span className="flex items-center justify-center h-7 w-7 bg-primary text-primary-foreground rounded-full text-sm font-bold">
              {likers.length}
            </span>
         )}
       </div>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : likers.length > 0 ? (
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
      ) : (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-20 flex flex-col items-center justify-center h-full text-muted-foreground">
                <Heart className="h-16 w-16 mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">{t.begeniler.noLikesTitle}</h2>
                <p>{t.begeniler.noLikesDescription}</p>
            </div>
      </div>
      )}
    </div>
  );
}
