'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { Icons } from '@/components/icons';
import { langTr } from '@/languages/tr';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ProfileWithAge = UserProfile & { age?: number };

const calculateAge = (dateString?: string): number | null => {
    if (!dateString) return null;
    const birthDate = new Date(dateString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export default function KesfetPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [profiles, setProfiles] = useState<ProfileWithAge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = langTr.anasayfa;

  const fetchProfiles = useCallback(async (reset = false) => {
    if (!user || !firestore) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);

    try {
        const interactedUids = new Set<string>([user.uid]);
        
        if (!reset) {
            const matchesQuery1 = query(collection(firestore, 'matches'), where('user1Id', '==', user.uid));
            const matchesQuery2 = query(collection(firestore, 'matches'), where('user2Id', '==', user.uid));
            
            const [query1Snapshot, query2Snapshot] = await Promise.all([
                getDocs(matchesQuery1),
                getDocs(matchesQuery2)
            ]);

            query1Snapshot.forEach(doc => interactedUids.add(doc.data().user2Id));
            query2Snapshot.forEach(doc => interactedUids.add(doc.data().user1Id));
        }

        const usersQuery = query(collection(firestore, 'users'), limit(50));
        const usersSnapshot = await getDocs(usersQuery);

        const fetchedProfiles = usersSnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
            .filter(p => p.uid && !interactedUids.has(p.uid) && p.images && p.images.length > 0)
            .map(p => ({
                ...p,
                age: calculateAge(p.dateOfBirth)
            }));
        
        // Simple shuffle
        setProfiles(fetchedProfiles.sort(() => Math.random() - 0.5));

    } catch (error) {
        console.error("Error fetching profiles for discovery:", error);
    } finally {
        setIsLoading(false);
    }
  }, [user, firestore]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);


  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-y-auto snap-y snap-mandatory">
      {profiles.length > 0 ? (
        profiles.map((profile, index) => (
          <div key={profile.uid} className="h-full w-full snap-start flex-shrink-0 relative">
            <div className="absolute inset-0">
               {profile.images?.[0]?.url && (
                 <Image
                    src={profile.images[0].url}
                    alt={profile.fullName || 'Profile'}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority={index < 2} // Prioritize loading for the first few images
                />
               )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 bg-gradient-to-t from-black/80 to-transparent text-white">
                <h3 className="text-3xl font-bold">{profile.fullName}{profile.age && `, ${profile.age}`}</h3>
                {profile.bio && <p className="mt-2 text-base">{profile.bio}</p>}
            </div>
          </div>
        ))
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
             <p>{t.outOfProfilesDescription}</p>
             <Button onClick={() => fetchProfiles(true)} className="mt-4">
                 <RefreshCw className="mr-2 h-4 w-4" />
                 Tekrar Dene
             </Button>
        </div>
      )}
    </div>
  );
}
