
'use client';

import { useUser, useFirestore } from '@/firebase';
import { langTr } from '@/languages/tr';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

type Address = {
    city: string | null;
    country: string | null;
};

export default function LocationSettingsPage() {
    const { user, userProfile } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const t = langTr;
    const tc = t.ayarlarKonum;

    const [distanceValue, setDistanceValue] = useState(userProfile?.distancePreference || 80);
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    const [currentAddress, setCurrentAddress] = useState<Address | null>(null);
    const [isAddressLoading, setIsAddressLoading] = useState(true);
    const [locationError, setLocationError] = useState<string | null>(null);

    const getAddressFromCoordinates = useCallback(async (lat: number, lon: number) => {
        setIsAddressLoading(true);
        try {
            const response = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
            const data = await response.json();
            if (response.ok && data.address) {
                setCurrentAddress(data.address);
            } else {
                setCurrentAddress(null);
                console.error("Geocoding failed:", data.error);
            }
        } catch (error) {
            console.error("Error fetching address:", error);
            setCurrentAddress(null);
        } finally {
            setIsAddressLoading(false);
        }
    }, []);

    useEffect(() => {
        if (userProfile?.location?.latitude && userProfile?.location?.longitude) {
            getAddressFromCoordinates(userProfile.location.latitude, userProfile.location.longitude);
        } else {
            setIsAddressLoading(false);
        }
    }, [userProfile, getAddressFromCoordinates]);
    
    const handleDistanceChange = (value: number[]) => {
      setDistanceValue(value[0]);
    };

    const handleDistanceCommit = async (value: number[]) => {
        if (!user || !firestore) return;
        
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
            await updateDoc(userDocRef, {
                distancePreference: value[0]
            });
            toast({
                title: "Mesafe Güncellendi",
                description: "Mesafe tercihiniz başarıyla kaydedildi.",
            });
        } catch (error) {
            console.error("Failed to update distance preference: ", error);
             toast({
                title: "Hata",
                description: "Mesafe tercihiniz güncellenirken bir hata oluştu.",
                variant: "destructive"
            });
        }
    };
    
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
                     const response = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
                     const data = await response.json();

                     if(!response.ok) throw new Error(data.error || 'Adres bilgisi alınamadı.');

                    await updateDoc(userDocRef, {
                        location: { latitude, longitude },
                        address: data.address || null
                    });
                    
                    setCurrentAddress(data.address || null);

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
                }
                setLocationError(message);
                setIsLocationLoading(false);
            },
            { timeout: 10000 }
        );
    };

    return (
        <div className="flex h-dvh flex-col bg-gray-50 dark:bg-black">
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
                        {isAddressLoading ? (
                             <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{tc.gettingAddress}</span>
                            </div>
                        ) : currentAddress?.city ? (
                            <p className="text-lg font-semibold">{currentAddress.city}, {currentAddress.country}</p>
                        ) : (
                            <p className="text-muted-foreground">{tc.addressNotFound}</p>
                        )}
                       
                        <Button onClick={handleLocationRequest} disabled={isLocationLoading}>
                            {isLocationLoading ? (
                                <>
                                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                 {tc.updatingButton}
                                </>
                            ) : tc.updateButton}
                        </Button>
                         {locationError && <p className="text-sm text-destructive mt-2">{locationError}</p>}
                    </CardContent>
                </Card>
                
                <Separator />

                <div className='space-y-6'>
                    <div>
                        <h2 className="text-xl font-bold">Mesafe Tercihi</h2>
                        <p className='text-muted-foreground'>Potansiyel eşleşmeler için maksimum mesafeyi ayarla.</p>
                    </div>

                     <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <Label className="text-base">Mesafe</Label>
                            <span className="text-xl font-bold text-foreground">{distanceValue} Km</span>
                        </div>
                        <Slider
                            value={[distanceValue]}
                            max={160}
                            min={1}
                            step={1}
                            onValueChange={handleDistanceChange}
                            onValueCommit={handleDistanceCommit}
                            className="w-full"
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}
