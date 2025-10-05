
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Heart, Loader2, MessageSquare } from 'lucide-react';
import { langTr } from '@/languages/tr';
import { type LikerInfo, type UserProfile } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface MatchData {
  id: string;
  matchedWith: string;
  lastMessage: string;
  timestamp: any;
  fullName: string;
  profilePicture: string;
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


export default function BegenilerPage() {
  const t = langTr;
  const { user } = useUser();
  const firestore = useFirestore();
  const [likers, setLikers] = useState<LikerInfo[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    };

    const fetchLikers = async () => {
      setIsLoading(true);
      
      const likesQuery1 = query(
        collection(firestore, 'matches'),
        where('user2Id', '==', user.uid),
        where('user1_action', '==', 'liked')
      );
      
      const likesQuery2 = query(
        collection(firestore, 'matches'),
        where('user1Id', '==', user.uid),
        where('user2_action', '==', 'liked')
      );
      
      const [query1Snapshot, query2Snapshot] = await Promise.all([
          getDocs(likesQuery1),
          getDocs(likesQuery2)
      ]);

      const potentialLikers: { likerId: string, actionField: 'user1_action' | 'user2_action', matchId: string }[] = [];

      query1Snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (!data.user2_action) {
              potentialLikers.push({ likerId: data.user1Id, actionField: 'user2_action', matchId: docSnap.id });
          }
      });

      query2Snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (!data.user1_action) {
              potentialLikers.push({ likerId: data.user2Id, actionField: 'user1_action', matchId: docSnap.id });
          }
      });


      if (potentialLikers.length === 0) {
          setLikers([]);
          return;
      }

      const likerIds = [...new Set(potentialLikers.map(p => p.likerId))];
      
      const profilePromises = likerIds.map(async (uid) => {
          const userDocRef = doc(firestore, 'users', uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
              const profileData = userDocSnap.data();
              const matchInfo = potentialLikers.find(p => p.likerId === uid);
              return {
                  uid: uid,
                  fullName: profileData.fullName || 'BeMatch User',
                  profilePicture: profileData.images?.[0] || '',
                  age: calculateAge(profileData.dateOfBirth),
                  matchId: matchInfo?.matchId || '',
              };
          }
          return null;
      });

      const likerProfiles = (await Promise.all(profilePromises)).filter((p): p is LikerInfo => p !== null && !!p.profilePicture);

      setLikers(likerProfiles);
    };

    const matchesQuery = query(
      collection(firestore, `users/${user.uid}/matches`),
      orderBy('timestamp', 'desc')
    );
    
    const unsubMatches = onSnapshot(matchesQuery, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => doc.data() as MatchData);
      setMatches(matchesData);
    }, (error) => {
        console.error("Error fetching matches:", error);
    });

    fetchLikers().finally(() => setIsLoading(false));

    return () => {
      unsubMatches();
    };

  }, [user, firestore]);

  const hasNoContent = likers.length === 0 && matches.length === 0;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
       <div className="flex items-center gap-2 mb-6 p-4">
         <h1 className="text-3xl font-bold tracking-tight">{t.begeniler.title}</h1>
         {likers.length > 0 && (
            <span className="flex items-center justify-center h-7 w-7 bg-primary text-primary-foreground rounded-full text-sm font-bold">
              {likers.length}
            </span>
         )}
       </div>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : hasNoContent ? (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-20 flex flex-col items-center justify-center h-full text-muted-foreground">
                <Heart className="h-16 w-16 mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">{t.begeniler.noLikesTitle}</h2>
                <p>{t.begeniler.noLikesDescription}</p>
            </div>
        </div>
      ) : (
        <>
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
                          <div className='h-full overflow-y-auto px-4'>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {likers.map(liker => (
                                    <Card key={liker.uid} className="overflow-hidden rounded-lg shadow-lg relative aspect-[3/4] cursor-pointer hover:opacity-90 transition-opacity">
                                        <Image 
                                            src={liker.profilePicture} 
                                            alt={liker.fullName}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            style={{ objectFit: 'cover' }}
                                            className="pointer-events-none"
                                        />
                                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                         <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                                            <p className="font-bold truncate">{liker.fullName}{liker.age ? `, ${liker.age}`: ''}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                         </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </>
      )}
    </div>
  );
}
