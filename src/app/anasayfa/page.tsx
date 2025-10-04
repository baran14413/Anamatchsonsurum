'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo, X, Star, Heart, Send } from 'lucide-react';
import { langTr } from '@/languages/tr';
import { mockProfiles } from '@/lib/data';
import ProfileCard from '@/components/profile-card';

export default function AnasayfaPage() {
  const t = langTr;
  const [profiles, setProfiles] = useState(mockProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = (direction: 'left' | 'right') => {
    // Here you would typically record the swipe to your backend
    console.log(`Swiped ${direction} on ${profiles[currentIndex].fullName}`);
    
    // Move to the next profile
    setCurrentIndex(prevIndex => prevIndex + 1);
  };

  const currentProfile = profiles[currentIndex];

  return (
    <div className="flex-1 flex flex-col bg-gray-100 dark:bg-black overflow-hidden">
        <AnimatePresence>
            {currentProfile ? (
                 <ProfileCard
                    key={currentProfile.id}
                    profile={currentProfile}
                    onSwipe={handleSwipe}
                />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <h2 className="text-2xl font-bold">{t.anasayfa.outOfProfilesTitle}</h2>
                    <p className="text-muted-foreground mt-2">{t.anasayfa.outOfProfilesDescription}</p>
                </div>
            )}
        </AnimatePresence>
        
        <div className="absolute bottom-4 left-0 right-0 px-4 z-20">
            <div className="flex justify-around items-center h-20 max-w-md mx-auto">
                <button className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-yellow-500 hover:bg-gray-100 transition-transform transform hover:scale-110">
                    <Undo size={24} />
                </button>
                 <button 
                    onClick={() => handleSwipe('left')}
                    className="h-14 w-14 rounded-full bg-white shadow-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-transform transform hover:scale-110">
                    <X size={36} />
                </button>
                <button className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-transform transform hover:scale-110">
                    <Star size={24} />
                </button>
                <button
                    onClick={() => handleSwipe('right')}
                    className="h-14 w-14 rounded-full bg-white shadow-lg flex items-center justify-center text-green-500 hover:bg-green-50 transition-transform transform hover:scale-110">
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
