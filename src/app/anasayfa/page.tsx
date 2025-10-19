
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Undo2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, doc, getDoc } from 'firebase/firestore';
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
      // 1. Get UIDs of already matched users
      const matchesQuery = query(
        collection(firestore, `users/${user.uid}/matches`),
        where('status', '==', 'matched')
      );
      const matchesSnap = await getDocs(matchesQuery);
      const matchedUids = new Set(matchesSnap.docs.map(d => d.data().matchedWith));
      matchedUids.add(user.uid);

      // 2. Base query to get potential users
      const usersRef = collection(firestore, 'users');
      let q = query(usersRef);
      
      const genderPref = userProfile.genderPreference;
      if (genderPref && genderPref !== 'both') {
          q = query(q, where('gender', '==', genderPref));
      }
      
      const usersSnapshot = await getDocs(q);

      const allFetchedUsers = usersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile));
      
      const potentialProfiles = allFetchedUsers.filter(p => {
          if (!p.uid || matchedUids.has(p.uid)) {
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

      const profilesWithDistance = potentialProfiles.map(p => {
          let distance: number | undefined = undefined;
          if (userProfile.location?.latitude && userProfile.location?.longitude && p.location?.latitude && p.location?.longitude) {
              distance = getDistance(userProfile.location.latitude, userProfile.location.longitude, p.location.latitude, p.location.longitude);
          }
          return { ...p, distance };
      });
      
      const finalProfiles = profilesWithDistance
        .sort(() => Math.random() - 0.5) // Shuffle
        .slice(0, 20);

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
                        <CardTitle>{profile.fullName}</CardTitle>
                        <CardDescription>UID: {profile.uid}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Doğum Tarihi: {profile.dateOfBirth}</p>
                        <p>Cinsiyet: {profile.gender}</p>
                        <p>Mesafe: {profile.distance !== undefined ? `${profile.distance} km` : 'Hesaplanamadı'}</p>
                        <p>Konum: {profile.location ? `${profile.location.latitude}, ${profile.location.longitude}` : 'Bilinmiyor'}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-4 space-y-4">
          <h3 className="text-2xl font-bold">{t.anasayfa.outOfProfilesTitle}</h3>
          <p className="text-muted-foreground">{t.anasayfa.outOfProfilesDescription}</p>
          <Button onClick={fetchProfiles}>
            <Undo2 className="mr-2 h-4 w-4" />
            Tekrar Dene
          </Button>
        </div>
      )}
    </div>
  );
}
