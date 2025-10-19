
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
    setProfiles([]);

    try {
        // 1. Get UIDs of users we have already matched with.
        const matchesSnap = await getDocs(query(collection(firestore, `users/${user.uid}/matches`), where('status', '==', 'matched')));
        const matchedUids = new Set(matchesSnap.docs.map(d => d.data().matchedWith));

        // 2. Build the simplest possible query: get all users.
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, limit(50));
        const usersSnapshot = await getDocs(q);
        
        const allFetchedUsers = usersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile));

        // 3. Perform ONLY the most essential client-side filtering.
        const finalProfiles = allFetchedUsers.filter(p => {
            // Filter out the current user
            if (p.uid === user.uid) {
                return false;
            }
            // Filter out users already matched with
            if (matchedUids.has(p.uid)) {
                return false;
            }
            return true;
        }).map(p => {
            // Calculate distance but don't filter by it yet
             let distance: number | undefined = undefined;
            if (userProfile.location?.latitude && userProfile.location?.longitude && p.location?.latitude && p.location?.longitude) {
                distance = getDistance(userProfile.location.latitude, userProfile.location.longitude, p.location.latitude, p.location.longitude);
            }
            return { ...p, distance };
        });

        setProfiles(finalProfiles);

    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({ title: t.common.error, description: "Profiller getirilemedi.", variant: "destructive" });
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
