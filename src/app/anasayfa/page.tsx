
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { AnimatePresence, motion } from 'framer-motion';
import ProfileCard from '@/components/profile-card';

const CARD_STACK_OFFSET = 10;
const CARD_STACK_SCALE = 0.05;

export default function AnasayfaPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    if (!user || !firestore) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, limit(50));
      const usersSnapshot = await getDocs(q);

      const interactedUsersSnap = await getDocs(collection(firestore, `users/${user.uid}/matches`));
      const interactedUids = new Set(interactedUsersSnap.docs.map(doc => doc.id));

      const fetchedProfiles = usersSnapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as UserProfile))
        .filter(p => {
          // Rule 1: Cannot be the current user
          if (p.uid === user.uid) return false;
          // Rule 2: Cannot be someone the user has already matched with
          if (interactedUids.has(p.uid)) return false;
          return true;
        });

      setProfiles(fetchedProfiles);

    } catch (error: any) {
      console.error("Profil getirme hatası:", error);
      toast({ title: "Hata", description: `Profiller getirilemedi: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, firestore, toast]);

  useEffect(() => {
    if (user && firestore) {
      fetchProfiles();
    } else if (!user) {
        setIsLoading(false);
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
    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="relative w-full h-[600px] max-w-md flex items-center justify-center">
            <AnimatePresence>
                {profiles.length > 0 ? (
                    profiles.map((profile, index) => (
                        <motion.div
                            key={profile.uid}
                            className="absolute w-full h-full"
                            style={{
                                transformStyle: 'preserve-3d',
                                zIndex: profiles.length - index,
                            }}
                            initial={{
                                scale: 1 - (profiles.length - 1 - index) * CARD_STACK_SCALE,
                                y: (profiles.length - 1 - index) * CARD_STACK_OFFSET,
                                opacity: index === profiles.length - 1 ? 1 : 0.5,
                            }}
                            animate={{
                                scale: 1 - (profiles.length - 1 - index) * CARD_STACK_SCALE,
                                y: (profiles.length - 1 - index) * CARD_STACK_OFFSET,
                                opacity: 1,
                            }}
                             transition={{ duration: 0.3 }}
                        >
                            <ProfileCard profile={profile} isTopCard={index === profiles.length - 1} />
                        </motion.div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4 space-y-4">
                        <h3 className="text-2xl font-bold">Hiç Profil Bulunamadı</h3>
                        <p className="text-muted-foreground">Veritabanında görüntülenecek hiç kullanıcı yok gibi görünüyor.</p>
                        <Button onClick={fetchProfiles}>
                            Tekrar Dene
                        </Button>
                    </div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}
