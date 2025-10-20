
'use client';

import { useState, useMemo, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
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
import { ArrowLeft, CheckCircle, XCircle, Plus, Trash2, Pencil, MapPin, Star, Mail, Lock, Eye, EyeOff, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { langTr } from "@/languages/tr";
import Image from "next/image";
import { Icons } from "@/components/icons";
import type { UserImage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import * as LucideIcons from 'lucide-react';
import { cn } from "@/lib/utils";


const formSchema = z.object({
    email: z.string().email({ message: langTr.signup.errors.form.email }),
    password: z.string().min(6, { message: langTr.signup.errors.form.password }),
    confirmPassword: z.string().min(6, { message: "Onay şifresi en az 6 karakter olmalıdır."}),
    name: z.string()
      .min(2, { message: "İsim en az 2 karakter olmalıdır." })
      .max(14, { message: "İsim en fazla 14 karakter olabilir." })
      .regex(/^[a-zA-Z\sçÇğĞıİöÖşŞüÜ]+$/, { message: "İsim sadece harf içerebilir." }),
    images: z.array(z.object({
        url: z.string(),
        public_id: z.string(),
    })).min(1, { message: "En az 1 fotoğraf yüklemelisin." }),
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

type ImageSlot = {
    file: File | null;
    preview: string | null;
    public_id?: string | null;
    isUploading: boolean;
};

const getInitialImageSlots = (): ImageSlot[] => {
    return Array.from({ length: 10 }, () => ({ file: null, preview: null, public_id: null, isUploading: false }));
};

type IconName = keyof Omit<typeof LucideIcons, 'createLucideIcon' | 'LucideIcon'>;
const interestCategories = langTr.signup.step11.categories;

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const t = langTr.signup;
  const { auth, firestore, storage } = useFirebase();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);

  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(getInitialImageSlots);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedImageCount = useMemo(() => imageSlots.filter(p => p.preview).length, [imageSlots]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: "",
      images: [],
      interests: [],
    },
    mode: "onChange",
  });

   useEffect(() => {
    const finalImages = imageSlots
        .filter(p => p.preview && p.public_id && !p.isUploading)
        .map(p => ({ url: p.preview!, public_id: p.public_id! }));
    form.setValue('images', finalImages, { shouldValidate: true });
  }, [uploadedImageCount, imageSlots, form]);
  
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
  
  const handleFileSelect = (index: number) => {
    if(isSubmitting) return;
    fileInputRef.current?.setAttribute('data-slot-index', String(index));
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const slotIndexStr = fileInputRef.current?.getAttribute('data-slot-index');
    const slotIndex = slotIndexStr ? parseInt(slotIndexStr) : -1;

    if (slotIndex === -1) return;
    if (!storage) {
        toast({ title: "Hata", description: "Depolama servisi başlatılamadı.", variant: "destructive" });
        return;
    }

    setImageSlots(prev => {
        const newSlots = [...prev];
        newSlots[slotIndex] = { file, preview: URL.createObjectURL(file), isUploading: true, public_id: null };
        return newSlots;
    });

    const email = form.getValues('email');
    const tempId = email ? email.replace(/[^a-zA-Z0-9]/g, '_') : `temp_${Date.now()}`;
    const uniqueFileName = `bematch_profiles/${tempId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const imageRef = storageRef(storage, uniqueFileName);

    try {
        const snapshot = await uploadBytes(imageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        const updatedSlots = [...imageSlots];
        updatedSlots[slotIndex] = { file: null, preview: downloadURL, public_id: uniqueFileName, isUploading: false };
        setImageSlots(updatedSlots);

        const finalImages = updatedSlots
          .filter(p => p.preview && p.public_id && !p.isUploading)
          .map(p => ({ url: p.preview!, public_id: p.public_id! }));
        form.setValue('images', finalImages, { shouldValidate: true });

    } catch (error: any) {
        toast({ title: t.errors.uploadFailed.replace('{fileName}', file.name), description: error.message, variant: "destructive" });
        // Revert UI on failure
        setImageSlots(prev => prev.map((s, i) => i === slotIndex ? getInitialImageSlots()[i] : s));
    } finally {
        if (e.target) e.target.value = ''; // Reset file input
    }
  };


  const handleDeleteImage = async (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      if(isSubmitting || !storage) return;

      const slotToDelete = imageSlots[index];
      if (slotToDelete.public_id) {
          try {
              const imageRef = storageRef(storage, slotToDelete.public_id);
              await deleteObject(imageRef);
          } catch (err: any) {
                // If object does not exist, we can ignore, otherwise it's a problem.
                if (err.code !== 'storage/object-not-found') {
                  console.error("Failed to delete from Firebase Storage but proceeding in UI", err);
                  return; // Optionally stop the UI update if delete fails
                }
          }
      }
      
      // Update UI regardless of storage deletion outcome for better UX
      setImageSlots(prevSlots => {
          const newSlots = [...prevSlots];
          if (newSlots[index].preview && newSlots[index].file) {
                // Revoke object URL to free memory if it's a local preview
                URL.revokeObjectURL(newSlots[index].preview!);
          }
          newSlots[index] = { file: null, preview: null, public_id: null, isUploading: false };
          // Re-sort the array so empty slots are at the end
          const filledSlots = newSlots.filter(s => s.preview);
          const emptySlots = newSlots.filter(s => !s.preview);
          return [...filledSlots, ...emptySlots];
      });
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
        
        const finalImages = data.images;

        await updateProfile(currentUser, { displayName: data.name, photoURL: finalImages.length > 0 ? finalImages[0].url : '' });
        
        const userProfileData = {
            uid: currentUser.uid,
            email: data.email,
            fullName: data.name,
            interests: data.interests,
            images: finalImages,
            location: data.location,
            address: null,
            profilePicture: finalImages.length > 0 ? finalImages[0].url : '',
            createdAt: serverTimestamp(),
            dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 25)).toISOString(), // Default age 25
            gender: 'male', // Default gender
            genderPreference: 'female',
            lookingFor: 'whatever',
            ageRange: {min: 18, max: 40},
            globalModeEnabled: true, // Global mode is ON by default for new users
            expandAgeRange: true,
            isBot: false,
            rulesAgreed: false,
        };
        
        await setDoc(doc(firestore, "users", currentUser.uid), userProfileData);
        router.push('/kurallar');

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
  
  const totalSteps = 6;
  const progressValue = ((step + 1) / totalSteps) * 100;

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormValues) | (keyof SignupFormValues)[] | undefined;
    let isValid = true;
    
    switch (step) {
      case 0: fieldsToValidate = ['email', 'password', 'confirmPassword']; break;
      case 1: fieldsToValidate = 'interests'; break;
      case 2: fieldsToValidate = 'location'; break;
      case 3: fieldsToValidate = 'name'; break;
      case 4: fieldsToValidate = 'images'; break;
      case 5: // Summary step, no validation needed before submitting
        await form.trigger();
        if (form.formState.isValid) {
            onSubmit(form.getValues());
        } else {
            const firstErrorField = Object.keys(form.formState.errors)[0] as keyof SignupFormValues;
            const errorStepMap: { [key in keyof SignupFormValues]?: number } = {
                'email': 0, 'password': 0, 'confirmPassword': 0,
                'interests': 1,
                'location': 2,
                'name': 3,
                'images': 4,
            };
            const stepWithError = errorStepMap[firstErrorField];
            if (stepWithError !== undefined) {
                setStep(stepWithError);
                toast({
                    title: "Form Eksik",
                    description: 'Lütfen tüm adımlardaki bilgileri doğru bir şekilde doldurun.',
                    variant: "destructive"
                });
            }
        }
        return;
    }
    
    if (fieldsToValidate) {
        isValid = await form.trigger(fieldsToValidate);
        if (isValid) {
          nextStep();
        }
    } else {
        nextStep();
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
    <div className="flex h-dvh flex-col animated-gradient-bg text-white">
       <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-white/20 bg-transparent px-4">
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
                  <p className="text-white/80 mt-2">Maceraya başlamak için e-posta ve şifreni belirle.</p>
                  <div className="space-y-6 mt-8">
                     <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>E-posta Adresin</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                                    <Input type="email" placeholder="E-posta adresini gir" className="pl-10 h-12 bg-white/10 border-white/30 placeholder:text-white/60 focus:ring-white/80" {...field} />
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
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                                    <Input type={showPassword ? 'text' : 'password'} placeholder="Şifreni oluştur" className="pl-10 pr-10 h-12 bg-white/10 border-white/30 placeholder:text-white/60 focus:ring-white/80" {...field} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {showPassword ? <EyeOff className="h-5 w-5 text-white/60" /> : <Eye className="h-5 w-5 text-white/60" />}
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
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                                    <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Şifreni tekrar gir" className="pl-10 pr-10 h-12 bg-white/10 border-white/30 placeholder:text-white/60 focus:ring-white/80" {...field} />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5 text-white/60" /> : <Eye className="h-5 w-5 text-white/60" />}
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
                    <FormField
                        control={form.control}
                        name="interests"
                        render={({ field }) => (
                            <FormItem className="flex-1 flex flex-col min-h-0">
                                <div className="shrink-0">
                                    <h1 className="text-3xl font-bold">{t.step11.title}</h1>
                                    <p className="text-white/80">
                                        {t.step11.description.replace('{count}', String(field.value.length))}
                                    </p>
                                    <FormMessage className="pt-2" />
                                </div>
                                <div className="flex-1 overflow-y-auto -mr-6 pr-6 pt-4">
                                    <Accordion type="multiple" defaultValue={interestCategories.map(c => c.title)} className="w-full">
                                        {interestCategories.map((category) => {
                                        const Icon = LucideIcons[category.icon as IconName] as React.ElementType || LucideIcons.Sparkles;
                                        return (
                                            <AccordionItem value={category.title} key={category.title} className="border-white/20">
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
                    <MapPin className="w-20 h-20 text-white" />
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold">{t.step6.title}</h1>
                      <p className="text-white/80">{t.step6.description}</p>
                    </div>
                    {locationStatus === 'idle' && (
                        <Button type="button" onClick={handleLocationRequest} disabled={isLocationLoading} size="lg" className="rounded-full bg-white text-red-600 hover:bg-gray-200">
                            {isLocationLoading && <Icons.logo width={24} height={24} className="mr-2 animate-pulse" />}
                            {isLocationLoading ? langTr.ayarlarKonum.updatingButton : t.step6.button}
                        </Button>
                    )}
                    {locationStatus === 'success' && (
                        <div className="flex flex-col items-center gap-2 text-green-400">
                           <CheckCircle className="w-12 h-12" />
                           <p className="font-semibold text-lg">Konum Başarıyla Alındı!</p>
                        </div>
                    )}
                    {locationStatus === 'error' && (
                         <div className="flex flex-col items-center gap-2 text-red-400">
                           <XCircle className="w-12 h-12" />
                           <p className="font-semibold text-lg">{locationError}</p>
                           <Button type="button" onClick={handleLocationRequest} variant="outline" className="mt-4 bg-transparent text-white border-white hover:bg-white/10">Tekrar Dene</Button>
                        </div>
                    )}
                    <FormMessage>{form.formState.errors.location?.message}</FormMessage>
                 </div>
              )}
               {step === 3 && (
                <>
                  <h1 className="text-3xl font-bold">{t.step2.title}</h1>
                  <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem className="mt-8">
                          <FormControl>
                          <Input placeholder={t.step2.placeholder} className="border-0 border-b-2 border-white/50 rounded-none px-0 text-2xl h-auto focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 bg-transparent placeholder:text-white/50" {...field} />
                          </FormControl>
                          <FormLabel className="text-white/80">{t.step2.label}</FormLabel>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                </>
              )}
              {step === 4 && (
                <div className="flex-1 flex flex-col min-h-0">
                    <FormField
                      control={form.control}
                      name="images"
                      render={() => (
                        <FormItem className="flex-1 flex flex-col min-h-0">
                          <div className="shrink-0">
                            <h1 className="text-3xl font-bold">Fotoğraflarını Ekle</h1>
                            <p className="text-white/80">
                              Profilinde en az 1 fotoğraf olmalı.
                            </p>
                             <div className="space-y-2 mt-4">
                                <FormMessage />
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto pt-4 -mr-6 pr-6">
                            <div className="grid grid-cols-2 gap-4">
                                {imageSlots.map((slot, index) => (
                                    <div key={index} className="relative aspect-[3/4]">
                                        <div onClick={() => handleFileSelect(index)} className={cn("cursor-pointer w-full h-full border-2 border-dashed border-white/50 bg-white/10 rounded-lg flex items-center justify-center relative overflow-hidden transition-colors hover:bg-white/20 group", slot.preview && "border-solid border-white/30")}>
                                            {slot.preview ? (
                                                <>
                                                    <Image src={slot.preview} alt={'Önizleme ' + index} fill style={{ objectFit: "cover" }} className="rounded-lg" />
                                                    {slot.isUploading && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                           <Icons.logo width={48} height={48} className="animate-pulse" />
                                                        </div>
                                                    )}
                                                    {index === 0 && (
                                                        <Badge className="absolute top-2 left-2 z-10 bg-primary/80 backdrop-blur-sm gap-1.5 border-none">
                                                            <Star className="w-3 h-3"/>
                                                            Profil Fotoğrafı
                                                        </Badge>
                                                    )}
                                                    {!isSubmitting && !slot.isUploading && (
                                                        <div className="absolute bottom-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                            <button type="button" onClick={(e) => {e.stopPropagation(); handleFileSelect(index);}} className="h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 backdrop-blur-sm"><Pencil className="w-4 h-4" /></button>
                                                            {uploadedImageCount > 0 && <button type="button" onClick={(e) => handleDeleteImage(e, index)} className="h-8 w-8 rounded-full bg-red-600/80 text-white flex items-center justify-center hover:bg-red-600 backdrop-blur-sm"><Trash2 className="w-4 h-4" /></button>}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-center text-white/70 p-2 flex flex-col items-center justify-center gap-2">
                                                    <div className='h-12 w-12 rounded-full flex items-center justify-center bg-white/20 text-white'>
                                                        <Plus className="w-8 h-8" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                          </div>
                        </FormItem>
                      )}
                    />
                </div>
              )}
               {step === 5 && (
                 <div className="flex flex-col items-center justify-center text-center h-full gap-6">
                    <h1 className="text-3xl font-bold">Hesap Özeti</h1>
                    <p className="text-white/80 max-w-sm">
                      Bilgilerini kontrol et. Her şey doğruysa, maceraya başlamak için onayla.
                    </p>
                    <div className="w-full max-w-sm text-left bg-white/10 p-4 rounded-lg space-y-2 text-sm">
                        <p><strong>İsim:</strong> {form.getValues('name')}</p>
                        <p><strong>E-posta:</strong> {form.getValues('email')}</p>
                        <p><strong>İlgi Alanları:</strong> {form.getValues('interests').slice(0,3).join(', ')}...</p>
                        <p><strong>Fotoğraf Sayısı:</strong> {form.getValues('images').length}</p>
                    </div>
                 </div>
              )}
            </div>

          <div className="shrink-0 pt-6">
            <Button
              type="button"
              onClick={handleNextStep}
              className="w-full h-14 rounded-full text-lg font-bold bg-white text-red-600 hover:bg-gray-200"
              disabled={
                isSubmitting ||
                (step === 1 && (form.getValues('interests')?.length ?? 0) < 5) ||
                (step === 2 && locationStatus !== 'success') ||
                (step === 4 && uploadedImageCount < 1)
              }
            >
              {isSubmitting ? <Icons.logo width={24} height={24} className="animate-pulse" /> : (step === 5 ? "Onayla ve Bitir" : t.common.next)}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
