
'use client';

import { useUser, useFirestore } from '@/firebase/provider';
import { langTr } from '@/languages/tr';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Icons } from '@/components/icons';

export default function LocationSettingsPage() {
    const { user, userProfile } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const t = langTr;
    const tc = t.ayarlarKonum;

    const [isLocationLoading, setIsLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    const handleLocationRequest = () => {
        setIsLocationLoading(true);
        setLocationError(null);

        if (!navigator.geolocation) {
            const errorMsg = tc.errors.permissionDenied;
            setLocationError(errorMsg);
            setIsLocationLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                if (!user || !firestore) return;

                const userDocRef = doc(firestore, 'users', user.uid);

                try {
                    // First, get geocode data
                    const geocodeResponse = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
                    let addressData = {};
                    if (geocodeResponse.ok) {
                        addressData = await geocodeResponse.json();
                    } else {
                        console.warn("Geocoding failed, location will be saved without address.");
                    }

                    await updateDoc(userDocRef, {
                        location: { latitude, longitude },
                        address: addressData, // Save geocoded address
                        locationLastUpdated: serverTimestamp(),
                    });
                    
                    toast({
                        title: tc.toasts.successTitle,
                        description: tc.toasts.successDesc,
                    });

                } catch(error: any) {
                    console.error("Location update error:", error);
                    setLocationError(error.message || tc.errors.dbSaveError);
                } finally {
                    setIsLocationLoading(false);
                }
            },
            (error) => {
                let message = tc.errors.positionUnavailable;
                if (error.code === error.PERMISSION_DENIED) {
                    message = tc.errors.permissionDenied;
                } else if (error.code === error.TIMEOUT) {
                    message = tc.errors.timeout;
                }
                setLocationError(message);
                setIsLocationLoading(false);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    const lastUpdatedDate = userProfile?.locationLastUpdated?.toDate();
    const currentAddress = userProfile?.address;

    return (
        <div className="flex h-dvh flex-col">
             <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">{tc.title}</h1>
                <div className='w-9'></div>
            </header>
            <main className="flex-1 overflow-y-auto p-6 space-y-8">
                
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <MapPin className="w-5 h-5" />
                           {tc.currentLocation}
                        </CardTitle>
                        <CardDescription>{tc.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {currentAddress && (currentAddress.city || currentAddress.country) ? (
                            <p className="text-base font-semibold">
                                {currentAddress.city}, {currentAddress.country}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">{tc.addressNotFound}</p>
                        )}
                        
                        {lastUpdatedDate ? (
                            <p className="text-sm text-muted-foreground">
                                Son Güncelleme: {format(lastUpdatedDate, "d MMMM yyyy, HH:mm", { locale: tr })}
                            </p>
                        ) : (
                           <p className="text-sm text-destructive mt-2">{tc.locationMissingTitle}</p>
                        )}
                       
                        <Button onClick={handleLocationRequest} disabled={isLocationLoading}>
                            {isLocationLoading ? (
                                <>
                                 <Icons.logo width={24} height={24} className="mr-2 animate-pulse" />
                                 {tc.updatingButton}
                                </>
                            ) : (
                                <>
                                    <RefreshCw className='mr-2 h-4 w-4' />
                                    {tc.updateButton}
                                </>
                            )}
                        </Button>
                         {locationError && <p className="text-sm text-destructive mt-2">{locationError}</p>}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
