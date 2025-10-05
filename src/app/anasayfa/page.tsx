
'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

function calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) return null;
    const birthday = new Date(dateOfBirth);
    if (isNaN(birthday.getTime())) return null;
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}


export default function AnasayfaPage() {
  const t = langTr;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      if (!user || !firestore) return;

      setIsLoading(true);
      try {
        // 1. Get IDs of users the current user has already interacted with.
        const interactionsQuery1 = query(collection(firestore, 'matches'), where('user1Id', '==', user.uid));
        const interactionsQuery2 = query(collection(firestore, 'matches'), where('user2Id', '==', user.uid));
        
        const [interactionsSnapshot1, interactionsSnapshot2] = await Promise.all([
          getDocs(interactionsQuery1),
          getDocs(interactionsQuery2)
        ]);

        const interactedUserIds = new Set<string>();
        interactionsSnapshot1.forEach(doc => {
            interactedUserIds.add(doc.data().user2Id);
        });
        interactionsSnapshot2.forEach(doc => {
            interactedUserIds.add(doc.data().user1Id);
        });

        // 2. Fetch all users from the 'users' collection.
        const allUsersSnapshot = await getDocs(collection(firestore, 'users'));

        // 3. Filter out the current user and users who have been interacted with.
        const potentialMatches: UserProfile[] = [];
        allUsersSnapshot.forEach(doc => {
            const userData = doc.data() as Omit<UserProfile, 'id'>;
            // Ensure the user is not the current user and has not been interacted with
            // and has a valid UID and images array.
            if (userData.uid && userData.uid !== user.uid && !interactedUserIds.has(userData.uid)) {
                potentialMatches.push({
                    id: doc.id,
                    ...userData,
                    images: userData.images || [], // Ensure images is always an array
                } as UserProfile);
            }
        });
        
        setProfiles(potentialMatches);

      } catch (error) {
        console.error("Error fetching profiles:", error);
        toast({
            title: t.common.error,
            description: "Potansiyel eşleşmeler getirilemedi.",
            variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    if (user && firestore) {
      fetchProfiles();
    }
  }, [user, firestore, toast, t.common.error]);

  return (
    <div className="flex-1 flex flex-col bg-gray-100 dark:bg-black overflow-y-auto">
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : profiles.length > 0 ? (
        <div className="p-4 space-y-4">
          <h1 className="text-2xl font-bold">Potansiyel Eşleşmeler ({profiles.length})</h1>
          {profiles.map(profile => {
            const age = calculateAge(profile.dateOfBirth);
            return (
              <Card key={profile.id}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile.profilePicture || profile.images[0]} alt={profile.fullName} />
                      <AvatarFallback>{profile.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{profile.fullName}{age ? `, ${age}` : ''}</CardTitle>
                      <CardDescription>{profile.interests?.join(', ')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <h2 className="text-2xl font-bold">{t.anasayfa.outOfProfilesTitle}</h2>
          <p className="text-muted-foreground mt-2">{t.anasayfa.outOfProfilesDescription}</p>
        </div>
      )}
    </div>
  );
}
