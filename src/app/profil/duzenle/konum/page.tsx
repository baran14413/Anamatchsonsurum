
'use client';

import { useUser, useFirestore, useDoc, useAuth } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { Loader2, MapPin, Check, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

// A simple component to simulate a map
const SimulatedMap = ({ location }: { location: { latitude: number; longitude: number } | null }) => {
  return (
    <div className="relative h-64 w-full rounded-lg bg-muted overflow-hidden border">
      <div 
        className="absolute bg-gray-300 w-full h-full"
        style={{
            backgroundImage: 'url(https://source.unsplash.com/random/800x600?map)',
            backgroundSize: 'cover',
            filter: 'grayscale(50%) blur(2px)',
        }}
      />
      {location && (
        <div 
          className="absolute" 
          style={{ 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)' 
          }}
        >
          <div className="relative flex flex-col items-center">
             <MapPin className="h-10 w-10 text-red-500 fill-red-500 drop-shadow-lg" />
             <div className="absolute -bottom-5 w-4 h-4 bg-red-500/20 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};


export default function KonumPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading, mutate } = useDoc(userProfileRef);

  const handleUpdateLocation = () => {
    setIsUpdating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        try {
          if (userProfileRef) {
            await updateDoc(userProfileRef, { location: newLocation });
            mutate(); // Re-fetch the data after update
            toast({
              title: "Konum Güncellendi",
              description: "Yeni konumunuz başarıyla kaydedildi.",
            });
          }
        } catch (e) {
            setError("Konum güncellenirken bir hata oluştu.");
            toast({ title: "Hata", description: "Veritabanına yazılamadı.", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
      },
      (geoError) => {
        setError("Konum izni alınamadı. Lütfen tarayıcı ayarlarınızı kontrol edin.");
        toast({ title: "Konum Hatası", description: "Konum izni reddedildi veya alınamadı.", variant: "destructive" });
        setIsUpdating(false);
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Konum Yönetimi
          </CardTitle>
          <CardDescription>
            Çevrendeki potansiyel eşleşmeleri görmek için konumunu güncel tut.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <SimulatedMap location={userProfile?.location || null} />

          {userProfile?.location ? (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-lg text-green-800 dark:text-green-300">Kayıtlı Konum</h3>
                <p className="font-mono text-sm text-green-700 dark:text-green-400 mt-1">
                    Enlem: {userProfile.location.latitude.toFixed(5)}
                </p>
                 <p className="font-mono text-sm text-green-700 dark:text-green-400">
                    Boylam: {userProfile.location.longitude.toFixed(5)}
                </p>
            </div>
          ) : (
             <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <h3 className="font-semibold text-lg text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Konum Bilgisi Eksik
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    Eşleşmeleri görebilmek için konum bilginizi eklemeniz gerekmektedir.
                </p>
            </div>
          )}

           {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <Button onClick={handleUpdateLocation} disabled={isUpdating} className="w-full">
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="mr-2 h-4 w-4" />
            )}
            {isUpdating ? 'Konum Alınıyor...' : 'Konumumu Güncelle'}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
