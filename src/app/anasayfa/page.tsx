'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Undo, X, Star, Heart, Send, Loader2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import ProfileCard from '@/components/profile-card';
import type { UserProfile } from '@/lib/types';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function AnasayfaPage() {
  const t = langTr;
  const { user } = useUser();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      if (!user) return;

      setIsLoading(true);
      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/get-potential-matches', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profiles');
        }

        const data = await response.json();
        setProfiles(data);

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
    }

    fetchProfiles();
  }, [user, toast, t.common.error]);

  const recordSwipe = async (swipedProfile: UserProfile, direction: 'left' | 'right') => {
    if (!user || !swipedProfile.uid) return;

    try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/record-swipe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                swipedUserId: swipedProfile.uid,
                direction: direction,
            }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to record swipe');
        }

        const result = await response.json();
        if (result.match) {
            toast({
                title: t.anasayfa.matchToastTitle,
                description: t.anasayfa.matchToastDescription
            });
        }

    } catch (error) {
        console.error('Error recording swipe:', error);
         toast({
            title: t.common.error,
            description: "Kaydırma işlemi kaydedilemedi.",
            variant: "destructive"
        });
    }
  };
  
  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentIndex < profiles.length) {
      const swipedProfile = profiles[currentIndex];
      recordSwipe(swipedProfile, direction);
      
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  };

  const currentProfile = !isLoading && currentIndex < profiles.length ? profiles[currentIndex] : null;

  return (
    <div className="flex-1 flex flex-col bg-gray-100 dark:bg-black overflow-hidden">
        <div className="relative flex-1">
            <AnimatePresence>
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : currentProfile ? (
                    <ProfileCard
                        key={currentProfile.id}
                        profile={currentProfile}
                        onSwipe={handleSwipe}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                        <h2 className="text-2xl font-bold">{t.anasayfa.outOfProfilesTitle}</h2>
                        <p className="text-muted-foreground mt-2">{t.anasayfa.outOfProfilesDescription}</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
        
        <div className="px-4 z-20 shrink-0">
            <div className="flex justify-around items-center h-20 max-w-md mx-auto">
                <button className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-yellow-500 hover:bg-gray-100 transition-transform transform hover:scale-110">
                    <Undo size={24} />
                </button>
                 <button 
                    onClick={() => handleSwipe('left')}
                    className="h-14 w-14 rounded-full bg-white shadow-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-transform transform hover:scale-110 disabled:opacity-50"
                    disabled={!currentProfile}>
                    <X size={36} />
                </button>
                <button className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-transform transform hover:scale-110">
                    <Star size={24} />
                </button>
                <button
                    onClick={() => handleSwipe('right')}
                    className="h-14 w-14 rounded-full bg-white shadow-lg flex items-center justify-center text-green-500 hover:bg-green-50 transition-transform transform hover:scale-110 disabled:opacity-50"
                    disabled={!currentProfile}>
                    <Heart size={32} />
                </button>
                 <button className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-sky-500 hover:bg-sky-50 transition-transform transform hover:scale-110">
                    <Send size={24} />
                </button>
            </div>
        </div>
    </div>
  );
}
