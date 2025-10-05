
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RotateCcw, X, Heart, Star, Zap, Undo2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import type { UserProfile } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs } from 'firebase/firestore';
import ProfileCard from '@/components/profile-card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function AnasayfaPage() {
  const t = langTr;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchProfiles = useCallback(async () => {
    if (!user || !firestore) return;
    setIsLoading(true);
    try {
      const usersQuery = query(collection(firestore, 'users'));
      const querySnapshot = await getDocs(usersQuery);
      const allUsers = querySnapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as UserProfile))
        .filter(p => p.uid !== user.uid && p.images && p.images.length > 0);
      
      setProfiles(allUsers);
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
  }, [user, firestore, toast, t.common.error]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleAction = (action: 'liked' | 'disliked' | 'superlike' | 'undo' | 'boost') => {
    if (currentIndex >= profiles.length) return;

    const swipedProfile = profiles[currentIndex];
    
    // For now, just log and move to the next profile for all actions except undo
    console.log(`User ${user?.uid} action: ${action} on profile ${swipedProfile.uid}`);
    
    if (action === 'undo') {
        setCurrentIndex(prev => Math.max(0, prev - 1));
    } else {
        setCurrentIndex(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setIsLoading(true);
    fetchProfiles().then(() => {
        setCurrentIndex(0);
        toast({
            title: t.anasayfa.resetToastTitle,
            description: t.anasayfa.resetToastDescription,
        });
    });
  };
  
  const activeProfile = !isLoading && currentIndex < profiles.length ? profiles[currentIndex] : null;

  return (
    <div className="relative h-full w-full flex flex-col">
        {isLoading ? (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : activeProfile ? (
          <>
            <div className="flex-1 relative flex items-center justify-center p-2">
                 <div className="w-full h-full relative">
                    <ProfileCard
                        key={activeProfile.uid}
                        profile={activeProfile}
                    />
                 </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-evenly items-center py-4 px-2">
                <motion.button whileHover={{ scale: 1.1 }} className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center" onClick={() => handleAction('undo')}>
                    <Undo2 className="h-6 w-6 text-yellow-500" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} className="h-16 w-16 rounded-full bg-white shadow-lg flex items-center justify-center" onClick={() => handleAction('disliked')}>
                    <X className="h-8 w-8 text-red-500" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center" onClick={() => handleAction('superlike')}>
                    <Star className="h-6 w-6 text-blue-400" fill="currentColor" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} className="h-16 w-16 rounded-full bg-white shadow-lg flex items-center justify-center" onClick={() => handleAction('liked')}>
                    <Heart className="h-8 w-8 text-green-400" fill="currentColor" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center" onClick={() => handleAction('boost')}>
                    <Zap className="h-6 w-6 text-purple-500" />
                </motion.button>
            </div>
          </>
        ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <h2 className="text-2xl font-bold">{t.anasayfa.outOfProfilesTitle}</h2>
            <p className="text-muted-foreground mt-2">{t.anasayfa.outOfProfilesDescription}</p>
            <Button onClick={handleReset} className="mt-6 rounded-full" size="lg">
                <RotateCcw className="mr-2 h-5 w-5" />
                Yeniden Başla
            </Button>
            </div>
        )}
    </div>
  );
}
