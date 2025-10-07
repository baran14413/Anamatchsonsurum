'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Heart, MessageSquare, Bot } from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import { useMemo } from 'react';
import type { UserProfile } from '@/lib/types';

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  const allUsersCollectionRef = useMemo(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection<UserProfile>(allUsersCollectionRef);

  const { realUsers, bots } = useMemo(() => {
    if (!allUsers) return { realUsers: [], bots: [] };
    const realUsers = allUsers.filter(user => user.isBot !== true);
    const bots = allUsers.filter(user => user.isBot === true);
    return { realUsers, bots };
  }, [allUsers]);

  const matchesCollectionRef = useMemo(
    () => (firestore ? query(collection(firestore, 'matches'), where('status', '==', 'matched')) : null),
    [firestore]
  );
  const { data: matches, isLoading: isLoadingMatches } = useCollection(matchesCollectionRef);

  const messagesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'system_messages'));
    }, [firestore]);
    const { data: systemMessages, isLoading: isLoadingMessages } = useCollection(messagesQuery);


  return (
        <div className="space-y-6">
        <h1 className="text-2xl font-bold">Genel Bakış</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Toplam Kullanıcı
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                {isLoadingUsers ? <Icons.logo className="h-6 w-6 animate-pulse" /> : realUsers?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                Sistemdeki toplam gerçek kullanıcı sayısı.
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Toplam Bot
                </CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                {isLoadingUsers ? <Icons.logo className="h-6 w-6 animate-pulse" /> : bots?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                Sistemdeki toplam bot kullanıcı sayısı.
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
                <CardTitle className="text-sm font-medium">Sistem Mesajları</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                {isLoadingMessages ? <Icons.logo className="h-6 w-6 animate-pulse" /> : systemMessages?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                Gönderilen toplam sistem mesajı.
                </p>
            </CardContent>
            </Card>
        </div>
        </div>
  );
}
