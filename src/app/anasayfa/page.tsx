
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, doc, getDoc, collectionGroup, QueryConstraint } from 'firebase/firestore';
import { getDistance } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type ProfileWithDistance = UserProfile & { distance?: number };

export default function AnasayfaPage() {
  const t = langTr;
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<ProfileWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    if (!user || !firestore || !userProfile) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setProfiles([]); // Clear previous profiles before fetching new ones

    try {
        // 1. Get UIDs of users we have already matched with.
        const matchesSnap = await getDocs(query(collection(firestore, `users/${user.uid}/matches`), where('status', '==', 'matched')));
        const matchedUids = new Set(matchesSnap.docs.map(d => d.data().matchedWith));
        matchedUids.add(user.uid);

        // 2. Build the base query to get users who are NOT bots.
        // This is a simple query that doesn't require a composite index.
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('isBot', '!=', true), limit(50));
        const usersSnapshot = await getDocs(q);
        
        const allFetchedUsers = usersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile));

        // 3. Perform client-side filtering for complex logic (gender, age, distance).
        const potentialProfiles = allFetchedUsers.filter(p => {
            if (!p.uid || matchedUids.has(p.uid)) {
                return false;
            }
            
            // Gender preference filter (now done on the client)
            const genderPref = userProfile.genderPreference;
            if (genderPref && genderPref !== 'both' && p.gender !== genderPref) {
                return false;
            }

            const age = p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : 0;
            const minAge = userProfile.ageRange?.min || 18;
            const maxAge = userProfile.ageRange?.max || 80;

            if (age < minAge || age > maxAge) {
                if (!userProfile.expandAgeRange) return false;
            }
            
            return true;
        });


        // 4. Calculate distance and apply distance filter.
        const profilesWithDistance = potentialProfiles.map(p => {
            let distance: number | undefined = undefined;
            if (userProfile.location?.latitude && userProfile.location?.longitude && p.location?.latitude && p.location?.longitude) {
                distance = getDistance(userProfile.location.latitude, userProfile.location.longitude, p.location.latitude, p.location.longitude);
            }
            return { ...p, distance };
        });

        const finalProfiles = profilesWithDistance
            .filter(p => {
                // If global mode is on, don't filter by distance.
                if (userProfile.globalModeEnabled) {
                    return true;
                }
                // If global mode is off, a distance must be calculated and within preference.
                if (p.distance === undefined) {
                    return false;
                }
                return p.distance <= (userProfile.distancePreference || 160);
            })
            .sort(() => Math.random() - 0.5); // Shuffle the final list

        setProfiles(finalProfiles);

    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({ title: t.common.error, description: "Potansiyel eşleşmeler getirilemedi.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore, userProfile, toast, t]);


  useEffect(() => {
    if (user && firestore && userProfile) {
      fetchProfiles();
    }
  }, [user, firestore, userProfile, fetchProfiles]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      {isLoading ? (
        <div className="flex items-center justify-center">
          <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
        </div>
      ) : profiles.length > 0 ? (
        <div className="w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold text-center">Profil Listesi ({profiles.length})</h2>
            {profiles.map(profile => (
                <Card key={profile.uid}>
                    <CardHeader>
                        <CardTitle>{profile.fullName}, {profile.dateOfBirth ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear() : ''}</CardTitle>
                        <CardDescription>UID: {profile.uid}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Cinsiyet: {profile.gender}</p>
                        <p>Mesafe: {profile.distance !== undefined ? `${profile.distance} km` : 'Hesaplanamadı'}</p>
                        <p>Konum: {profile.location ? `${profile.location.latitude.toFixed(2)}, ${profile.location.longitude.toFixed(2)}` : 'Bilinmiyor'}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-4 space-y-4">
          <h3 className="text-2xl font-bold">{t.anasayfa.outOfProfilesTitle}</h3>
          <p className="text-muted-foreground">{t.anasayfa.outOfProfilesDescription}</p>
          <Button onClick={fetchProfiles}>
            Tekrar Dene
          </Button>
        </div>
      )}
    </div>
  );
}
