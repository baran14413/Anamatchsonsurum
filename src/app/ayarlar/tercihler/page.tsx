
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
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';


export default function PreferencesPage() {
    const { user, userProfile } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const t = langTr;

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


    return (
        <div className="flex h-dvh flex-col bg-gray-50 dark:bg-black">
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
                        <h2 className="text-xl font-bold">Görmek İstiyorum</h2>
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
                        <h2 className="text-xl font-bold">Küresel</h2>
                        <p className='text-muted-foreground'>Coğrafi sınırların dışına çık.</p>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                        <Label htmlFor="global-mode" className="flex flex-col space-y-1">
                            <span>Küresel Mod</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Dünyanın her yerinden insanlarla eşleş.
                            </span>
                        </Label>
                        <Switch
                            id="global-mode"
                            checked={userProfile?.globalModeEnabled || false}
                            onCheckedChange={handleGlobalModeChange}
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}
