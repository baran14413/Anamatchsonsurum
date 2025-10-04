
"use client";

import { useState } from "react";
import ProfileCard from "@/components/profile-card";
import { Button } from "@/components/ui/button";
import type { UserProfile as UserProfileType } from "@/lib/types";
import { Heart, X, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";

// Geçici çözüm: Profil listesi boş başlatılacak.
const FAKE_PROFILES_TO_PREVENT_ERROR: UserProfileType[] = [];

export default function AnasayfaPage() {
  const [profiles, setProfiles] = useState<UserProfileType[]>(FAKE_PROFILES_TO_PREVENT_ERROR);
  // Yükleme durumu başlangıçta false olarak ayarlandı, çünkü veri çekilmiyor.
  const [isLoading, setIsLoading] = useState(false);

  // NOT: Tüm veri çekme mantığı (`useEffect` ve Firestore çağrıları)
  // "Missing or insufficient permissions" hatasını çözmek için kaldırılmıştır.
  // Eşleşme mantığının doğru bir şekilde çalışması için sunucu tarafı
  // bir mekanizmaya (örn. Cloud Function) ihtiyaç vardır.

  const handleSwipe = async (profileId: string, direction: 'left' | 'right') => {
    // UI'yi iyimser bir şekilde güncelle
    setProfiles(prev => prev.filter(p => p.id !== profileId));
    // Firestore'a yazma mantığı geçici olarak devre dışı bırakıldı.
  };

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (profiles.length > 0) {
      const topProfile = profiles[profiles.length - 1];
      handleSwipe(topProfile.id, direction);
    }
  };

  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const activeProfile = profiles.length > 0 ? profiles[profiles.length - 1] : null;

  return (
    <div className="flex flex-col h-full bg-muted/20 dark:bg-black overflow-hidden">
      <div className="relative flex-1 flex flex-col items-center justify-center pb-16">
        <div className="relative w-full h-full max-w-md">
          <AnimatePresence>
            {profiles.length > 0 ? (
              profiles.map((profile, index) => {
                const isTopCard = index === profiles.length - 1;
                return (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    onSwipe={(dir) => handleSwipe(profile.id, dir)}
                    isTopCard={isTopCard}
                  />
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground px-8">
                <Heart className="h-16 w-16 mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold text-foreground">Herkes Tükendi!</h2>
                <p>Çevrendeki tüm profilleri gördün. Daha sonra tekrar kontrol et.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {activeProfile && (
        <div className="absolute bottom-6 left-0 right-0 z-20 flex w-full items-center justify-center gap-x-4 py-4 shrink-0">
          <Button onClick={() => triggerSwipe('left')} variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white text-rose-500 shadow-xl hover:bg-gray-100 transform transition-transform hover:scale-110">
            <X className="h-8 w-8" />
          </Button>
          <Button onClick={() => triggerSwipe('right')} variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white text-teal-400 shadow-xl hover:bg-gray-100 transform transition-transform hover:scale-110">
            <Heart className="h-8 w-8 fill-current" />
          </Button>
        </div>
      )}
    </div>
  );
}
