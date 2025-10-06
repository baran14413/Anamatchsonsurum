
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Heart, MessageSquare } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Icons } from '@/components/icons';

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection(usersCollectionRef);

  const matchesCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'matches') : null),
    [firestore]
  );
  const { data: matches, isLoading: isLoadingMatches } = useCollection(matchesCollectionRef);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Genel Bakış</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Kullanıcı
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingUsers ? <Icons.logo className="h-6 w-6 animate-pulse" /> : users?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Sistemdeki toplam kayıtlı kullanıcı sayısı.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Eşleşme
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {isLoadingMatches ? <Icons.logo className="h-6 w-6 animate-pulse" /> : matches?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Gerçekleşen toplam eşleşme sayısı.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Sohbetler</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMatches ? <Icons.logo className="h-6 w-6 animate-pulse" /> : matches?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Devam eden sohbetlerin sayısı.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
