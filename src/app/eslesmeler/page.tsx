'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Loader2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import Link from 'next/link';
import type { UserProfile } from '@/lib/types';
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

interface LikerData {
    uid: string;
    fullName: string;
    profilePicture: string;
    age: number | null;
}

function calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) return null;
    const birthday = new Date(dateOfBirth);
    if (isNaN(birthday.getTime())) return null;
    const ageDate = new Date(Date.now() - birthday.getTime());
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}


export default function EslesmelerPage() {
  const t = langTr.eslesmeler;
  const { user } = useUser();
  const firestore = useFirestore();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [likers, setLikers] = useState<LikerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(false);
      return;
    }

    // Listener for people who liked the current user
    const likesQuery1 = query(collection(firestore, 'matches'), where('user2Id', '==', user.uid), where('user1_action', '==', 'liked'));
    const likesQuery2 = query(collection(firestore, 'matches'), where('user1Id', '==', user.uid), where('user2_action', '==', 'liked'));

    const fetchLikerProfiles = (snapshots: any[]) => {
        const potentialLikerIds: string[] = [];
        snapshots.forEach(snapshot => {
            snapshot.forEach((docSnap: any) => {
                 const data = docSnap.data();
                 if (data.user1Id === user.uid && !data.user1_action && data.user2_action === 'liked') {
                     potentialLikerIds.push(data.user2Id);
                 } else if (data.user2Id === user.uid && !data.user2_action && data.user1_action === 'liked') {
                     potentialLikerIds.push(data.user1Id);
                 }
            });
        });
        
        const uniqueLikerIds = [...new Set(potentialLikerIds)];

        if (uniqueLikerIds.length > 0) {
            const profilePromises = uniqueLikerIds.map(async (uid) => {
                const userDocSnap = await getDoc(doc(firestore, 'users', uid));
                if (userDocSnap.exists()) {
                    const profileData = userDocSnap.data() as UserProfile;
                    return {
                        uid: uid,
                        fullName: profileData.fullName || 'BeMatch User',
                        profilePicture: profileData.images?.[0] || '',
                        age: calculateAge(profileData.dateOfBirth),
                    };
                }
                return null;
            });

            Promise.all(profilePromises).then(likerProfiles => {
                setLikers(likerProfiles.filter((p): p is LikerData => p !== null && !!p.profilePicture));
            });
        } else {
            setLikers([]);
        }
    };
    
    const unsub1 = onSnapshot(likesQuery1, () => {});
    const unsub2 = onSnapshot(likesQuery2, () => {});

    const combinedUnsub = onSnapshot(query(collection(firestore, 'matches')), (snapshot) => {
        fetchLikerProfiles([snapshot]); // Re-fetch on any change in matches
    });


    // Listener for mutual matches (chats)
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
      unsub1();
      unsub2();
      combinedUnsub();
      unsubMatches();
    };

  }, [user, firestore]);

  const filteredMatches = matches.filter(match =>
    match.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
      {(matches.length === 0 && likers.length === 0) ? (
         <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">{t.noChatsTitle}</h2>
            <p>{t.noChatsDescription}</p>
        </div>
      ) : (
        <>
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Sohbetlerde Ara" className="pl-10 bg-background" onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* New Matches Carousel */}
            {likers.length > 0 && (
                <div className="p-4 border-b">
                    <h2 className="text-sm font-semibold text-muted-foreground mb-2">Yeni Eşleşmeler</h2>
                    <div className="flex space-x-4 overflow-x-auto pb-2 -mb-2">
                        {likers.map(liker => (
                            <Link href={`/profil/${liker.uid}`} key={liker.uid} className="flex-shrink-0">
                                <div className="flex flex-col items-center space-y-1 w-20">
                                    <Avatar className="h-16 w-16 border-2 border-pink-500">
                                        <AvatarImage src={liker.profilePicture} />
                                        <AvatarFallback>{liker.fullName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium truncate">{liker.fullName}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto">
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
            </div>
        </>
      )}
    </div>
  );
}
