'use client';

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, X, Mail, Lock, Eye, EyeOff, MapPin, CheckCircle, XCircle, User, Venus, Mars, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { langTr } from "@/languages/tr";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import * as LucideIcons from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

const formSchema = z.object({
    email: z.string().email({ message: "Lütfen geçerli bir e-posta adresi girin." }),
    fullName: z.string()
      .min(2, { message: "İsim en az 2 karakter olmalıdır." })
      .max(20, { message: "İsim en fazla 20 karakter olabilir." }),
    gender: z.enum(['male', 'female'], { required_error: "Lütfen cinsiyetinizi seçin." }),
    dateOfBirth: z.date()
      .max(eighteenYearsAgo, { message: "En az 18 yaşında olmalısın." })
      .refine(date => !isNaN(date.getTime()), { message: "Lütfen geçerli bir tarih girin." }),
    location: z.object({
        latitude: z.number(),
        longitude: z.number(),
    }).optional(),
    interests: z.array(z.string()).min(3, { message: "Devam etmek için en az 3 ilgi alanı seçmelisin." }),
    password: z.string().min(6, { message: "Şifre en az 6 karakter olmalıdır." }),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof formSchema>;

type IconName = keyof Omit<typeof LucideIcons, 'createLucideIcon' | 'LucideIcon'>;
const interestCategories = langTr.signup.step11.categories;

const DateInput = ({ value, onChange }: { value?: Date, onChange: (date: Date) => void }) => {
    const [day, setDay] = useState(() => value ? String(value.getDate()).padStart(2, '0') : '');
    const [month, setMonth] = useState(() => value ? String(value.getMonth() + 1).padStart(2, '0') : '');
    const [year, setYear] = useState(() => value ? String(value.getFullYear()) : '');

    const dayRef = React.useRef<HTMLInputElement>(null);
    const monthRef = React.useRef<HTMLInputElement>(null);
    const yearRef = React.useRef<HTMLInputElement>(null);
    
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
            <Input ref={dayRef} placeholder="GG" maxLength={2} value={day} onChange={(e) => handleDateChange(e, setDay, 'day')} inputMode="numeric" className="text-base text-center h-12 w-14 p-0 bg-background" />
            <span className="text-base text-muted-foreground">/</span>
            <Input ref={monthRef} placeholder="AA" maxLength={2} value={month} onChange={(e) => handleDateChange(e, setMonth, 'month')} inputMode="numeric" className="text-base text-center h-12 w-14 p-0 bg-background" />
            <span className="text-base text-muted-foreground">/</span>
            <Input ref={yearRef} placeholder="YYYY" maxLength={4} value={year} onChange={(e) => handleDateChange(e, setYear, 'year')} inputMode="numeric" className="text-base text-center h-12 w-20 p-0 bg-background" />
        </div>
    )
}

const PasswordStrengthMeter = ({ password }: { password?: string }) => {
    const getStrength = () => {
        if (!password) return 0;
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return (score / 5) * 100;
    };
    const strength = getStrength();
    const color = strength < 40 ? 'bg-red-500' : strength < 80 ? 'bg-yellow-500' : 'bg-green-500';
    const label = strength < 40 ? 'Zayıf' : strength < 80 ? 'Orta' : 'Güçlü';

    return (
        <div className="space-y-2">
            <Progress value={strength} className="h-2 [&>div]:bg-red-500" indicatorClassName={color} />
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );
};


export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      fullName: "",
      interests: [],
    },
    mode: "onChange",
  });
  const { watch } = form;
  const password = watch('password');
  
  const handleLocationRequest = () => {
    setIsLocationLoading(true);
    setLocationStatus('idle');
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue('location', { latitude: position.coords.latitude, longitude: position.coords.longitude }, { shouldValidate: true });
        setLocationStatus('success');
        setIsLocationLoading(false);
        toast({ title: "Başarılı", description: "Konumun başarıyla alındı!" });
      },
      (error) => {
        let message = "Konum alınırken bir hata oluştu.";
        if (error.code === error.PERMISSION_DENIED) message = "Konum izni reddedildi.";
        setLocationError(message);
        setLocationStatus('error');
        setIsLocationLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const prevStep = () => step > 0 ? setStep(prev => prev - 1) : router.push('/');

  async function onSubmit(data: SignupFormValues) {
    setIsSubmitting(true);
    try {
        if (!auth || !firestore) throw new Error("Kimlik doğrulama servisleri hazır değil.");
        
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        await updateProfile(userCredential.user, { displayName: data.fullName });
        
        const userProfileData = {
            uid: userCredential.user.uid,
            email: data.email,
            fullName: data.fullName,
            dateOfBirth: data.dateOfBirth.toISOString(),
            gender: data.gender,
            interests: data.interests,
            location: data.location,
            createdAt: serverTimestamp(),
            images: [],
            profilePicture: '',
            address: null,
            genderPreference: 'both',
            lookingFor: 'whatever',
            ageRange: {min: 18, max: 40},
            globalModeEnabled: true,
            expandAgeRange: true,
            isBot: false,
            rulesAgreed: false,
        };
        
        await setDoc(doc(firestore, "users", userCredential.user.uid), userProfileData);
        router.push('/profil/galeri');

    } catch (error: any) {
        toast({ title: "Kayıt Başarısız", description: error.code === 'auth/email-already-in-use' ? 'Bu e-posta zaten kullanımda.' : error.message, variant: "destructive" });
        setIsSubmitting(false);
    }
  }
  
  const totalSteps = 6;
  const progressValue = ((step + 1) / totalSteps) * 100;

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormValues)[] | undefined;
    switch (step) {
      case 0: fieldsToValidate = ['email', 'fullName']; break;
      case 1: fieldsToValidate = ['gender', 'dateOfBirth']; break;
      case 2: fieldsToValidate = ['location']; break;
      case 3: fieldsToValidate = ['interests']; break;
      case 4: fieldsToValidate = ['password', 'confirmPassword']; break;
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
        if (step === totalSteps - 1) { // Last step (Preview)
            onSubmit(form.getValues());
        } else {
            setStep(s => s + 1);
        }
    }
  };
  
  const handleInterestToggle = (interest: string) => {
    const currentInterests = form.getValues('interests') || [];
    const isSelected = currentInterests.includes(interest);
    if (isSelected) {
        form.setValue('interests', currentInterests.filter(i => i !== interest), { shouldValidate: true });
    } else {
        form.setValue('interests', [...currentInterests, interest], { shouldValidate: true });
    }
  };

  const calculateAge = (dateOfBirth?: Date): number | null => {
      if (!dateOfBirth || isNaN(dateOfBirth.getTime())) return null;
      const ageDifMs = Date.now() - dateOfBirth.getTime();
      const ageDate = new Date(ageDifMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
  };
  
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
       <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b-0 bg-transparent px-4">
        <Button variant="ghost" size="icon" onClick={prevStep} disabled={isSubmitting}>
           {step === 0 ? <X className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
        </Button>
        <Progress value={progressValue} className="h-2 flex-1" />
        <div className="w-9 h-9" />
      </header>
      
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col p-6 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              
              {step === 0 && (
                <div className="space-y-8">
                  <h1 className="text-3xl font-bold">Hesabını Oluştur</h1>
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                        <FormLabel>E-posta Adresin</FormLabel>
                        <FormControl><Input type="email" placeholder="E-posta" {...field} className="h-12"/></FormControl>
                        <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tam Adın</FormLabel>
                        <FormControl><Input placeholder="Adın Soyadın" {...field} className="h-12"/></FormControl>
                        <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {step === 1 && (
                <div className="space-y-8">
                    <h1 className="text-3xl font-bold">Biraz da senden...</h1>
                    <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Cinsiyetin</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                            <FormItem className="flex-1">
                                <FormControl>
                                    <RadioGroupItem value="female" className="sr-only" />
                                </FormControl>
                                <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <Venus className="mb-3 h-8 w-8" />
                                    Kadın
                                </FormLabel>
                            </FormItem>
                             <FormItem className="flex-1">
                                <FormControl>
                                    <RadioGroupItem value="male" className="sr-only" />
                                </FormControl>
                                <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <Mars className="mb-3 h-8 w-8" />
                                    Erkek
                                </FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                     <Controller
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field, fieldState }) => (
                        <FormItem>
                            <FormLabel>Doğum Tarihin</FormLabel>
                            <FormControl><DateInput value={field.value} onChange={field.onChange} /></FormControl>
                            {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                        </FormItem>
                        )}
                    />
                </div>
              )}

              {step === 2 && (
                 <div className="flex flex-col items-center justify-center text-center h-full gap-6">
                    <MapPin className="w-20 h-20 text-primary" />
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold">Konumunu Paylaş</h1>
                      <p className="text-muted-foreground">Çevrendeki potansiyel eşleşmeleri görebilmek için konumunu bizimle paylaşman gerekiyor.</p>
                    </div>
                    {locationStatus === 'idle' && (
                        <Button type="button" onClick={handleLocationRequest} disabled={isLocationLoading} size="lg" className="rounded-full">
                            {isLocationLoading && <Icons.logo width={24} height={24} className="mr-2 animate-pulse" />}
                            {isLocationLoading ? 'Konum Alınıyor...' : 'Konumumu Paylaş'}
                        </Button>
                    )}
                    {locationStatus === 'success' && (
                        <div className="flex flex-col items-center gap-2 text-green-600">
                           <CheckCircle className="w-12 h-12" />
                           <p className="font-semibold text-lg">Konum Başarıyla Alındı!</p>
                        </div>
                    )}
                    {locationStatus === 'error' && (
                         <div className="flex flex-col items-center gap-2 text-destructive">
                           <XCircle className="w-12 h-12" />
                           <p className="font-semibold text-lg">{locationError}</p>
                           <Button type="button" onClick={handleLocationRequest} variant="outline" className="mt-4">Tekrar Dene</Button>
                        </div>
                    )}
                    <FormMessage>{form.formState.errors.location?.message}</FormMessage>
                 </div>
              )}
              
              {step === 3 && (
                <FormField control={form.control} name="interests" render={({ field }) => (
                    <FormItem className="flex-1 flex flex-col min-h-0">
                        <div className="shrink-0">
                            <h1 className="text-3xl font-bold">İlgini çekenler?</h1>
                            <p className="text-muted-foreground mt-2">En az 3 ilgi alanı seçerek profilini zenginleştir.</p>
                            <FormMessage className="pt-2" />
                        </div>
                        <div className="flex-1 overflow-y-auto -mr-6 pr-6 pt-4">
                            <Accordion type="multiple" defaultValue={interestCategories.map(c => c.title)} className="w-full">
                                {interestCategories.map((category) => {
                                const Icon = LucideIcons[category.icon as IconName] || Sparkles;
                                return (
                                    <AccordionItem value={category.title} key={category.title}>
                                    <AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-3"><Icon className="h-5 w-5" /><span>{category.title}</span></div></AccordionTrigger>
                                    <AccordionContent><div className="flex flex-wrap gap-2">{category.options.map((interest) => (<Badge key={interest} variant={field.value.includes(interest) ? 'default' : 'secondary'} onClick={() => handleInterestToggle(interest)} className="cursor-pointer text-base py-1 px-3">{interest}</Badge>))}</div></AccordionContent>
                                    </AccordionItem>
                                )})}
                            </Accordion>
                        </div>
                    </FormItem>
                )} />
              )}
              
              {step === 4 && (
                 <div className="space-y-8">
                     <h1 className="text-3xl font-bold">Güvenli bir şifre belirle</h1>
                     <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Şifren</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input type={showPassword ? 'text' : 'password'} placeholder="Şifreni oluştur" {...field} className="pl-10 pr-10 h-12"/>
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2"><Icons.logo className="h-5 w-5 text-muted-foreground" /></button>
                                </div>
                            </FormControl>
                             <PasswordStrengthMeter password={password} />
                            <FormMessage />
                        </FormItem>
                      )} />
                     <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Şifreni Onayla</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Şifreni tekrar gir" {...field} className="pl-10 pr-10 h-12" />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2"><Icons.logo className="h-5 w-5 text-muted-foreground" /></button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                      )} />
                  </div>
              )}

              {step === 5 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                    <h1 className="text-3xl font-bold">Profil Önizlemesi</h1>
                    <p className="text-muted-foreground">Harika görünüyorsun! Bilgilerin aşağıda göründüğü gibi olacak.</p>
                     <div className="w-full max-w-sm rounded-2xl border bg-card p-6 space-y-4">
                        <Avatar className="w-24 h-24 mx-auto">
                            <AvatarFallback><User className="w-12 h-12" /></AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">{form.getValues('fullName')}, {calculateAge(form.getValues('dateOfBirth'))}</h2>
                            <p className="text-muted-foreground flex items-center justify-center gap-2">
                                {form.getValues('gender') === 'female' ? <Venus className="w-4 h-4 text-pink-500" /> : <Mars className="w-4 h-4 text-blue-500" />}
                                {form.getValues('gender') === 'female' ? 'Kadın' : 'Erkek'}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-left mb-2">İlgi Alanları</h3>
                             <div className="flex flex-wrap gap-2">
                                {form.getValues('interests').slice(0, 5).map(interest => (
                                    <Badge key={interest} variant="secondary">{interest}</Badge>
                                ))}
                            </div>
                        </div>
                     </div>
                      <p className="text-xs text-muted-foreground px-4">Profil fotoğrafını ve diğer bilgilerini kayıt sonrası ekleyebilirsin.</p>
                  </div>
              )}
            </div>

            <div className="shrink-0 pt-6">
                <Button type="button" onClick={handleNextStep} className="w-full h-14 rounded-full text-lg font-bold" disabled={isSubmitting}>
                    {isSubmitting ? <Icons.logo width={24} height={24} className="animate-pulse" /> : (step === totalSteps - 1 ? "Onayla ve Bitir" : "Devam Et")}
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
