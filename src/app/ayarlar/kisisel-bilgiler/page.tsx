
'use client';

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser, useFirestore } from '@/firebase/provider';
import { langTr } from '@/languages/tr';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import googleLogo from '@/img/googlelogin.png';
import { Icons } from "@/components/icons";

const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

const formSchema = z.object({
  fullName: z.string()
    .min(2, { message: "İsim en az 2 karakter olmalıdır." })
    .max(14, { message: "İsim en fazla 14 karakter olabilir." })
    .regex(/^[a-zA-Z\sçÇğĞıİöÖşŞüÜ]+$/, { message: "İsim sadece harf içerebilir." }),
  dateOfBirth: z.date()
    .max(eighteenYearsAgo, { message: "En az 18 yaşında olmalısın." })
    .refine(date => !isNaN(date.getTime()), { message: "Lütfen geçerli bir tarih girin." }),
});

type FormValues = z.infer<typeof formSchema>;

const DateInput = ({ value, onChange, disabled }: { value?: Date, onChange: (date: Date) => void, disabled?: boolean }) => {
    const [day, setDay] = useState(() => value ? String(value.getDate()).padStart(2, '0') : '');
    const [month, setMonth] = useState(() => value ? String(value.getMonth() + 1).padStart(2, '0') : '');
    const [year, setYear] = useState(() => value ? String(value.getFullYear()) : '');

    const dayRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const yearRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if(value) {
            setDay(String(value.getDate()).padStart(2, '0'));
            setMonth(String(value.getMonth() + 1).padStart(2, '0'));
            setYear(String(value.getFullYear()));
        }
    }, [value]);

    const handleDateChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      setter: React.Dispatch<React.SetStateAction<string>>,
      field: 'day' | 'month' | 'year'
    ) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        let newDay = day, newMonth = month, newYear = year;

        if (field === 'day') {
            if (val.length > 0 && parseInt(val.charAt(0)) > 3) { /* do nothing */ }
            else if (val.length > 1 && parseInt(val) > 31) { /* do nothing */ }
            else { setDay(val); newDay = val; if (val.length === 2) monthRef.current?.focus(); }
        } else if (field === 'month') {
             if (val.length > 0 && parseInt(val.charAt(0)) > 1) { /* do nothing */ }
             else if (val.length > 1 && parseInt(val) > 12) { /* do nothing */ }
             else { setMonth(val); newMonth = val; if (val.length === 2) yearRef.current?.focus(); }
        } else { setYear(val); newYear = val; }

        if (newDay.length === 2 && newMonth.length === 2 && newYear.length === 4) {
            const date = new Date(`${newYear}-${newMonth}-${newDay}T00:00:00`);
            if (!isNaN(date.getTime()) && date.getDate() === parseInt(newDay) && date.getMonth() + 1 === parseInt(newMonth)) {
                onChange(date);
            } else { onChange(new Date('invalid')); }
        } else { onChange(new Date('invalid')); }
    };
    
    return (
        <div className="flex items-center gap-2">
            <Input ref={dayRef} placeholder="GG" maxLength={2} value={day} onChange={(e) => handleDateChange(e, setDay, 'day')} disabled={disabled} inputMode="numeric" className="text-base text-center h-12 w-14 p-0 bg-background" />
            <span className="text-base text-muted-foreground">/</span>
            <Input ref={monthRef} placeholder="AA" maxLength={2} value={month} onChange={(e) => handleDateChange(e, setMonth, 'month')} disabled={disabled} inputMode="numeric" className="text-base text-center h-12 w-14 p-0 bg-background" />
            <span className="text-base text-muted-foreground">/</span>
            <Input ref={yearRef} placeholder="YYYY" maxLength={4} value={year} onChange={(e) => handleDateChange(e, setYear, 'year')} disabled={disabled} inputMode="numeric" className="text-base text-center h-12 w-20 p-0 bg-background" />
        </div>
    )
}

export default function PersonalInfoPage() {
    const { user, userProfile } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: userProfile?.fullName || '',
            dateOfBirth: userProfile?.dateOfBirth ? new Date(userProfile.dateOfBirth) : undefined,
        },
        mode: 'onChange',
    });

    const [ageStatus, setAgeStatus] = useState<'valid' | 'invalid' | 'unknown'>('unknown');
    const isDobSet = !!userProfile?.dateOfBirth;

    useEffect(() => {
        if (userProfile) {
            form.reset({
                fullName: userProfile.fullName || '',
                dateOfBirth: userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth) : undefined
            });
            
             if (userProfile.dateOfBirth) {
                const date = new Date(userProfile.dateOfBirth);
                const ageDifMs = Date.now() - date.getTime();
                const ageDate = new Date(ageDifMs);
                const age = Math.abs(ageDate.getUTCFullYear() - 1970);
                setAgeStatus(age >= 18 ? 'valid' : 'invalid');
            }
        }
    }, [userProfile, form]);
    
    const handleDateOfBirthChange = (date: Date) => {
        form.setValue('dateOfBirth', date, { shouldValidate: true });
        if (isNaN(date.getTime())) {
            setAgeStatus('unknown');
            return;
        }
        const ageDifMs = Date.now() - date.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);

        setAgeStatus(age >= 18 ? 'valid' : 'invalid');
    };

    const onSubmit = async (data: FormValues) => {
        if (!user || !firestore) return;
        
        setIsSubmitting(true);
        const userDocRef = doc(firestore, 'users', user.uid);
        
        try {
            const dataToUpdate: any = { fullName: data.fullName };
            if (!isDobSet) {
              dataToUpdate.dateOfBirth = data.dateOfBirth.toISOString();
            }

            await updateDoc(userDocRef, dataToUpdate);

            toast({
                title: "Bilgiler Güncellendi",
                description: "Kişisel bilgileriniz başarıyla kaydedildi.",
            });
        } catch (error) {
            console.error("Failed to update personal info: ", error);
             toast({
                title: "Hata",
                description: "Bilgileriniz güncellenirken bir hata oluştu.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="flex h-dvh flex-col">
             <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Kişisel Bilgiler</h1>
                <Button form="personal-info-form" type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                    {isSubmitting ? <Icons.logo width={24} height={24} className="animate-spin" /> : langTr.common.save}
                </Button>
            </header>
            <main className="flex-1 overflow-y-auto p-6 flex flex-col justify-center items-center">
                 <div className="w-full max-w-md space-y-6">
                    <div className="flex items-center justify-center gap-3 rounded-lg border bg-background p-4">
                        <Image src={googleLogo} alt="Google logo" width={20} height={20} />
                        <span className="text-sm text-muted-foreground">{user?.email}</span>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Profil Bilgileri</CardTitle>
                            <CardDescription>Bu bilgiler profilinde herkese açık olarak görünecektir.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Form {...form}>
                                <form id="personal-info-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                    <FormField
                                        control={form.control}
                                        name="fullName"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Tam İsim</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Adınız" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Controller
                                        control={form.control}
                                        name="dateOfBirth"
                                        render={({ field, fieldState }) => (
                                        <FormItem>
                                            <FormLabel>Doğum Tarihi</FormLabel>
                                            <FormControl>
                                            <DateInput value={field.value} onChange={handleDateOfBirthChange} disabled={isDobSet} />
                                            </FormControl>
                                            {isDobSet && <p className="text-sm text-muted-foreground mt-2">Doğum tarihi değiştirilemez.</p>}
                                            {ageStatus === 'valid' && <div className="flex items-center text-green-600 mt-2 text-sm"><CheckCircle className="mr-2 h-4 w-4" />18 yaşından büyüksünüz.</div>}
                                            {ageStatus === 'invalid' && <div className="flex items-center text-red-600 mt-2 text-sm"><XCircle className="mr-2 h-4 w-4" />18 yaşından küçükler kullanamaz.</div>}
                                            {fieldState.error && ageStatus !== 'invalid' && <FormMessage>{fieldState.error.message}</FormMessage>}
                                        </FormItem>
                                        )}
                                    />
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                 </div>
            </main>
        </div>
    )
}
