
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, where, limit, doc, getDoc, collectionGroup, QueryConstraint, orderBy } from 'firebase/firestore';
import { getDistance } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import ProfileCard from '@/components/profile-card';

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
    setProfiles([]);

    try {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, limit(50));
        const usersSnapshot = await getDocs(q);
        
        const matchesSnap = await getDocs(collection(firestore, `users/${user.uid}/matches`));
        const interactedUids = new Set(matchesSnap.docs.map(d => d.id));

        const allFetchedUsers = usersSnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
            .filter(p => {
                if (p.uid === user.uid) return false;
                if (interactedUids.has(p.id)) return false;
                return true; 
            })
            .map(p => {
                let distance: number | undefined = undefined;
                if (userProfile.location?.latitude && userProfile.location?.longitude && p.location?.latitude && p.location?.longitude) {
                    distance = getDistance(userProfile.location.latitude, userProfile.location.longitude, p.location.latitude, p.location.longitude);
                }
                return { ...p, distance };
            });

        setProfiles(allFetchedUsers);

    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({ title: t.common.error, description: "Profiller getirilemedi.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore, userProfile, toast, t]);


  useEffect(() => {
    if (user && firestore && userProfile) {
      fetchProfiles();
    }
  }, [user, firestore, userProfile, fetchProfiles]);

  const removeTopCard = () => {
    setProfiles(prev => prev.slice(1));
  };


  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center">
          <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
        </div>
      ) : profiles.length > 0 ? (
        <div className="relative w-full h-[600px] max-w-md max-h-[85vh] flex items-center justify-center">
            <AnimatePresence>
                {profiles.map((profile, index) => (
                    <motion.div
                        key={profile.uid}
                        className="absolute w-full h-full"
                        style={{
                            zIndex: profiles.length - index,
                            transform: `scale(${1 - (index * 0.03)}) translateY(${index * 10}px)`,
                        }}
                        initial={{ scale: 0.95, y: 30, opacity: 0 }}
                        animate={{ scale: 1 - (index * 0.03), y: index * 10, opacity: 1 }}
                        exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <ProfileCard profile={profile} isTopCard={index === 0} />
                    </motion.div>
                )).reverse() // Show top of the stack
            }
            </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-4 space-y-4">
          <h3 className="text-2xl font-bold">{t.anasayfa.outOfProfilesTitle}</h3>
          <p className="text-muted-foreground">{t.anasayfa.outOfProfilesDescription}</p>
          <Button onClick={fetchProfiles}>
            Tekrar Dene
          </Button>
        </div>
      )}
    </div>
  );
}
