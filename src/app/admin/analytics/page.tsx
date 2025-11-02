
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, Timestamp, collectionGroup } from 'firebase/firestore';
import { useMemo } from 'react';
import type { UserProfile, ChatMessage, DenormalizedMatch } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Icons } from '@/components/icons';
import { endOfToday, startOfToday, subDays, format } from 'date-fns';

const CHART_DAYS = 7;

export default function AdminAnalyticsPage() {
  const firestore = useFirestore();

  const dateRangeQuery = useMemo(() => {
    if (!firestore) return { users: null, messages: null, matches: null };
    
    const endDate = endOfToday();
    const startDate = subDays(endDate, CHART_DAYS);

    const usersQuery = query(
      collection(firestore, 'users'),
      where('createdAt', '>=', startDate)
    );
    const messagesQuery = query(
        collectionGroup(firestore, 'messages'),
        where('timestamp', '>=', startDate)
    );
    const matchesQuery = query(
        collection(firestore, 'matches'),
        where('timestamp', '>=', startDate)
    );

    return { users: usersQuery, messages: messagesQuery, matches: matchesQuery };
  }, [firestore]);

  const { data: recentUsers, isLoading: loadingUsers } = useCollection<UserProfile>(dateRangeQuery.users);
  const { data: recentMessages, isLoading: loadingMessages } = useCollection<ChatMessage>(dateRangeQuery.messages);
  const { data: recentMatches, isLoading: loadingMatches } = useCollection<DenormalizedMatch>(dateRangeQuery.matches);
  
  const chartData = useMemo(() => {
    const data = [];
    for (let i = CHART_DAYS - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const formattedDate = format(date, 'MMM d');
        
        const dailyUsers = recentUsers?.filter(u => u.createdAt && format(u.createdAt.toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
        const dailyMessages = recentMessages?.filter(m => m.timestamp && format(m.timestamp.toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
        const dailyMatches = recentMatches?.filter(m => m.timestamp && format(m.timestamp.toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));

        data.push({
            date: formattedDate,
            "Yeni Kullanıcılar": dailyUsers?.filter(u => !u.isBot).length || 0,
            "Yeni Botlar": dailyUsers?.filter(u => u.isBot).length || 0,
            "Eşleşmeler": dailyMatches?.length || 0,
            "Mesajlar": dailyMessages?.length || 0,
        });
    }
    return data;
  }, [recentUsers, recentMessages, recentMatches]);

  const isLoading = loadingUsers || loadingMessages || loadingMatches;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analizler</h1>
      <Card>
        <CardHeader>
          <CardTitle>Son {CHART_DAYS} Günlük Aktivite</CardTitle>
          <CardDescription>Uygulamadaki kullanıcı aktivitesi ve etkileşim metrikleri.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Icons.logo className="h-12 w-12 animate-pulse" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                    <Bar dataKey="Yeni Kullanıcılar" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Yeni Botlar" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Eşleşmeler" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Mesajlar" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
