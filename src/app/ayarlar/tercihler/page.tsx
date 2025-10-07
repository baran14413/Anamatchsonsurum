
'use client';

import { useUser, useFirestore } from '@/firebase';
import { langTr } from '@/languages/tr';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from '@/components/ui/label';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';


export default function PreferencesPage() {
    const { user, userProfile } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const t = langTr;

    const [ageRange, setAgeRange] = useState([userProfile?.ageRange?.min || 18, userProfile?.ageRange?.max || 35]);
    const [distanceValue, setDistanceValue] = useState(userProfile?.distancePreference || 80);

    useEffect(() => {
        if (userProfile?.ageRange) {
            setAgeRange([userProfile.ageRange.min, userProfile.ageRange.max]);
        }
        if (userProfile?.distancePreference) {
            setDistanceValue(userProfile.distancePreference);
        }
    }, [userProfile?.ageRange, userProfile?.distancePreference]);

    const handleGenderPreferenceChange = async (value: 'male' | 'female' | 'both') => {
        if (!user || !firestore) return;
        
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
            await updateDoc(userDocRef, {
                genderPreference: value
            });
            toast({
                title: "Tercih Güncellendi",
                description: "Cinsiyet tercihiniz başarıyla kaydedildi.",
            });
        } catch (error) {
            console.error("Failed to update gender preference: ", error);
             toast({
                title: "Hata",
                description: "Cinsiyetiniz güncellenirken bir hata oluştu.",
                variant: "destructive"
            });
        }
    };
    
    const handleGlobalModeChange = async (checked: boolean) => {
        if (!user || !firestore) return;

        const userDocRef = doc(firestore, 'users', user.uid);
        try {
            await updateDoc(userDocRef, {
                globalModeEnabled: checked
            });
            toast({
                title: "Mod Güncellendi",
                description: `Küresel mod ${checked ? 'aktif' : 'deaktif'} edildi.`,
            });
        } catch (error) {
            console.error("Failed to update global mode: ", error);
            toast({
                title: "Hata",
                description: "Küresel mod güncellenirken bir hata oluştu.",
                variant: "destructive"
            });
        }
    };
    
    const handleAgeRangeChange = (value: number[]) => {
        setAgeRange(value);
    };

    const handleAgeRangeCommit = async (value: number[]) => {
        if (!user || !firestore) return;
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
            await updateDoc(userDocRef, {
                ageRange: { min: value[0], max: value[1] }
            });
            toast({
                title: "Yaş Aralığı Güncellendi",
                description: "Yaş aralığı tercihiniz başarıyla kaydedildi.",
            });
        } catch (error) {
            console.error("Failed to update age range: ", error);
            toast({
                title: "Hata",
                description: "Yaş aralığı güncellenirken bir hata oluştu.",
                variant: "destructive"
            });
        }
    };
    
    const handleExpandAgeRangeChange = async (checked: boolean) => {
        if (!user || !firestore) return;
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
            await updateDoc(userDocRef, { expandAgeRange: checked });
        } catch (error) {
            console.error("Failed to update expand age range toggle: ", error);
        }
    };

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


    return (
        <div className="flex h-dvh flex-col">
             <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Tercihler</h1>
                <div className='w-9'></div>
            </header>
            <main className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className='space-y-4'>
                    <div>
                        <h2 className="text-xl font-bold">Bana Göster</h2>
                        <p className='text-muted-foreground'>Kiminle eşleşmek istersin?</p>
                    </div>

                    <RadioGroup 
                        value={userProfile?.genderPreference || 'both'}
                        onValueChange={handleGenderPreferenceChange}
                        className="space-y-1"
                    >
                        <Label
                            htmlFor="female"
                            className="flex items-center justify-between rounded-lg border bg-background p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                           <span>Kadınları</span>
                           <RadioGroupItem value="female" id="female" />
                        </Label>
                         <Label
                            htmlFor="male"
                            className="flex items-center justify-between rounded-lg border bg-background p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                           <span>Erkekleri</span>
                           <RadioGroupItem value="male" id="male" />
                        </Label>
                         <Label
                            htmlFor="both"
                            className="flex items-center justify-between rounded-lg border bg-background p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                           <span>Herkesi</span>
                           <RadioGroupItem value="both" id="both" />
                        </Label>
                    </RadioGroup>
                </div>
                <Separator />
                 <div className='space-y-4'>
                    <div>
                        <h2 className="text-xl font-bold">Yaş Aralığı</h2>
                    </div>
                     <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <Label className="text-base">Yaş Aralığı</Label>
                            <span className="text-lg font-bold text-foreground">{ageRange[0]} - {ageRange[1]}</span>
                        </div>
                        <Slider
                            value={ageRange}
                            max={80}
                            min={18}
                            step={1}
                            onValueChange={handleAgeRangeChange}
                            onValueCommit={handleAgeRangeCommit}
                            className="w-full"
                        />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                        <Label htmlFor="expand-age" className="flex flex-col space-y-1">
                            <span className="font-normal leading-snug text-muted-foreground">
                                Görecek profil kalmadığında, tercih ettiğim yaş aralığının biraz dışındaki kişileri göster
                            </span>
                        </Label>
                        <Switch
                            id="expand-age"
                            checked={userProfile?.expandAgeRange ?? true}
                            onCheckedChange={handleExpandAgeRangeChange}
                        />
                    </div>
                </div>
                <Separator />
                <div className='space-y-6'>
                    <div>
                        <h2 className="text-xl font-bold">Konum Tercihleri</h2>
                        <p className='text-muted-foreground'>Eşleşme havuzunu coğrafi olarak yönet.</p>
                    </div>

                     <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <Label className="text-base">Maksimum Mesafe</Label>
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
                            disabled={userProfile?.globalModeEnabled}
                        />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                        <Label htmlFor="global-mode" className="flex flex-col space-y-1">
                            <span>Küresel Mod</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Dünyanın her yerinden insanlarla eşleş. Bu mod açıkken mesafe filtresi uygulanmaz.
                            </span>
                        </Label>
                        <Switch
                            id="global-mode"
                            checked={userProfile?.globalModeEnabled ?? false}
                            onCheckedChange={handleGlobalModeChange}
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}
