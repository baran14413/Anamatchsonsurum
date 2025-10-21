
'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { ArrowLeft, X, Mail, Lock, Eye, EyeOff, MapPin, CheckCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { langTr } from "@/languages/tr";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import * as LucideIcons from 'lucide-react';

const formSchema = z.object({
    email: z.string().email({ message: langTr.signup.errors.form.email }),
    password: z.string().min(6, { message: langTr.signup.errors.form.password }),
    confirmPassword: z.string().min(6, { message: "Onay şifresi en az 6 karakter olmalıdır."}),
    name: z.string()
      .min(2, { message: "İsim en az 2 karakter olmalıdır." })
      .max(14, { message: "İsim en fazla 14 karakter olabilir." })
      .regex(/^[a-zA-Z\sçÇğĞıİöÖşŞüÜ]+$/, { message: "İsim sadece harf içerebilir." }),
    location: z.object({
        latitude: z.number(),
        longitude: z.number(),
    }),
    interests: z.array(z.string()).min(5, { message: "Devam etmek için en az 5 ilgi alanı seçmelisin." }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof formSchema>;

type IconName = keyof Omit<typeof LucideIcons, 'createLucideIcon' | 'LucideIcon'>;
const interestCategories = langTr.signup.step11.categories;

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const t = langTr.signup;
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
      password: '',
      confirmPassword: '',
      name: "",
      interests: [],
    },
    mode: "onChange",
  });
  
  const handleLocationRequest = () => {
    setIsLocationLoading(true);
    setLocationStatus('idle');
    setLocationError(null);

    if (!navigator.geolocation) {
      const errorMsg = "Tarayıcınız konum servisini desteklemiyor.";
      toast({ title: "Hata", description: errorMsg, variant: "destructive" });
      setLocationError(errorMsg);
      setLocationStatus('error');
      setIsLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        form.setValue('location', { latitude, longitude }, { shouldValidate: true });
        
        setLocationStatus('success');
        setIsLocationLoading(false);
        toast({
            title: "Başarılı",
            description: "Konumun başarıyla alındı!",
        });
      },
      (error) => {
        let message = "Konum alınırken bir hata oluştu.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Konum izni reddedildi. Lütfen tarayıcı ayarlarınızı kontrol edin.";
        } else if (error.code === error.TIMEOUT) {
            message = "Konum alma isteği zaman aşımına uğradı. Lütfen tekrar deneyin.";
        }
        setLocationError(message);
        setLocationStatus('error');
        setIsLocationLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    } else {
        router.push('/');
    }
  };

  async function onSubmit(data: SignupFormValues) {
    setIsSubmitting(true);
    
    try {
        if (!auth || !data.email || !data.password) {
            throw new Error("Kimlik doğrulama bilgileri eksik.");
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const currentUser = userCredential.user;
        
        if (!firestore || !currentUser) {
            throw new Error(t.errors.dbConnectionError);
        }
        
        await updateProfile(currentUser, { displayName: data.name });
        
        const userProfileData = {
            uid: currentUser.uid,
            email: data.email,
            fullName: data.name,
            interests: data.interests,
            images: [], // Initialize with empty array
            location: data.location,
            address: null,
            profilePicture: '', // Initialize with empty string
            createdAt: serverTimestamp(),
            dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 25)).toISOString(), // Default age 25
            gender: 'male', // Default gender
            genderPreference: 'both',
            lookingFor: 'whatever',
            ageRange: {min: 18, max: 40},
            globalModeEnabled: true, // Global mode is ON by default for new users
            expandAgeRange: true,
            isBot: false,
            rulesAgreed: false, // User will agree after this step
        };
        
        await setDoc(doc(firestore, "users", currentUser.uid), userProfileData);
        // Explicitly redirect to gallery to add first photos
        router.push('/profil/galeri');

    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            toast({
                title: "Kayıt Hatası",
                description: "Bu e-posta adresi zaten kullanımda. Lütfen farklı bir e-posta deneyin veya giriş yapın.",
                variant: "destructive"
            });
        } else {
            toast({ title: "Kayıt Başarısız", description: error.message || "Bir hata oluştu", variant: "destructive" });
        }
        setIsSubmitting(false);
    }
  }
  
  const totalSteps = 3; // Reduced number of steps
  const progressValue = ((step + 1) / totalSteps) * 100;

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormValues)[] | undefined;
    
    switch (step) {
      case 0: fieldsToValidate = ['email', 'password', 'confirmPassword']; break;
      case 1: fieldsToValidate = ['name', 'interests']; break;
      case 2: fieldsToValidate = ['location']; break;
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
        if (step === totalSteps - 1) {
            onSubmit(form.getValues());
        } else {
            nextStep();
        }
    } else {
         const firstErrorField = Object.keys(form.formState.errors)[0] as keyof SignupFormValues;
         if (fieldsToValidate && !fieldsToValidate.includes(firstErrorField)) {
              const stepWithError = {
                'email': 0, 'password': 0, 'confirmPassword': 0,
                'name': 1, 'interests': 1,
                'location': 2,
            }[firstErrorField];
            if (stepWithError !== undefined) {
                setStep(stepWithError);
                toast({
                    title: "Form Eksik",
                    description: 'Lütfen tüm adımlardaki bilgileri doğru bir şekilde doldurun.',
                    variant: "destructive"
                });
            }
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
                <>
                  <h1 className="text-3xl font-bold">Hesabını Oluştur</h1>
                  <p className="text-muted-foreground mt-2">Maceraya başlamak için e-posta ve şifreni belirle.</p>
                  <div className="space-y-6 mt-8">
                     <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>E-posta Adresin</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input type="email" placeholder="E-posta adresini gir" className="pl-10 h-12 bg-secondary border-border placeholder:text-muted-foreground focus:ring-ring" {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                      )} />
                     <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Şifren</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input type={showPassword ? 'text' : 'password'} placeholder="Şifreni oluştur" className="pl-10 pr-10 h-12 bg-secondary border-border placeholder:text-muted-foreground focus:ring-ring" {...field} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                                    </button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                      )} />
                     <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Şifreni Onayla</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Şifreni tekrar gir" className="pl-10 pr-10 h-12 bg-secondary border-border placeholder:text-muted-foreground focus:ring-ring" {...field} />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                                    </button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                      )} />
                  </div>
                </>
              )}
               {step === 1 && (
                <div className="flex-1 flex flex-col min-h-0">
                  <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem className="shrink-0">
                          <h1 className="text-3xl font-bold">{t.step2.title}</h1>
                          <FormControl className="mt-8">
                          <Input placeholder={t.step2.placeholder} className="border-0 border-b-2 border-border rounded-none px-0 text-2xl h-auto focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground" {...field} />
                          </FormControl>
                          <FormLabel className="text-muted-foreground">{t.step2.label}</FormLabel>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                   <FormField
                        control={form.control}
                        name="interests"
                        render={({ field }) => (
                            <FormItem className="flex-1 flex flex-col min-h-0 mt-8">
                                <div className="shrink-0">
                                    <h2 className="text-2xl font-bold">{t.step11.title}</h2>
                                    <p className="text-muted-foreground">
                                        {t.step11.description.replace('{count}', String(field.value.length))}
                                    </p>
                                    <FormMessage className="pt-2" />
                                </div>
                                <div className="flex-1 overflow-y-auto -mr-6 pr-6 pt-4">
                                    <Accordion type="multiple" defaultValue={interestCategories.map(c => c.title)} className="w-full">
                                        {interestCategories.map((category) => {
                                        const Icon = LucideIcons[category.icon as IconName] as React.ElementType || LucideIcons.Sparkles;
                                        return (
                                            <AccordionItem value={category.title} key={category.title}>
                                            <AccordionTrigger className="hover:no-underline">
                                                <div className="flex items-center gap-3">
                                                <Icon className="h-5 w-5" />
                                                <span>{category.title}</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="flex flex-wrap gap-2">
                                                {category.options.map((interest) => (
                                                    <Badge
                                                    key={interest}
                                                    variant={field.value.includes(interest) ? 'default' : 'secondary'}
                                                    onClick={() => handleInterestToggle(interest)}
                                                    className="cursor-pointer text-base py-1 px-3"
                                                    >
                                                    {interest}
                                                    </Badge>
                                                ))}
                                                </div>
                                            </AccordionContent>
                                            </AccordionItem>
                                        )
                                        })}
                                    </Accordion>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>
              )}
               {step === 2 && (
                 <div className="flex flex-col items-center justify-center text-center h-full gap-6">
                    <MapPin className="w-20 h-20 text-foreground" />
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold">{t.step6.title}</h1>
                      <p className="text-muted-foreground">{t.step6.description}</p>
                    </div>
                    {locationStatus === 'idle' && (
                        <Button type="button" onClick={handleLocationRequest} disabled={isLocationLoading} size="lg" className="rounded-full">
                            {isLocationLoading && <Icons.logo width={24} height={24} className="mr-2 animate-pulse" />}
                            {isLocationLoading ? langTr.ayarlarKonum.updatingButton : t.step6.button}
                        </Button>
                    )}
                    {locationStatus === 'success' && (
                        <div className="flex flex-col items-center gap-2 text-green-600">
                           <CheckCircle className="w-12 h-12" />
                           <p className="font-semibold text-lg">Konum Başarıyla Alındı!</p>
                        </div>
                    )}
                    {locationStatus === 'error' && (
                         <div className="flex flex-col items-center gap-2 text-red-600">
                           <XCircle className="w-12 h-12" />
                           <p className="font-semibold text-lg">{locationError}</p>
                           <Button type="button" onClick={handleLocationRequest} variant="outline" className="mt-4">Tekrar Dene</Button>
                        </div>
                    )}
                    <FormMessage>{form.formState.errors.location?.message}</FormMessage>
                 </div>
              )}
            </div>

          <div className="shrink-0 pt-6">
            <Button
              type="button"
              onClick={handleNextStep}
              className="w-full h-14 rounded-full text-lg font-bold"
              disabled={
                isSubmitting ||
                (step === 1 && (form.getValues('interests')?.length ?? 0) < 5) ||
                (step === 2 && locationStatus !== 'success')
              }
            >
              {isSubmitting ? <Icons.logo width={24} height={24} className="animate-pulse" /> : (step === totalSteps - 1 ? "Hesabı Oluştur" : t.common.next)}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
