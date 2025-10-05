
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { useAuth, useFirestore, useUser } from "@/firebase";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Heart, GlassWater, Users, Briefcase, Sparkles, Hand, MapPin, Cigarette, Dumbbell, PawPrint, MessageCircle, GraduationCap, Moon, Eye, EyeOff, Tent, Globe, DoorOpen, Home, Music, Gamepad2, Sprout, Clapperboard, Paintbrush, Plus, Camera, Trash2, Pencil, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { langTr } from "@/languages/tr";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import CircularProgress from "./circular-progress";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    dateOfBirth: z.date().max(eighteenYearsAgo, { message: "You must be at least 18 years old." })
        .refine(date => !isNaN(date.getTime()), { message: "Please enter a valid date." }),
    gender: z.enum(['male', 'female'], { required_error: "Please select your gender." }),
    lookingFor: z.string({ required_error: "Please choose one." }).min(1, { message: "Please choose one." }),
    location: z.object({
        latitude: z.number().nullable(),
        longitude: z.number().nullable(),
    }).optional(),
    address: z.object({
        country: z.string().optional(),
        state: z.string().optional(),
        city: z.string().optional(),
    }).refine(data => data.country && data.state, {
        message: "Country and state are required.",
        path: ["country"], // you can decide where to show the error
    }),
    distancePreference: z.number().min(1).max(100).default(80),
    school: z.string().optional(),
    drinking: z.string({ required_error: "Please choose one." }).min(1),
    smoking: z.string({ required_error: "Please choose one." }).min(1),
    workout: z.string({ required_error: "Please choose one." }).min(1),
    pets: z.array(z.string()).min(1, { message: 'Please choose one.'}),
    communicationStyle: z.string({ required_error: "Please choose one." }).min(1),
    loveLanguage: z.string({ required_error: "Please choose one." }).min(1),
    educationLevel: z.string({ required_error: "Please choose one." }).min(1),
    zodiacSign: z.string({ required_error: "Please choose one." }).min(1),
    interests: z.array(z.string()).min(1).max(10, { message: 'You can select up to 10 interests.'}),
    photos: z.array(z.string().url()).min(2, {message: 'You must upload at least 2 photos.'}).max(6),
    uid: z.string().optional(),
    email: z.string().email(),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional(),
});

type SignupFormValues = z.infer<typeof formSchema>;


const lookingForOptions = [
    { id: 'long-term', icon: Heart },
    { id: 'short-term', icon: GlassWater },
    { id: 'friends', icon: Users },
    { id: 'casual', icon: Briefcase },
    { id: 'not-sure', icon: Sparkles },
    { id: 'whatever', icon: Hand },
];

const interestIcons: { [key: string]: React.ElementType } = {
  Tent,
  Globe,
  DoorOpen,
  Home,
  Sparkles,
  Music,
  Gamepad2,
  Sprout,
  MessageCircle,
  Dumbbell,
  Clapperboard,
  Paintbrush
};

type PhotoSlot = {
    file: File | null;
    preview: string | null;
    progress: number;
    isUploading: boolean;
};


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
            if (val.length > 0 && parseInt(val.charAt(0)) > 3) {
                // do nothing
            } else if (val.length > 1 && parseInt(val) > 31) {
                // do nothing
            } else {
              setDay(val);
              newDay = val;
              if (val.length === 2) monthRef.current?.focus();
            }
        } else if (field === 'month') {
             if (val.length > 0 && parseInt(val.charAt(0)) > 1) {
                // do nothing
            } else if (val.length > 1 && parseInt(val) > 12) {
                // do nothing
            } else {
              setMonth(val);
              newMonth = val;
              if (val.length === 2) yearRef.current?.focus();
            }
        } else {
            setYear(val);
            newYear = val;
        }

        if (newDay.length === 2 && newMonth.length === 2 && newYear.length === 4) {
            const date = new Date(`${newYear}-${newMonth}-${newDay}`);
            if (!isNaN(date.getTime()) && date.getDate() === parseInt(newDay) && date.getMonth() + 1 === parseInt(newMonth)) {
                onChange(date);
            } else {
                onChange(new Date('invalid'));
            }
        } else {
            onChange(new Date('invalid')); // Also trigger invalid for incomplete dates
        }
    };
    
    return (
        <div className="flex items-center gap-2">
            <Input
                ref={dayRef}
                placeholder={t.dayPlaceholder}
                maxLength={2}
                value={day}
                onChange={(e) => handleDateChange(e, setDay, 'day')}
                disabled={disabled}
                inputMode="numeric"
                className="text-xl text-center h-14 w-16 p-0 border-0 border-b-2 rounded-none bg-transparent focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
            />
            <span className="text-xl text-muted-foreground">/</span>
            <Input
                ref={monthRef}
                placeholder={t.monthPlaceholder}
                maxLength={2}
                value={month}
                onChange={(e) => handleDateChange(e, setMonth, 'month')}
                disabled={disabled}
                inputMode="numeric"
                className="text-xl text-center h-14 w-16 p-0 border-0 border-b-2 rounded-none bg-transparent focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
            />
            <span className="text-xl text-muted-foreground">/</span>
            <Input
                ref={yearRef}
                placeholder={t.yearPlaceholder}
                maxLength={4}
                value={year}
                onChange={(e) => handleDateChange(e, setYear, 'year')}
                disabled={disabled}
                inputMode="numeric"
                className="text-xl text-center h-14 w-24 p-0 border-0 border-b-2 rounded-none bg-transparent focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
            />
        </div>
    )
}

export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const t = langTr;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);
  const [ageStatus, setAgeStatus] = useState<'valid' | 'invalid' | 'unknown'>('unknown');
  
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>();
  const [selectedState, setSelectedState] = useState<string | undefined>();
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  const auth = useAuth();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(
    Array.from({ length: 6 }, (_, i) => ({ file: null, preview: null, progress: 0, isUploading: false }))
  );
  
  const [step, setStep] = useState(0); 

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      gender: undefined,
      lookingFor: "",
      address: { country: undefined, state: undefined, city: undefined },
      distancePreference: 50,
      school: "",
      drinking: "",
      smoking: "",
      workout: "",
      pets: [],
      communicationStyle: "",
      loveLanguage: "",
      educationLevel: "",
      zodiacSign: "",
      interests: [],
      photos: [],
    },
    mode: "onChange",
  });

  useEffect(() => {
      setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    try {
        const googleDataString = sessionStorage.getItem('googleSignupData');
        if (googleDataString) {
            setIsGoogleSignup(true);
            setStep(1); // Start from name step
            const googleData = JSON.parse(googleDataString);
            form.setValue('email', googleData.email || '');
            form.setValue('name', googleData.name || '');
            form.setValue('uid', googleData.uid);
            
            if (googleData.profilePicture) {
                const initialSlots = [...photoSlots];
                initialSlots[0] = { file: null, preview: googleData.profilePicture, progress: 100, isUploading: false };
                setPhotoSlots(initialSlots);
                form.setValue('photos', [googleData.profilePicture], { shouldValidate: true });
            }
        }
    } catch (error) {
        console.error("Failed to parse Google signup data", error);
        router.push('/');
    }
  }, [form, router]);
  
  const handleDateOfBirthChange = (date: Date) => {
    form.setValue('dateOfBirth', date, { shouldValidate: true });
    if (isNaN(date.getTime())) {
        setAgeStatus('unknown');
        return;
    }
    const ageDifMs = Date.now() - date.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);

    if (age >= 18) {
        setAgeStatus('valid');
    } else {
        setAgeStatus('invalid');
    }
  };
  
  const currentName = form.watch("name");
  const currentAddress = form.watch("address");
  const lifestyleValues = form.watch(['drinking', 'smoking', 'workout', 'pets']);
  const moreInfoValues = form.watch(['communicationStyle', 'loveLanguage', 'educationLevel', 'zodiacSign']);
  const selectedInterests = form.watch('interests') || [];
  const uploadedPhotoCount = useMemo(() => photoSlots.filter(p => p.preview).length, [photoSlots]);

  const filledLifestyleCount = useMemo(() => {
    return lifestyleValues.filter((value, index) => {
        if (index === 3) {
            return Array.isArray(value) && value.length > 0;
        }
        return !!value;
    }).length;
  }, [lifestyleValues]);

  const filledMoreInfoCount = useMemo(() => {
    return moreInfoValues.filter(v => !!v).length;
  }, [moreInfoValues]);


  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => {
    if (step === 0) {
      router.push('/kurallar'); 
    } else if (step === 1 && isGoogleSignup) {
       router.push('/'); // If it was a Google signup, go back to welcome screen from step 1
    } else {
      setStep((prev) => prev - 1)
    }
  };

  async function onSubmit(data: SignupFormValues) {
    if (!firestore || !auth) {
      toast({ title: t.common.error, description: t.signup.errors.dbConnectionError, variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
        let userId = user?.uid;

        if (!userId) {
          if (!isGoogleSignup && data.email && data.password) {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            userId = userCredential.user.uid;
          } else if (data.uid) {
             userId = data.uid;
          } else {
            throw new Error("User ID could not be determined.");
          }
        }
        
      const filesToUpload = photoSlots.filter(p => p.file);
      setPhotoSlots(prev => prev.map(slot => filesToUpload.some(f => f.file === slot.file) ? { ...slot, isUploading: true } : slot));

      const uploadPromises = filesToUpload.map(slot => {
        const file = slot.file!;
        const formData = new FormData();
        formData.append('file', file);
        
        return new Promise<string>((resolve, reject) => {
            fetch('/api/upload', {
                method: 'POST',
                body: formData,
            }).then(response => {
                 if (!response.ok) {
                    return response.json().then(err => reject(new Error(err.error || t.signup.errors.uploadFailed.replace('{fileName}', file.name))));
                 }
                 return response.json();
            }).then(result => {
                setPhotoSlots(prev => prev.map(s => s.file === file ? { ...s, progress: 100, isUploading: false } : s));
                resolve(result.url);
            }).catch(error => {
                 setPhotoSlots(prev => prev.map(s => s.file === file ? { ...s, progress: 0, isUploading: false } : s));
                reject(error);
            });
        });
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      const existingUrls = photoSlots
        .filter(p => !p.file && p.preview)
        .map(p => p.preview!);

      const allPhotoUrls = [...existingUrls, ...uploadedUrls];

      const finalAddress = {
          country: Country.getCountryByCode(data.address.country!)?.name,
          state: State.getStateByCodeAndCountry(data.address.state!, data.address.country!)?.name,
          city: data.address.city
      }
      
      const stateDetails = State.getStateByCodeAndCountry(data.address.state!, data.address.country!);

      const userProfile = {
        uid: userId,
        fullName: data.name,
        email: data.email,
        dateOfBirth: data.dateOfBirth.toISOString(),
        gender: data.gender,
        lookingFor: data.lookingFor,
        distancePreference: data.distancePreference,
        school: data.school,
        lifestyle: {
          drinking: data.drinking,
          smoking: data.smoking,
          workout: data.workout,
          pets: data.pets,
        },
        moreInfo: {
            communicationStyle: data.communicationStyle,
            loveLanguage: data.loveLanguage,
            educationLevel: data.educationLevel,
            zodiacSign: data.zodiacSign,
        },
        interests: data.interests,
        images: allPhotoUrls,
        profilePicture: allPhotoUrls[0] || '',
        location: {
            latitude: stateDetails?.latitude || null,
            longitude: stateDetails?.longitude || null,
        },
        address: finalAddress,
      };

      await setDoc(doc(firestore, "users", userId), userProfile, { merge: true });
      
      sessionStorage.removeItem('googleSignupData');
    } catch (error: any) {
      console.error("Signup error:", error);
       let errorMessage = error.message || t.signup.errors.signupFailed;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "This email is already in use by another account.";
        }
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
      setPhotoSlots(prev => prev.map(s => ({ ...s, isUploading: false, progress: 0 })));
    }
  }
  
  const totalSteps = isGoogleSignup ? 9 : 10;
  const progressValue = (step / totalSteps) * 100;


  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeSlot !== null) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      const newSlots = [...photoSlots];
      newSlots[activeSlot] = { file, preview, progress: 0, isUploading: false };
      setPhotoSlots(newSlots);
      
      const newPhotos = newSlots.map(slot => slot.preview).filter((p): p is string => p !== null);
      form.setValue('photos', newPhotos, { shouldValidate: true });
    }
    setActiveSlot(null);
    e.target.value = ''; 
  };

  const openFilePicker = (index: number) => {
      if(isLoading) return;
      const targetIndex = photoSlots[index].preview ? index : uploadedPhotoCount;
      setActiveSlot(targetIndex);
      fileInputRef.current?.click();
  };
  
  const handleDeletePhoto = (e: React.MouseEvent, index: number) => {
      e.stopPropagation(); 
      if(isLoading) return;
      const newSlots = [...photoSlots];
      
      const deletedSlot = newSlots[index];
      if (deletedSlot.file && deletedSlot.preview) {
        URL.revokeObjectURL(deletedSlot.preview);
      }
      newSlots.splice(index, 1);
      newSlots.push({ file: null, preview: null, progress: 0, isUploading: false });
      
      setPhotoSlots(newSlots);
      
      const newPhotos = newSlots.map(slot => slot.preview).filter((p): p is string => p !== null);
      form.setValue('photos', newPhotos, { shouldValidate: true });
  }

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormValues | `photos.${number}` | 'address.country')[] = [];
    
    // Define steps for each flow
    const normalFlow = [
        ['email', 'password'], // 0
        ['name'], // 1
        ['dateOfBirth'], // 2
        ['gender'], // 3
        ['lookingFor'], // 4
        ['address.country', 'address.state'], // 5
        ['distancePreference'], // 6
        ['school'], // 7
        ['drinking', 'smoking', 'workout', 'pets'], // 8
        ['communicationStyle', 'loveLanguage', 'educationLevel', 'zodiacSign'], // 9
        ['interests'], // 10
        ['photos'] // 11
    ];
    
    const googleFlow = [
        [], // 0 - dummy step for alignment
        ['name'], // 1
        ['dateOfBirth'], // 2
        ['gender'], // 3
        ['lookingFor'], // 4
        ['address.country', 'address.state'], // 5
        ['distancePreference'], // 6
        ['school'], // 7
        ['drinking', 'smoking', 'workout', 'pets'], // 8
        ['communicationStyle', 'loveLanguage', 'educationLevel', 'zodiacSign'], // 9
        ['interests'], // 10
        ['photos'] // 11
    ];

    const currentFlow = isGoogleSignup ? googleFlow : normalFlow;
    const finalStep = isGoogleSignup ? 11 : 11;
    
    if (step < currentFlow.length) {
        fieldsToValidate = currentFlow[step] as any;
    }

    const isFinalStep = step === finalStep;

    const isValid = await form.trigger(fieldsToValidate as (keyof SignupFormValues)[]);

    if (isValid) {
      if (isFinalStep) {
         form.handleSubmit(onSubmit)();
      } else {
        nextStep();
      }
    }
  };

  const finalStep = isGoogleSignup ? 10 : 11;
  const interestStep = isGoogleSignup ? 9 : 10;
  
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
       <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={prevStep}>
            <ArrowLeft className="h-6 w-6" />
        </Button>
        {step > 0 && <Progress value={progressValue} className="h-2 flex-1" />}
        {(step > 0 && step < finalStep) ? (
            <Button variant="ghost" onClick={nextStep} className={`shrink-0 w-16 ${step === 7 ? '' : 'invisible'}`}>
                {t.signup.progressHeader.skip}
            </Button>
        ) : <div className="w-16"></div>}
      </header>
      
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col p-6 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
               {step === 0 && !isGoogleSignup && (
                <>
                  <h1 className="text-3xl font-bold">{t.signup.step1.title}</h1>
                  <p className="text-muted-foreground mb-8">{t.signup.step1.description}</p>
                   <div className="space-y-6">
                     <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t.signup.step1.emailLabel}</FormLabel>
                            <FormControl>
                                <Input placeholder="ornek@mail.com" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t.signup.step1.passwordLabel}</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                   </div>
                </>
              )}
              {step === 1 && (
                <>
                  <h1 className="text-3xl font-bold">{t.signup.step2.title}</h1>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder={t.signup.step2.placeholder}
                            className="border-0 border-b-2 rounded-none px-0 text-xl h-auto focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 bg-transparent"
                            {...field}
                          />
                        </FormControl>
                        <FormLabel className="text-muted-foreground">
                          {t.signup.step2.label}
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {step === 2 && (
                <>
                  <h1 className="text-3xl font-bold">{t.signup.step3.title}</h1>
                  <Controller
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field, fieldState }) => (
                      <FormItem className="pt-8">
                        <FormControl>
                          <DateInput
                            value={field.value}
                            onChange={handleDateOfBirthChange}
                            disabled={field.disabled}
                            t={t.signup.step3}
                          />
                        </FormControl>
                        <FormLabel className="text-muted-foreground pt-2 block">
                          {t.signup.step3.label}
                        </FormLabel>
                         {ageStatus === 'valid' && (
                            <div className="flex items-center text-green-600 mt-2">
                                <CheckCircle className="mr-2 h-5 w-5" />
                                <p>{t.signup.step3.ageConfirm}</p>
                            </div>
                        )}
                        {ageStatus === 'invalid' && (
                            <div className="flex items-center text-red-600 mt-2">
                                <XCircle className="mr-2 h-5 w-5" />
                                <p>{t.signup.step3.ageError}</p>
                            </div>
                        )}
                        {fieldState.error && ageStatus !== 'invalid' && <FormMessage>{fieldState.error.message}</FormMessage>}
                      </FormItem>
                    )}
                  />
                </>
              )}
              {step === 3 && (
                <>
                  <h1 className="text-3xl font-bold">{t.signup.step4.title}</h1>
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="space-y-4 pt-8">
                        <FormControl>
                          <div className="space-y-3">
                            <Button
                              type="button"
                              variant={field.value === 'female' ? 'default' : 'outline'}
                              className="w-full h-14 rounded-full text-lg"
                              onClick={() => field.onChange('female')}
                            >
                              {t.signup.step4.woman}
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === 'male' ? 'default' : 'outline'}
                              className="w-full h-14 rounded-full text-lg"
                              onClick={() => field.onChange('male')}
                            >
                              {t.signup.step4.man}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {step === 4 && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="shrink-0">
                    <h1 className="text-3xl font-bold">{t.signup.step5.title}</h1>
                    <p className="text-muted-foreground">{t.signup.step5.label}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto -mr-6 pr-6 pt-4">
                  <FormField
                    control={form.control}
                    name="lookingFor"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <div className="grid grid-cols-2 gap-3">
                            {t.signup.step5.options.map((option: {id: string, label: string}, index: number) => {
                              const Icon = lookingForOptions[index].icon;
                              const isSelected = field.value === option.id;
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => field.onChange(option.id)}
                                  className={`p-4 border rounded-lg flex flex-col items-center justify-center gap-2 transition-colors aspect-square ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-background hover:bg-accent"
                                  }`}
                                >
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
              {step === 5 && (
                 <div className="space-y-4">
                    <h1 className="text-3xl font-bold">{t.signup.step6.title}</h1>
                    <FormField
                        control={form.control}
                        name="address.country"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ülke</FormLabel>
                            <Select
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    setSelectedCountry(value);
                                    setStates(State.getStatesOfCountry(value));
                                    form.setValue('address.state', undefined);
                                    form.setValue('address.city', undefined);
                                }}
                                value={field.value}
                            >
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Bir ülke seçin" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <ScrollArea className="h-72">
                                        {countries.map((country) => (
                                            <SelectItem key={country.isoCode} value={country.isoCode}>
                                                {country.name}
                                            </SelectItem>
                                        ))}
                                    </ScrollArea>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address.state"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Şehir</FormLabel>
                            <Select
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    setSelectedState(value);
                                    form.setValue('address.city', undefined);
                                }}
                                value={field.value}
                                disabled={!selectedCountry || states.length === 0}
                            >
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Bir şehir seçin" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <ScrollArea className="h-72">
                                        {states.map((state) => (
                                            <SelectItem key={state.isoCode} value={state.isoCode}>
                                                {state.name}
                                            </SelectItem>
                                        ))}
                                    </ScrollArea>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="address.city"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>İlçe</FormLabel>
                             <FormControl>
                                <Input 
                                    placeholder="İlçenizi yazın (isteğe bağlı)" 
                                    {...field}
                                    value={field.value || ''}
                                    disabled={!selectedState}
                                />
                             </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
              )}
              {step === 6 && (
                <>
                  <h1 className="text-3xl font-bold">{t.signup.step7.title}</h1>
                  <p className="text-muted-foreground">{t.signup.step7.description}</p>
                  <FormField
                    control={form.control}
                    name="distancePreference"
                    render={({ field }) => (
                      <FormItem className="pt-12">
                        <div className="flex justify-between items-center mb-4">
                          <FormLabel className="text-base">{t.signup.step7.label}</FormLabel>
                          <span className="font-bold text-base">{field.value} {t.signup.step7.unit}</span>
                        </div>
                        <FormControl>
                          <Slider
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            max={100}
                            min={1}
                            step={1}
                          />
                        </FormControl>
                        <p className="text-center text-muted-foreground pt-8">
                          {t.signup.step7.info}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {step === 7 && (
                <>
                  <h1 className="text-3xl font-bold">{t.signup.step8.title}</h1>
                  <FormField
                    control={form.control}
                    name="school"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder={t.signup.step8.placeholder}
                            className="border-0 border-b-2 rounded-none px-0 text-xl h-auto focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 bg-transparent"
                            {...field}
                          />
                        </FormControl>
                        <FormLabel className="text-muted-foreground">
                          {t.signup.step8.label}
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {step === 8 && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="shrink-0">
                      <h1 className="text-3xl font-bold">{t.signup.step9.title.replace('{name}', currentName)}</h1>
                      <p className="text-muted-foreground">{t.signup.step9.description}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto -mr-6 pr-5">
                    <div className="space-y-8 py-4">
                      <FormField
                        control={form.control}
                        name="drinking"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold flex items-center gap-2"><GlassWater className="w-5 h-5" />{t.signup.step9.drinking.question}</FormLabel>
                            <FormControl>
                              <div className="flex flex-wrap gap-2 pt-2">
                                {t.signup.step9.drinking.options.map((opt: {id: string, label: string}) => (
                                  <Button key={opt.id} type="button" variant={field.value === opt.id ? 'default' : 'outline'} onClick={() => field.onChange(opt.id)} className="rounded-full">{opt.label}</Button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="smoking"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold flex items-center gap-2"><Cigarette className="w-5 h-5" />{t.signup.step9.smoking.question}</FormLabel>
                            <FormControl>
                              <div className="flex flex-wrap gap-2 pt-2">
                                {t.signup.step9.smoking.options.map((opt: {id: string, label: string}) => (
                                  <Button key={opt.id} type="button" variant={field.value === opt.id ? 'default' : 'outline'} onClick={() => field.onChange(opt.id)} className="rounded-full">{opt.label}</Button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="workout"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold flex items-center gap-2"><Dumbbell className="w-5 h-5" />{t.signup.step9.workout.question}</FormLabel>
                            <FormControl>
                              <div className="flex flex-wrap gap-2 pt-2">
                                {t.signup.step9.workout.options.map((opt: {id: string, label: string}) => (
                                  <Button key={opt.id} type="button" variant={field.value === opt.id ? 'default' : 'outline'} onClick={() => field.onChange(opt.id)} className="rounded-full">{opt.label}</Button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Controller
                        name="pets"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold flex items-center gap-2"><PawPrint className="w-5 h-5" />{t.signup.step9.pets.question}</FormLabel>
                            <FormControl>
                              <div className="flex flex-wrap gap-2 pt-2">
                                {t.signup.step9.pets.options.map((opt: {id: string, label: string}) => {
                                  const isSelected = field.value?.includes(opt.id);
                                  return (
                                    <Button
                                      key={opt.id}
                                      type="button"
                                      variant={isSelected ? 'default' : 'outline'}
                                      onClick={() => {
                                        const newValue = isSelected
                                          ? field.value?.filter(v => v !== opt.id)
                                          : [...(field.value || []), opt.id];
                                        field.onChange(newValue);
                                      }}
                                      className="rounded-full"
                                    >
                                      {opt.label}
                                    </Button>
                                  );
                                })}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}
               {step === 9 && (
                 <div className="flex-1 flex flex-col min-h-0">
                  <div className="shrink-0">
                      <h1 className="text-3xl font-bold">{t.signup.step10.title.replace('{name}', currentName)}</h1>
                      <p className="text-muted-foreground">{t.signup.step10.description}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto -mr-6 pr-5">
                    <div className="space-y-8 py-4">
                      <FormField
                        control={form.control}
                        name="loveLanguage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold flex items-center gap-2"><Heart className="w-5 h-5" />{t.signup.step10.loveLanguage.question}</FormLabel>
                            <FormControl>
                              <div className="flex flex-wrap gap-2 pt-2">
                                {t.signup.step10.loveLanguage.options.map((opt: {id: string, label: string}) => (
                                  <Button key={opt.id} type="button" variant={field.value === opt.id ? 'default' : 'outline'} onClick={() => field.onChange(opt.id)} className="rounded-full">{opt.label}</Button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="communicationStyle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold flex items-center gap-2"><MessageCircle className="w-5 h-5" />{t.signup.step10.communication.question}</FormLabel>
                            <FormControl>
                              <div className="flex flex-wrap gap-2 pt-2">
                                {t.signup.step10.communication.options.map((opt: {id: string, label: string}) => (
                                  <Button key={opt.id} type="button" variant={field.value === opt.id ? 'default' : 'outline'} onClick={() => field.onChange(opt.id)} className="rounded-full">{opt.label}</Button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="educationLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold flex items-center gap-2"><GraduationCap className="w-5 h-5" />{t.signup.step10.education.question}</FormLabel>
                            <FormControl>
                              <div className="flex flex-wrap gap-2 pt-2">
                                {t.signup.step10.education.options.map((opt: {id: string, label: string}) => (
                                  <Button key={opt.id} type="button" variant={field.value === opt.id ? 'default' : 'outline'} onClick={() => field.onChange(opt.id)} className="rounded-full">{opt.label}</Button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zodiacSign"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold flex items-center gap-2"><Moon className="w-5 h-5" />{t.signup.step10.zodiac.question}</FormLabel>
                            <FormControl>
                              <div className="flex flex-wrap gap-2 pt-2">
                                {t.signup.step10.zodiac.options.map((opt: {id: string, label: string}) => (
                                  <Button key={opt.id} type="button" variant={field.value === opt.id ? 'default' : 'outline'} onClick={() => field.onChange(opt.id)} className="rounded-full">{opt.label}</Button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}
              {step === interestStep && (
                  <div className="flex-1 flex flex-col min-h-0">
                      <div className="shrink-0">
                        <h1 className="text-3xl font-bold">{t.signup.step11.title}</h1>
                        <p className="text-muted-foreground">{t.signup.step11.description}</p>
                      </div>
                       <Controller
                          name="interests"
                          control={form.control}
                          render={({ field }) => (
                             <ScrollArea className="flex-1 -mr-6 pr-5 pt-4">
                               <div className="space-y-6">
                                {t.signup.step11.categories.map((category: {title: string, icon: string, options: string[]}) => {
                                    const Icon = interestIcons[category.icon] || Tent;
                                    return (
                                        <div key={category.title}>
                                            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                                                <Icon className="w-5 h-5" /> {category.title}
                                            </h2>
                                            <div className="flex flex-wrap gap-2">
                                                {category.options.map(option => {
                                                    const isSelected = field.value?.includes(option);
                                                    return (
                                                        <Button
                                                            key={option}
                                                            type="button"
                                                            variant={isSelected ? 'default' : 'outline'}
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    field.onChange(field.value?.filter(item => item !== option));
                                                                } else if (field.value && field.value.length < 10) {
                                                                    field.onChange([...field.value, option]);
                                                                } else if (!field.value) {
                                                                    field.onChange([option]);
                                                                }
                                                            }}
                                                            className="rounded-full"
                                                        >
                                                            {option}
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                               </div>
                            </ScrollArea>
                          )}
                        />
                  </div>
              )}
              {step === finalStep && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="shrink-0">
                    <h1 className="text-3xl font-bold">{t.signup.step12.title}</h1>
                    <div className="flex items-center gap-4 mt-2">
                      <CircularProgress
                        progress={Math.round((uploadedPhotoCount / 6) * 100)}
                        size={40}
                      />
                      <p className="text-muted-foreground flex-1">
                        {t.signup.step12.description.replace(
                          "{count}",
                          String(uploadedPhotoCount)
                        )}
                      </p>
                    </div>
                     <FormMessage className="pt-2">
                        {form.formState.errors.photos?.message}
                    </FormMessage>
                  </div>
                  <div className="flex-1 overflow-y-auto -mr-6 pr-5 pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      {photoSlots.map((slot, index) => (
                        <div
                          key={index}
                          className={`relative aspect-[3/4] rounded-lg ${
                            index === 0 ? "col-span-1 row-span-2" : ""
                          }`}
                        >
                          <div
                            onClick={() => openFilePicker(index)}
                            className="cursor-pointer w-full h-full border-2 border-dashed bg-card rounded-lg flex items-center justify-center relative overflow-hidden transition-colors hover:bg-muted"
                          >
                            {slot.preview ? (
                              <>
                                <Image
                                  src={slot.preview}
                                  alt={`Preview ${index}`}
                                  fill
                                  style={{ objectFit: "cover" }}
                                  className="rounded-lg"
                                />
                                {slot.isUploading && (
                                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                     <CircularProgress progress={slot.progress} size={60} />
                                   </div>
                                )}
                                {!slot.isUploading && (
                                  <div className="absolute bottom-2 right-2 flex gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openFilePicker(index);
                                      }}
                                      className="h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    {uploadedPhotoCount > 2 && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleDeletePhoto(e, index)}
                                        className="h-8 w-8 rounded-full bg-red-600/80 text-white flex items-center justify-center hover:bg-red-600"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                                <div className="text-center text-muted-foreground p-2 flex flex-col items-center justify-center gap-2">
                                  <span className="text-xs font-medium block">Fotoğraf ekle</span>
                                  <div
                                    className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                                  >
                                    <Plus className="w-5 h-5" />
                                  </div>
                                </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              )}
            </div>

          <div className="shrink-0 pt-6">
            <Button
              type="button"
              onClick={handleNextStep}
              className="w-full h-14 rounded-full text-lg font-bold"
              disabled={
                isLoading ||
                (step === 2 && ageStatus !== 'valid') ||
                (step === 5 && (!currentAddress?.country || !currentAddress?.state)) ||
                (step === 8 && filledLifestyleCount < 4) ||
                (step === 9 && filledMoreInfoCount < 4) ||
                (step === interestStep && selectedInterests.length < 1) ||
                (step === finalStep && uploadedPhotoCount < 2)
              }
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (step === finalStep ? t.common.done : t.signup.common.next)}
            </Button>

            {step === finalStep && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                  {t.signup.step12.requirementText}
              </p>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
