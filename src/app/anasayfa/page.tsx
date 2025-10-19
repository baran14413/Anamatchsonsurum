'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, limit, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getDistance } from '@/lib/utils';

type ProfileWithDistance = UserProfile & { distance?: number };

export default function AnasayfaPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<ProfileWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    if (!user || !firestore) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setProfiles([]);

    try {
      // 1. En Basit Sorgu: Filtreleme yok, sadece ilk 50 kullanıcıyı al.
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, limit(50));
      const usersSnapshot = await getDocs(q);

      // 2. Sadece kullanıcının kendisini listeden çıkar. Başka hiçbir filtre yok.
      const allFetchedUsers = usersSnapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
        .filter(p => p.uid !== user.uid)
        .map(p => {
            // Mesafe hesaplamasını koruyalım ama filtreleme için kullanmayalım.
            let distance: number | undefined = undefined;
            if (userProfile?.location?.latitude && userProfile?.location?.longitude && p.location?.latitude && p.location?.longitude) {
                distance = getDistance(userProfile.location.latitude, userProfile.location.longitude, p.location.latitude, p.location.longitude);
            }
            return { ...p, distance };
        });

      setProfiles(allFetchedUsers);

    } catch (error: any) {
      console.error("Profil getirme hatası:", error);
      toast({ title: "Hata", description: `Profiller getirilemedi: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore, userProfile, toast]);

  useEffect(() => {
    if (user && firestore) {
      fetchProfiles();
    }
  }, [user, firestore, fetchProfiles]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">Profil Listesi ({profiles.length})</h1>
      {profiles.length > 0 ? (
        <div className="w-full max-w-md space-y-4">
          {profiles.map(profile => (
            <Card key={profile.uid}>
              <CardHeader>
                <CardTitle>{profile.fullName || 'İsimsiz Kullanıcı'}, {profile.dateOfBirth ? new Date(Date.now() - new Date(profile.dateOfBirth).getTime()).getUTCFullYear() - 1970 : 'Yaş Yok'}</CardTitle>
                <CardDescription>
                  UID: {profile.uid} <br/>
                  Cinsiyet: {profile.gender || 'Belirtilmemiş'} <br/>
                  Mesafe: {profile.distance !== undefined ? `${profile.distance} km` : 'Hesaplanamadı'} <br/>
                  Bot mu?: {profile.isBot ? 'Evet' : 'Hayır'}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-4 space-y-4">
          <h3 className="text-2xl font-bold">Hiç Profil Bulunamadı</h3>
          <p className="text-muted-foreground">Veritabanında görüntülenecek hiç kullanıcı yok gibi görünüyor.</p>
          <Button onClick={fetchProfiles}>
            Tekrar Dene
          </Button>
        </div>
      )}
    </div>
  );
}
