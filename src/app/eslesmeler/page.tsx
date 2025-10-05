'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Loader2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import Link from 'next/link';
import type { UserProfile } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    };
  },
};

export default function EslesmelerPage() {
  const t = langTr.eslesmeler;
  const { user } = useUser();
  const firestore = useFirestore();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [likers, setLikers] = useState<LikerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [[activeTab, direction], setActiveTab] = useState<['likes' | 'matches', number]>(['likes', 0]);

  const paginate = (newDirection: number) => {
      if (activeTab === 'likes' && newDirection > 0) {
          setActiveTab(['matches', newDirection]);
      } else if (activeTab === 'matches' && newDirection < 0) {
          setActiveTab(['likes', newDirection]);
      }
  }

  const setTab = (tab: 'likes' | 'matches') => {
      const newDirection = tab === 'matches' ? 1 : -1;
      setActiveTab([tab, newDirection]);
  }

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    // Listener for people who liked the current user (but are not matched yet)
    const likesQuery1 = query(collection(firestore, 'matches'));

    const unsubLikes = onSnapshot(likesQuery1, async (snapshot) => {
        const potentialLikerTasks: Promise<LikerData | null>[] = [];
        const seenLikerIds = new Set<string>();

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            let likerId: string | null = null;
            
            if (data.user2Id === user.uid && data.user1_action === 'liked' && !data.user2_action) {
                likerId = data.user1Id;
            }
            else if (data.user1Id === user.uid && data.user2_action === 'liked' && !data.user1_action) {
                likerId = data.user2Id;
            }

            if (likerId && !seenLikerIds.has(likerId)) {
                seenLikerIds.add(likerId);
                const task = async () => {
                    const userDocSnap = await getDoc(doc(firestore, 'users', likerId!));
                    if (userDocSnap.exists()) {
                        const profileData = userDocSnap.data() as UserProfile;
                        return {
                            uid: likerId!,
                            fullName: profileData.fullName || 'BeMatch User',
                            profilePicture: profileData.images?.[0] || '',
                            age: calculateAge(profileData.dateOfBirth),
                        };
                    }
                    return null;
                };
                potentialLikerTasks.push(task());
            }
        });
        
        const likerProfiles = (await Promise.all(potentialLikerTasks)).filter((p): p is LikerData => p !== null && !!p.profilePicture);
        setLikers(likerProfiles);
    });

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
      unsubLikes();
      unsubMatches();
    };

  }, [user, firestore]);

  const filteredMatches = useMemo(() => {
    return matches.filter(match =>
        match.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matches, searchTerm]);

  const hasNoContent = likers.length === 0 && matches.length === 0;

  if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
        {hasNoContent ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">{t.noChatsTitle}</h2>
                <p>{t.noChatsDescription}</p>
            </div>
        ) : (
            <>
                {/* Tab Header */}
                <div className="p-4 border-b flex items-center justify-center space-x-8 shrink-0">
                   <button 
                        onClick={() => setTab('likes')}
                        className={cn(
                            "text-lg font-bold pb-2 border-b-2 transition-colors",
                            activeTab === 'likes' 
                                ? 'text-primary border-primary' 
                                : 'text-muted-foreground border-transparent hover:text-foreground'
                        )}
                   >
                        Seni Beğenenler
                        {likers.length > 0 && <span className="ml-2 bg-primary text-primary-foreground text-xs font-bold rounded-full px-2 py-1">{likers.length}</span>}
                   </button>
                    <button 
                        onClick={() => setTab('matches')}
                        className={cn(
                            "text-lg font-bold pb-2 border-b-2 transition-colors",
                            activeTab === 'matches' 
                                ? 'text-primary border-primary' 
                                : 'text-muted-foreground border-transparent hover:text-foreground'
                        )}
                   >
                       Eşleşmelerim
                   </button>
                </div>
                
                {/* Search Bar (only for matches) */}
                {activeTab === 'matches' && (
                    <div className="p-4 border-b shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Sohbetlerde Ara" className="pl-10 bg-background" onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                )}
                
                <div className='flex-1 relative overflow-hidden'>
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={activeTab}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={1}
                            onDragEnd={(e, { offset, velocity }) => {
                                const power = swipePower(offset.x, velocity.x);
                                if (power < -swipeConfidenceThreshold) {
                                    paginate(1);
                                } else if (power > swipeConfidenceThreshold) {
                                    paginate(-1);
                                }
                            }}
                             className="absolute top-0 left-0 w-full h-full"
                        >
                             <div className='h-full overflow-y-auto'>
                                {activeTab === 'likes' && (
                                    likers.length > 0 ? (
                                    <div className="p-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {likers.map(liker => (
                                                <Link href={`/profil/${liker.uid}`} key={liker.uid}>
                                                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md group cursor-pointer">
                                                        <Avatar className="h-full w-full rounded-lg">
                                                            <AvatarImage src={liker.profilePicture} className="object-cover"/>
                                                            <AvatarFallback>{liker.fullName.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                                        <div className="absolute bottom-0 left-0 p-2 text-white">
                                                            <p className="font-bold text-sm truncate">{liker.fullName}{liker.age ? `, ${liker.age}` : ''}</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground h-full">
                                            <h2 className="text-xl font-semibold text-foreground mb-2">Henüz Seni Beğenen Yok</h2>
                                            <p>Biri seni beğendiğinde burada göreceksin.</p>
                                        </div>
                                    )
                                )}

                                {activeTab === 'matches' && (
                                    matches.length > 0 ? (
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
                                        <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground h-full">
                                            <h2 className="text-xl font-semibold text-foreground mb-2">Henüz Eşleşmen Yok</h2>
                                            <p>Biriyle eşleştiğinde sohbetlerin burada görünecek.</p>
                                        </div>
                                    )
                                )}
                             </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </>
        )}
    </div>
  );
}
