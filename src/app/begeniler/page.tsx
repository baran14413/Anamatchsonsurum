'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
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
        // Case 1: The current user is user2Id, and user1 has liked them,
        // but user2 (current user) hasn't acted yet.
        const likesAsUser2Query = query(
          collection(firestore, 'matches'),
          where('user2Id', '==', user.uid),
          where('user1_action', '==', 'liked'),
          where('user2_action', '==', null)
        );

        // Case 2: The current user is user1Id, and user2 has liked them,
        // but user1 (current user) hasn't acted yet.
        const likesAsUser1Query = query(
          collection(firestore, 'matches'),
          where('user1Id', '==', user.uid),
          where('user2_action', '==', 'liked'),
          where('user1_action', '==', null)
        );
        
        const [asUser2Snapshot, asUser1Snapshot] = await Promise.all([
            getDocs(likesAsUser2Query),
            getDocs(likesAsUser1Query),
        ]);

        const likerIds = new Set<string>();
        
        // From Case 1, the liker is user1Id
        asUser2Snapshot.forEach(doc => {
            likerIds.add(doc.data().user1Id);
        });

        // From Case 2, the liker is user2Id
        asUser1Snapshot.forEach(doc => {
            likerIds.add(doc.data().user2Id);
        });

        if (likerIds.size === 0) {
            setLikers([]);
            setIsLoading(false);
            return;
        }

        // Fetch profile info for all unique likers
        const likerProfiles: LikerInfo[] = [];
        const profilePromises = Array.from(likerIds).map(async (uid) => {
            const userDocRef = doc(firestore, 'users', uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const profileData = userDocSnap.data();
                likerProfiles.push({
                    uid: uid,
                    fullName: profileData.fullName || 'BeMatch User',
                    profilePicture: profileData.images[0] || '',
                    age: calculateAge(profileData.dateOfBirth),
                    matchId: '' // MatchId is not directly needed for display here
                });
            }
        });

        await Promise.all(profilePromises);

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
       <h1 className="mb-6 text-3xl font-bold tracking-tight">{t.begeniler.title}</h1>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : likers.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {likers.map(liker => (
                <Card key={liker.uid} className="overflow-hidden rounded-lg shadow-lg relative aspect-[3/4]">
                    <Image 
                        src={liker.profilePicture} 
                        alt={liker.fullName}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="pointer-events-none"
                    />
                     <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white">
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
