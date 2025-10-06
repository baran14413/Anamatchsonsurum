
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { Icons } from '@/components/icons';
import { langTr } from '@/languages/tr';
import { RefreshCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDistance } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type ProfileWithAgeAndDistance = UserProfile & { age?: number; distance?: number };

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
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const [profiles, setProfiles] = useState<ProfileWithAgeAndDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = langTr.anasayfa;
  const { toast } = useToast();

 const fetchProfiles = useCallback(async (reset = false) => {
    if (!user || !firestore || !userProfile?.location?.latitude || !userProfile?.location?.longitude) {
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

        const qConstraints = [];
        const genderPref = userProfile?.genderPreference;
        const isGlobalMode = userProfile?.globalModeEnabled;
        const ageRange = userProfile?.ageRange;

        if (genderPref && genderPref !== 'both') {
          qConstraints.push(where('gender', '==', genderPref));
        }
        
        qConstraints.push(limit(100));
        
        const usersCollectionRef = collection(firestore, 'users');
        const usersQuery = query(usersCollectionRef, ...qConstraints);

        const querySnapshot = await getDocs(usersQuery);
        
        let fetchedProfiles = querySnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
            .filter(p => {
                if (!p.uid || interactedUids.has(p.uid)) return false;
                if (!p.fullName || !p.images || p.images.length === 0) return false;
                
                const age = calculateAge(p.dateOfBirth);
                (p as ProfileWithAgeAndDistance).age = age ?? undefined;

                if (ageRange && age) {
                    const minAge = userProfile.expandAgeRange ? ageRange.min - 5 : ageRange.min;
                    const maxAge = userProfile.expandAgeRange ? ageRange.max + 5 : ageRange.max;
                    if (age < minAge || age > maxAge) return false;
                }
                
                if (!isGlobalMode) {
                    if (!p.location?.latitude || !p.location?.longitude) return false;
                    const distance = getDistance(
                        userProfile.location!.latitude!,
                        userProfile.location!.longitude!,
                        p.location.latitude,
                        p.location.longitude
                    );
                    (p as ProfileWithAgeAndDistance).distance = distance;
                    const userDistancePref = userProfile.distancePreference || 50;
                    if (distance > userDistancePref) return false;
                } else {
                     if (p.location?.latitude && p.location?.longitude) {
                        const distance = getDistance(
                            userProfile.location!.latitude!,
                            userProfile.location!.longitude!,
                            p.location.latitude,
                            p.location.longitude
                        );
                        (p as ProfileWithAgeAndDistance).distance = distance;
                     }
                }
                
                return true;
            });
        
        if (isGlobalMode) {
          fetchedProfiles.sort((a, b) => ((a as ProfileWithAgeAndDistance).distance || Infinity) - ((b as ProfileWithAgeAndDistance).distance || Infinity));
        } else {
          fetchedProfiles.sort(() => Math.random() - 0.5); // Shuffle for non-global mode
        }
        
        setProfiles(fetchedProfiles);

    } catch (error) {
        console.error("Error fetching profiles for discovery:", error);
        toast({
          title: langTr.common.error,
          description: "Profiller getirilemedi.",
          variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
  }, [user, firestore, userProfile, toast]);


  useEffect(() => {
    if(userProfile){
      fetchProfiles();
    }
  }, [fetchProfiles, userProfile]);


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
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 bg-gradient-to-t from-black/80 to-transparent text-white space-y-2">
                <h3 className="text-3xl font-bold">{profile.fullName}{profile.age && `, ${profile.age}`}</h3>
                {profile.distance !== undefined && (
                    <div className="flex items-center gap-2 text-base">
                        <MapPin className="w-4 h-4" />
                        <span>{langTr.anasayfa.distance.replace('{distance}', String(profile.distance))}</span>
                    </div>
                )}
                {profile.bio && <p className="text-base pt-2">{profile.bio}</p>}
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
