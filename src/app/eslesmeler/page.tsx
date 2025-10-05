'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Loader2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface MatchData {
  id: string;
  matchedWith: string;
  lastMessage: string;
  timestamp: any;
  fullName: string;
  profilePicture: string;
}

export default function EslesmelerPage() {
  const t = langTr.eslesmeler;
  const { user } = useUser();
  const firestore = useFirestore();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    const matchesQuery = query(
      collection(firestore, `users/${user.uid}/matches`),
      orderBy('timestamp', 'desc')
    );
    
    const unsubMatches = onSnapshot(matchesQuery, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => doc.data() as MatchData);
      setMatches(matchesData);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching matches:", error);
        setIsLoading(false);
    });

    return () => {
      unsubMatches();
    };

  }, [user, firestore]);

  const filteredMatches = useMemo(() => {
    if (!searchTerm) {
      return matches;
    }
    return matches.filter(match =>
        match.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matches, searchTerm]);

  if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
        {matches.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">{t.noChatsTitle}</h2>
                <p>{t.noChatsDescription}</p>
            </div>
        ) : (
            <>
                <div className="p-4 border-b shrink-0 bg-background">
                    <h1 className="text-xl font-bold text-center">{t.title}</h1>
                </div>

                <div className="p-4 border-b shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Sohbetlerde Ara" className="pl-10 bg-background" onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                
                <div className='flex-1 overflow-y-auto'>
                    {filteredMatches.length > 0 ? (
                        <div className="divide-y">
                            {filteredMatches.map(match => (
                                <Link href={`/eslesmeler/${match.id}`} key={match.id}>
                                    <div className="flex items-center p-4 hover:bg-muted/50 cursor-pointer">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={match.profilePicture} />
                                            <AvatarFallback>{match.fullName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="ml-4 flex-1">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-semibold">{match.fullName}</h3>
                                                {match.timestamp && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(match.timestamp.toDate(), { addSuffix: true, locale: tr })}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">{match.lastMessage}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                     ) : (
                        <div className="text-center p-8 text-muted-foreground">
                            <p>Aramanızla eşleşen sohbet bulunamadı.</p>
                        </div>
                    )}
                </div>
            </>
        )}
    </div>
  );
}
