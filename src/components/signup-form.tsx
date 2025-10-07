
'use client';

import { useState, useMemo, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Heart, GlassWater, Users, Briefcase, Sparkles, Hand, CheckCircle, XCircle, Plus, Trash2, Pencil, MapPin, Globe } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { langTr } from "@/languages/tr";
import Image from "next/image";
import { Icons } from "./icons";
import { Slider } from "./ui/slider";
import googleLogo from '@/img/googlelogin.png';
import type { UserImage } from "@/lib/types";
import { Badge } from "./ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import * as LucideIcons from 'lucide-react';


const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

const formSchema = z.object({
    name: z.string()
      .min(2, { message: "İsim en az 2 karakter olmalıdır." })
      .max(14, { message: "İsim en fazla 14 karakter olabilir." })
      .regex(/^[a-zA-Z\sçÇğĞıİöÖşŞüÜ]+$/, { message: "İsim sadece harf içerebilir." }),
    dateOfBirth: z.date().max(eighteenYearsAgo, { message: "En az 18 yaşında olmalısın." })
        .refine(date => !isNaN(date.getTime()), { message: "Lütfen geçerli bir tarih girin." }),
    gender: z.enum(['male', 'female'], { required_error: "Lütfen cinsiyetini seç." }),
    lookingFor: z.string({ required_error: "Lütfen birini seç." }).min(1, { message: "Lütfen birini seç." }),
    location: z.object({
        latitude: z.number(),
        longitude: z.number(),
    }),
    address: z.object({
      city: z.string().optional(),
      country: z.string().optional()
    }).optional(),
    distancePreference: z.number().min(1, { message: "Mesafe en az 1 km olmalıdır." }).max(160, { message: "Mesafe en fazla 160 km olabilir." }),
    images: z.array(z.object({
        url: z.string().url(),
        public_id: z.string(),
    })).min(2, {message: 'En az 2 fotoğraf yüklemelisin.'}).max(6),
    ageRange: z.object({
      min: z.number(),
      max: z.number()
    }),
    interests: z.array(z.string()).min(10, { message: "Devam etmek için en az 10 ilgi alanı seçmelisin." }),
});

type SignupFormValues = z.infer<typeof formSchema>;

type ImageSlot = {
    file: File | null;
    preview: string | null;
    public_id?: string | null;
    isUploading: boolean;
};

const getInitialImageSlots = (user?: any): ImageSlot[] => {
  // The user wants to remove automatic Google photo population.
  return Array.from({ length: 6 }, () => ({ file: null, preview: null, public_id: null, isUploading: false }));
};


const lookingForOptions = [
    { id: 'long-term', icon: Heart },
    { id: 'short-term', icon: GlassWater },
    { id: 'friends', icon: Users },
    { id: 'casual', icon: Briefcase },
    { id: 'not-sure', icon: Sparkles },
    { id: 'whatever', icon: Hand },
];

type IconName = keyof Omit<typeof LucideIcons, 'createLucideIcon' | 'LucideIcon'>;
const interestCategories = langTr.signup.step11.categories;


const DateInput = ({ value, onChange, disabled, t }: { value?: Date, onChange: (date: Date) => void, disabled?: boolean, t: any }) => {
    const [day, setDay] = useState(() => value ? String(value.getDate()).padStart(2, '0') : '');
    const [month, setMonth] = useState(() => value ? String(value.getMonth() + 1).padStart(2, '0') : '');
    const [year, setYear] = useState(() => value ? String(value.getFullYear()) : '');

    const dayRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const yearRef = useRef<HTMLInputElement>(null);

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
            const date = new Date(`${newYear}-${newMonth}-${newDay}`);
            if (!isNaN(date.getTime()) && date.getDate() === parseInt(newDay) && date.getMonth() + 1 === parseInt(newMonth)) {
                onChange(date);
            } else { onChange(new Date('invalid')); }
        } else { onChange(new Date('invalid')); }
    };
    
    return (
        <div className="flex items-center gap-2">
            <Input ref={dayRef} placeholder={t.dayPlaceholder} maxLength={2} value={day} onChange={(e) => handleDateChange(e, setDay, 'day')} disabled={disabled} inputMode="numeric" className="text-xl text-center h-14 w-16 p-0 border-0 border-b-2 rounded-none bg-transparent focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0" />
            <span className="text-xl text-muted-foreground">/</span>
            <Input ref={monthRef} placeholder={t.monthPlaceholder} maxLength={2} value={month} onChange={(e) => handleDateChange(e, setMonth, 'month')} disabled={disabled} inputMode="numeric" className="text-xl text-center h-14 w-16 p-0 border-0 border-b-2 rounded-none bg-transparent focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0" />
            <span className="text-xl text-muted-foreground">/</span>
            <Input ref={yearRef} placeholder={t.yearPlaceholder} maxLength={4} value={year} onChange={(e) => handleDateChange(e, setYear, 'year')} disabled={disabled} inputMode="numeric" className="text-xl text-center h-14 w-24 p-0 border-0 border-b-2 rounded-none bg-transparent focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0" />
        </div>
    )
}

function calculateAge(dateString: string | Date): number | null {
    if (!dateString) return null;
    const birthDate = new Date(dateString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

export default function ProfileCompletionForm() {
  const router = useRouter();
  const { toast } = useToast();
  const t = langTr.signup;
  const { user } = useUser();
  const [step, setStep] = useState(0);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ageStatus, setAgeStatus] = useState<'valid' | 'invalid' | 'unknown'>('unknown');
  
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);

  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [distanceValue, setDistanceValue] = useState(80);

  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(() => getInitialImageSlots(user));

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      lookingFor: "",
      images: [],
      distancePreference: 80,
      interests: [],
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (user) {
        form.setValue('name', user.displayName || '');
        // Clear initial images to respect user's choice
        setImageSlots(getInitialImageSlots());
        form.setValue('images', [], { shouldValidate: true });
    }
  }, [user, form]);
  
  const handleDateOfBirthChange = (date: Date) => {
    form.setValue('dateOfBirth', date, { shouldValidate: true });
    
    if (isNaN(date.getTime())) {
        setAgeStatus('unknown');
        return;
    }

    const age = calculateAge(date);
    if(age === null) {
        setAgeStatus('unknown');
        return;
    }

    if (age >= 18) {
        setAgeStatus('valid');
        const maxAge = age < 34 ? 34 : 80;
        form.setValue('ageRange', { min: age, max: maxAge });
    } else {
        setAgeStatus('invalid');
    }
};

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
        
        try {
          const response = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
          if(response.ok) {
            const data = await response.json();
            if (data.address) {
              form.setValue('address', data.address);
            }
          }
        } catch (e) {
          console.warn("Could not get address from geocode API, continuing without it.");
        }

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
        }
        setLocationError(message);
        setLocationStatus('error');
        setIsLocationLoading(false);
      }
    );
  };
  
  const uploadedImageCount = useMemo(() => imageSlots.filter(p => p.preview).length, [imageSlots]);


  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => {
    if (step === 0) router.push('/'); 
    else setStep((prev) => prev - 1);
  };

  async function onSubmit(data: SignupFormValues) {
    if (!firestore || !user) {
      toast({ title: t.common.error, description: t.errors.dbConnectionError, variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      
      const userProfileData = {
        ...data,
        uid: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
        fullName: data.name,
        dateOfBirth: data.dateOfBirth.toISOString(),
        images: data.images,
        profilePicture: data.images.length > 0 ? data.images[0].url : '',
        globalModeEnabled: true, 
        expandAgeRange: true,
        isBot: false,
      };

      await setDoc(doc(firestore, "users", user.uid), userProfileData, { merge: true });
      
      router.push('/kurallar');

    } catch (error: any) {
      console.error("Signup error:", error);
      toast({ title: "Profil Tamamlama Başarısız", description: error.message || "Bir hata oluştu", variant: "destructive" });
      setIsSubmitting(false);
    }
  }
  
  const totalSteps = 8;
  const progressValue = (step / totalSteps) * 100;

  const handleImageUpload = async (file: File, slotIndex: number) => {
    
    setImageSlots(prev => {
        const newSlots = [...prev];
        newSlots[slotIndex] = { ...newSlots[slotIndex], file, preview: URL.createObjectURL(file), isUploading: true };
        return newSlots;
    });

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
             method: 'POST',
             body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Yükleme başarısız');
        }
        const result = await response.json();

        setImageSlots(prev => {
            const newSlots = [...prev];
            newSlots[slotIndex] = { ...newSlots[slotIndex], isUploading: false, public_id: result.public_id, preview: result.url, file: null };
            
            // Update react-hook-form state
            const currentImages = form.getValues('images') || [];
            const updatedImages = [...currentImages];
            const existingIndex = updatedImages.findIndex(img => img.url === newSlots[slotIndex].preview); // Should be -1 for new
            if (existingIndex !== -1) {
              updatedImages[existingIndex] = { url: result.url, public_id: result.public_id };
            } else {
              updatedImages[slotIndex] = { url: result.url, public_id: result.public_id };
            }
             form.setValue('images', updatedImages.filter(Boolean), { shouldValidate: true });
            
            return newSlots;
        });

    } catch (error: any) {
        toast({ title: t.errors.uploadFailed.replace('{fileName}', file.name), description: error.message, variant: "destructive" });
        setImageSlots(prev => prev.map((s, i) => i === slotIndex ? { file: null, preview: null, isUploading: false, public_id: null } : s));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const slotIndexStr = fileInputRef.current?.getAttribute('data-slot-index');
    const slotIndex = slotIndexStr ? parseInt(slotIndexStr, 10) : -1;

    if (file && slotIndex !== -1) {
        handleImageUpload(file, slotIndex);
    }

    // Reset file input to allow re-uploading the same file
    if (e.target) e.target.value = '';
  };
  
  const openFilePicker = (index: number) => {
      if(isSubmitting) return;
      fileInputRef.current?.setAttribute('data-slot-index', String(index));
      fileInputRef.current?.click();
  };
  
  const handleDeleteImage = async (e: React.MouseEvent, index: number) => {
      e.stopPropagation(); 
      if(isSubmitting) return;
      
      const slotToDelete = imageSlots[index];

      if(slotToDelete.public_id && !slotToDelete.public_id.startsWith('google_')){
        try {
            await fetch('/api/delete-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ public_id: slotToDelete.public_id }),
            });
        } catch(err){
            console.error("Failed to delete from Cloudinary but proceeding in UI", err);
        }
      }

      // Update UI state
      const newSlots = [...imageSlots];
      newSlots[index] = { file: null, preview: null, isUploading: false, public_id: null };

      // Shift remaining items to fill the gap
      const filledSlots = newSlots.filter(s => s.preview);
      const emptySlots = Array.from({ length: 6 - filledSlots.length }, () => ({ file: null, preview: null, isUploading: false, public_id: null }));
      
      const finalSlots = [...filledSlots, ...emptySlots];
      setImageSlots(finalSlots);
      
      // Update form state
      const newImagesForForm = finalSlots
        .filter(slot => slot.preview)
        .map(slot => ({ url: slot.preview!, public_id: slot.public_id! }));
        
      form.setValue('images', newImagesForForm, { shouldValidate: true });
  }
  
  const handleDistanceChange = (value: number[]) => {
      const newDistance = value[0];
      setDistanceValue(newDistance);
      form.setValue('distancePreference', newDistance, { shouldValidate: true });
  };
  
  const handleInterestToggle = (interest: string, categoryOptions: string[]) => {
    const currentInterests = form.getValues('interests') || [];
    const interestsInCategory = currentInterests.filter(i => categoryOptions.includes(i));

    if (currentInterests.includes(interest)) {
      form.setValue('interests', currentInterests.filter(i => i !== interest), { shouldValidate: true });
    } else {
      if (interestsInCategory.length < 2) {
        form.setValue('interests', [...currentInterests, interest], { shouldValidate: true });
      } else {
        toast({
          title: "Limit Aşıldı",
          description: `Bu kategoriden en fazla 2 ilgi alanı seçebilirsin.`,
          variant: 'destructive',
        });
      }
    }
  };


  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormValues) | (keyof SignupFormValues)[] | undefined;

    switch (step) {
      case 0: fieldsToValidate = 'name'; break;
      case 1: fieldsToValidate = 'location'; break;
      case 2: fieldsToValidate = 'images'; break;
      case 3: fieldsToValidate = 'interests'; break;
      case 4: fieldsToValidate = 'dateOfBirth'; break;
      case 5: fieldsToValidate = 'gender'; break;
      case 6: fieldsToValidate = 'lookingFor'; break;
      case 7: fieldsToValidate = 'distancePreference'; break;
      case totalSteps: // The final confirmation step
        await form.trigger(); // Validate all fields before final submission
        if(form.formState.isValid) {
            onSubmit(form.getValues());
        }
        return; // Don't call nextStep()
    }
    
    if (fieldsToValidate) {
        const isValid = await form.trigger(Array.isArray(fieldsToValidate) ? fieldsToValidate : [fieldsToValidate]);
        if (isValid) {
          nextStep();
        }
    } else {
        nextStep();
    }
  };

  const isGoogleUser = user?.providerData.some(p => p.providerId === 'google.com');
  
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
       <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={prevStep} disabled={isSubmitting}>
            <ArrowLeft className="h-6 w-6" />
        </Button>
        <Progress value={progressValue} className="h-2 flex-1" />
        <div className="w-9 h-9" />
      </header>
      
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col p-6 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
               <div className="relative text-center mb-6 flex items-center justify-center gap-3">
                {isGoogleUser && (
                  <Image src={googleLogo} alt="Google logo" width={24} height={24} />
                )}
                 <h1 className="text-3xl font-bold">Profilini Tamamla</h1>
               </div>

              {step === 0 && (
                <>
                  <h1 className="text-3xl font-bold">{t.step2.title}</h1>
                  <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                          <FormControl>
                          <Input placeholder={t.step2.placeholder} className="border-0 border-b-2 rounded-none px-0 text-xl h-auto focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 bg-transparent" {...field} />
                          </FormControl>
                          <FormLabel className="text-muted-foreground">{t.step2.label}</FormLabel>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                </>
              )}
              {step === 1 && (
                 <div className="flex flex-col items-center justify-center text-center h-full gap-6">
                    <MapPin className="w-20 h-20 text-primary" />
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
                         <div className="flex flex-col items-center gap-2 text-destructive">
                           <XCircle className="w-12 h-12" />
                           <p className="font-semibold text-lg">{locationError}</p>
                           <Button type="button" onClick={handleLocationRequest} variant="outline" className="mt-4">Tekrar Dene</Button>
                        </div>
                    )}
                 </div>
              )}
              {step === 2 && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="shrink-0">
                    <h1 className="text-3xl font-bold">{t.step12.title}</h1>
                    <div className="flex items-center gap-4 mt-2">
                      <div
                        className="relative flex items-center justify-center"
                        style={{ width: 40, height: 40 }}
                      >
                        <Icons.logo width={40} height={40} className="animate-pulse" style={{ animationDuration: '3s' }} />
                        <span className="absolute text-xs font-bold text-primary">{Math.round((uploadedImageCount / 6) * 100)}%</span>
                      </div>
                      <p className="text-muted-foreground flex-1">{t.step12.description.replace("{count}", String(uploadedImageCount))}</p>
                    </div>
                     <FormMessage className="pt-2">{form.formState.errors.images?.message}</FormMessage>
                  </div>
                  <div className="flex-1 overflow-y-auto -mr-6 pr-5 pt-6">
                    <div className="grid grid-cols-3 gap-4">
                      {imageSlots.map((slot, index) => (
                        <div key={index} className="relative aspect-square">
                          <div onClick={() => openFilePicker(index)} className="cursor-pointer w-full h-full border-2 border-dashed bg-card rounded-lg flex items-center justify-center relative overflow-hidden transition-colors hover:bg-muted">
                            {slot.preview ? (
                              <>
                                <Image src={slot.preview} alt={`Preview ${index}`} fill style={{ objectFit: "cover" }} className="rounded-lg" />
                                {slot.isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Icons.logo width={48} height={48} className="animate-pulse" /></div>}
                                {!isSubmitting && (
                                  <div className="absolute bottom-2 right-2 flex gap-2">
                                    <button type="button" onClick={(e) => {e.stopPropagation(); openFilePicker(index);}} className="h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"><Pencil className="w-4 h-4" /></button>
                                    {uploadedImageCount > 2 && <button type="button" onClick={(e) => handleDeleteImage(e, index)} className="h-8 w-8 rounded-full bg-red-600/80 text-white flex items-center justify-center hover:bg-red-600"><Trash2 className="w-4 h-4" /></button>}
                                  </div>
                                )}
                              </>
                            ) : (
                                <div className="text-center text-muted-foreground p-2 flex flex-col items-center justify-center gap-2">
                                  <span className="text-xs font-medium block">Fotoğraf ekle</span>
                                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Plus className="w-5 h-5" /></div>
                                </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
              )}
               {step === 3 && (
                <div className="flex-1 flex flex-col min-h-0">
                    <FormField
                        control={form.control}
                        name="interests"
                        render={({ field }) => (
                            <FormItem className="flex-1 flex flex-col min-h-0">
                                <div className="shrink-0">
                                    <h1 className="text-3xl font-bold">{t.step11.title}</h1>
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
                                            <AccordionTrigger>
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
                                                    onClick={() => handleInterestToggle(interest, category.options)}
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
                                <p className="text-center text-sm text-muted-foreground pt-4">Bunu daha sonra ayarlarınızda değiştirebilirsiniz.</p>
                            </FormItem>
                        )}
                    />
                </div>
              )}
              {step === 4 && (
                <>
                  <h1 className="text-3xl font-bold">{t.step3.title}</h1>
                  <Controller control={form.control} name="dateOfBirth" render={({ field, fieldState }) => (
                      <FormItem className="pt-8">
                        <FormControl>
                          <DateInput value={field.value} onChange={handleDateOfBirthChange} disabled={field.disabled} t={t.step3} />
                        </FormControl>
                        <FormLabel className="text-muted-foreground pt-2 block">{t.step3.label}</FormLabel>
                        <FormDescription>Doğum tarihinizi yalnızca bir kez ayarlayabilirsiniz ve bu daha sonra değiştirilemez.</FormDescription>
                         {ageStatus === 'valid' && <div className="flex items-center text-green-600 mt-2"><CheckCircle className="mr-2 h-5 w-5" /><p>{t.step3.ageConfirm}</p></div>}
                         {ageStatus === 'invalid' && <div className="flex items-center text-red-600 mt-2"><XCircle className="mr-2 h-5 w-5" /><p>{t.step3.ageError}</p></div>}
                         {fieldState.error && ageStatus !== 'invalid' && <FormMessage>{fieldState.error.message}</FormMessage>}
                      </FormItem>
                    )}
                  />
                </>
              )}
              {step === 5 && (
                <>
                  <h1 className="text-3xl font-bold">{t.step4.title}</h1>
                  <FormField control={form.control} name="gender" render={({ field }) => (
                      <FormItem className="space-y-4 pt-8">
                        <FormControl>
                          <div className="space-y-3">
                            <Button type="button" variant={field.value === 'female' ? 'default' : 'outline'} className="w-full h-14 rounded-full text-lg" onClick={() => field.onChange('female')}>{t.step4.woman}</Button>
                            <Button type="button" variant={field.value === 'male' ? 'default' : 'outline'} className="w-full h-14 rounded-full text-lg" onClick={() => field.onChange('male')}>{t.step4.man}</Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {step === 6 && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="shrink-0">
                    <h1 className="text-3xl font-bold">{t.step5.title}</h1>
                    <p className="text-muted-foreground">{t.step5.label}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto -mr-6 pr-6 pt-4">
                  <FormField control={form.control} name="lookingFor" render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <div className="grid grid-cols-2 gap-3">
                            {t.step5.options.map((option: {id: string, label: string}, index: number) => {
                              const Icon = lookingForOptions[index].icon;
                              const isSelected = field.value === option.id;
                              return (
                                <button key={option.id} type="button" onClick={() => field.onChange(option.id)} className={`p-4 border rounded-lg flex flex-col items-center justify-center gap-2 transition-colors aspect-square ${isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
                                  <Icon className="w-8 h-8" />
                                  <span className="text-sm font-semibold text-center">{option.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>
                </div>
              )}
              {step === 7 && (
                <div className="flex flex-col h-full">
                    <div className="shrink-0">
                        <h1 className="text-3xl font-bold">{t.step7.title}</h1>
                        <p className="text-muted-foreground">{t.step7.description}</p>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-8">
                        <div className="flex justify-between items-baseline">
                            <FormLabel className="text-base">Mesafe Tercihi</FormLabel>
                            <span className="text-xl font-bold text-foreground">{distanceValue} Km</span>
                        </div>
                        <Controller
                            name="distancePreference"
                            control={form.control}
                            render={({ field }) => (
                                <Slider
                                    defaultValue={[field.value || 80]}
                                    max={160}
                                    min={1}
                                    step={1}
                                    onValueChange={handleDistanceChange}
                                    className="w-full"
                                />
                            )}
                        />
                         <p className="text-center text-sm text-muted-foreground">{t.step7.info}</p>
                    </div>
                     <FormMessage>{form.formState.errors.distancePreference?.message}</FormMessage>
                </div>
              )}
              {step === 8 && (
                 <div className="flex flex-col items-center justify-center text-center h-full gap-6">
                    <Globe className="w-20 h-20 text-primary" />
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold">Hazırsın!</h1>
                      <p className="text-muted-foreground max-w-sm">
                        Küresel mod açık olarak başlayacaksın. Bu, dünyanın her yerinden insanları görmeni sağlar. Bu ayarı daha sonra Tercihler menüsünden istediğin zaman değiştirebilirsin.
                      </p>
                    </div>
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
                (step === 1 && locationStatus !== 'success') ||
                (step === 2 && uploadedImageCount < 2) ||
                (step === 3 && (form.getValues('interests')?.length ?? 0) < 10) ||
                (step === 4 && ageStatus !== 'valid')
              }
            >
              {isSubmitting ? <Icons.logo width={24} height={24} className="animate-pulse" /> : (step === totalSteps ? "Onayla ve Bitir" : t.common.next)}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

    