
'use client';

import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { Loader2, MapPin, AlertTriangle, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { langEn } from '@/languages/en';


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
  const [address, setAddress] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = langEn.ayarlarKonum;

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading, error: docError } = useDoc(userProfileRef);

  useEffect(() => {
    const fetchAddress = async (lat: number, lon: number) => {
        setIsGeocoding(true);
        setError(null);
        try {
            const response = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
            const data = await response.json();
            
            if (response.ok && data.address) {
                const adr = data.address;
                const formattedAddress = [
                    adr.streetName,
                    adr.streetNumber,
                    adr.district,
                    adr.city,
                    adr.zipcode,
                    adr.state,
                    adr.country
                ].filter(Boolean).join(', ');
                setAddress(formattedAddress || t.addressDetailNotFound);
            } else {
                setAddress(t.addressNotFound);
            }
        } catch (err) {
            console.error("Geocoding fetch error:", err);
            setAddress(t.addressNotFound);
        } finally {
            setIsGeocoding(false);
        }
    };

    if (userProfile?.location) {
      fetchAddress(userProfile.location.latitude, userProfile.location.longitude);
    }
  }, [userProfile?.location, t]);

  const handleUpdateLocation = () => {
    setIsUpdating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        
        if (userProfileRef) {
          updateDoc(userProfileRef, { location: newLocation })
            .then(() => {
              toast({
                title: t.toasts.successTitle,
                description: t.toasts.successDesc,
              });
              setError(null);
            })
            .catch((e) => {
                console.error("Firestore update error:", e);
                setError(t.errors.dbSaveError);
            })
            .finally(() => {
              setIsUpdating(false);
            });
        } else {
            setError(t.errors.refNotFoundError);
            setIsUpdating(false);
        }
      },
      (geoError) => {
        let errorMessage = t.errors.permissionDenied;
        switch(geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMessage = t.errors.permissionDenied;
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMessage = t.errors.positionUnavailable;
            break;
          case geoError.TIMEOUT:
            errorMessage = t.errors.timeout;
            break;
        }
        setError(errorMessage);
        setIsUpdating(false);
      }
    );
  };

  if (isLoading && !userProfile) {
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
            {t.title}
          </CardTitle>
          <CardDescription>
            {t.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <SimulatedMap location={userProfile?.location || null} />

          {userProfile?.location ? (
            <div className="p-4 rounded-lg bg-muted border">
                <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  {t.currentLocation}
                </h3>
                {isGeocoding ? (
                   <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t.gettingAddress}</span>
                   </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2 pl-7">
                    {address || t.addressNotFound}
                  </p>
                )}
            </div>
          ) : (
             <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <h3 className="font-semibold text-lg text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    {t.locationMissingTitle}
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    {t.locationMissingDesc}
                </p>
            </div>
          )}

           {error && (
            <p className="text-sm font-medium text-destructive text-center">{error}</p>
          )}

          <Button onClick={handleUpdateLocation} disabled={isUpdating} className="w-full">
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="mr-2 h-4 w-4" />
            )}
            {isUpdating ? t.updatingButton : t.updateButton}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}

    