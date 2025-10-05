
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Heart, GlassWater, Users, Briefcase, Sparkles, Hand, MapPin, Cigarette, Dumbbell, PawPrint, MessageCircle, GraduationCap, Moon, CheckCircle, XCircle, Tent, Globe, DoorOpen, Home, Music, Gamepad2, Sprout, Clapperboard, Paintbrush, Plus, Trash2, Pencil, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { langTr } from "@/languages/tr";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import CircularProgress from "./circular-progress";
import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "./ui/checkbox";


const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    dateOfBirth: z.date().max(eighteenYearsAgo, { message: "You must be at least 18 years old." })
        .refine(date => !isNaN(date.getTime()), { message: "Please enter a valid date." }),
    gender: z.enum(['male', 'female'], { required_error: "Please select your gender." }),
    lookingFor: z.string({ required_error: "Please choose one." }).min(1, { message: "Please choose one." }),
    address: z.object({
        country: z.string().min(1, { message: "Country is required." }),
        state: z.string().min(1, { message: "State is required." }),
        city: z.string().optional(),
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
    interests: z.array(z.string()).min(1).max(5, { message: 'You can select up to 5 interests.'}),
    photos: z.array(z.string().url()).min(2, {message: 'You must upload at least 2 photos.'}).max(6),
    uid: z.string(),
    email: z.string().email(),
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

const allInterests = langTr.signup.step11.categories.flatMap(c => c.options);

type PhotoSlot = {
    file: File | null;
    preview: string | null;
    progress: number;
    isUploading: boolean;
};

const getInitialPhotoSlots = (): PhotoSlot[] => {
    const initialSlots: PhotoSlot[] = Array.from({ length: 6 }, () => ({ file: null, preview: null, progress: 0, isUploading: false }));
    try {
        if (typeof window !== 'undefined') {
            const googleDataString = sessionStorage.getItem('googleSignupData');
            if (googleDataString) {
                const googleData = JSON.parse(googleDataString);
                if (googleData.profilePicture) {
                    initialSlots[0] = { file: null, preview: googleData.profilePicture, progress: 100, isUploading: false };
                }
            }
        }
    } catch (e) {
        console.error("Failed to initialize photo slots from session storage", e);
    }
    return initialSlots;
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
  const t = langTr;
  
  const [isLoading, setIsLoading] = useState(false);
  const [ageStatus, setAgeStatus] = useState<'valid' | 'invalid' | 'unknown'>('unknown');
  
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);

  
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>();
  const [selectedState, setSelectedState] = useState<string | undefined>();

  const auth = useAuth();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(getInitialPhotoSlots);
  const [interestSearch, setInterestSearch] = useState("");
  
  const [step, setStep] = useState(0); 

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
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
      photos: getInitialPhotoSlots().map(s => s.preview).filter(p => p) as string[],
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
            const googleData = JSON.parse(googleDataString);
            form.setValue('email', googleData.email || '');
            form.setValue('name', googleData.name || '');
            form.setValue('uid', googleData.uid);
        } else {
           router.push('/');
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
  const filteredInterests = useMemo(() => {
    return allInterests.filter(interest => interest.toLowerCase().includes(interestSearch.toLowerCase()));
  }, [interestSearch]);

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
      router.push('/'); 
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
        let userId = data.uid;
        
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
            latitude: stateDetails?.latitude ? parseFloat(stateDetails.latitude) : null,
            longitude: stateDetails?.longitude ? parseFloat(stateDetails.longitude) : null,
        },
        address: finalAddress,
      };

      await setDoc(doc(firestore, "users", userId), userProfile, { merge: true });
      
      sessionStorage.removeItem('googleSignupData');
    } catch (error: any) {
      console.error("Signup error:", error);
       let errorMessage = error.message || t.signup.errors.signupFailed;
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
      setPhotoSlots(prev => prev.map(s => ({ ...s, isUploading: false, progress: 0 })));
    }
  }
  
  const totalSteps = 9;
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
    let fieldsToValidate: (keyof SignupFormValues | `address.country` | `address.state`)[] = [];
    
    const flow = [
        ['name'], // 0
        ['dateOfBirth'], // 1
        ['gender'], // 2
        ['lookingFor'], // 3
        ['address.country', 'address.state'], // 4
        ['school'], // 5
        ['interests'], // 6
        ['photos'], // 7
        ['lifestyle'], // 8
        ['moreInfo'], // 9
    ];

    const finalStep = 8;
    
    if (step < flow.length) {
        fieldsToValidate = flow[step] as any;
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

  const finalStep = 8;
  
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
       <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={prevStep}>
            <ArrowLeft className="h-6 w-6" />
        </Button>
        {step > 0 && <Progress value={progressValue} className="h-2 flex-1" />}
        {(step > 0 && step < finalStep) ? (
            <Button variant="ghost" onClick={nextStep} className={`shrink-0 w-16 ${step === 5 ? '' : 'invisible'}`}>
                {t.signup.progressHeader.skip}
            </Button>
        ) : <div className="w-16"></div>}
      </header>
      
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col p-6 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
              {step === 0 && (
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
              {step === 1 && (
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
              {step === 2 && (
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
              {step === 3 && (
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
              {step === 4 && (
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
                                    form.setValue('address.state', '');
                                    form.setValue('address.city', '');
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
                                    setCities(City.getCitiesOfState(selectedCountry!, value));
                                    form.setValue('address.city', '');
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
                                        placeholder="İlçenizi yazın" 
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
              {step === 5 && (
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
              {step === 6 && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="shrink-0">
                      <h1 className="text-3xl font-bold">{t.signup.step11.title}</h1>
                      <p className="text-muted-foreground">{t.signup.step11.description.replace('{count}', '5')}</p>
                      <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="İlgi alanlarında ara..." 
                          className="pl-10" 
                          value={interestSearch}
                          onChange={(e) => setInterestSearch(e.target.value)}
                        />
                      </div>
                       <FormMessage className="pt-2">
                          {form.formState.errors.interests?.message}
                      </FormMessage>
                    </div>
                    <Controller
                      name="interests"
                      control={form.control}
                      render={({ field }) => (
                        <ScrollArea className="flex-1 -mr-6 pr-5 pt-4">
                          <div className="space-y-1">
                            {filteredInterests.map(interest => {
                              const isSelected = field.value?.includes(interest);
                              return (
                                <FormItem 
                                  key={interest}
                                  className="flex flex-row items-center space-x-3 space-y-0 p-3 rounded-md hover:bg-accent cursor-pointer"
                                  onClick={() => {
                                      if (isSelected) {
                                          field.onChange(field.value?.filter(item => item !== interest));
                                      } else if (field.value && field.value.length < 5) {
                                          field.onChange([...field.value, interest]);
                                      } else if (!field.value) {
                                          field.onChange([interest]);
                                      }
                                  }}
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={isSelected}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer w-full">
                                    {interest}
                                  </FormLabel>
                                </FormItem>
                              )
                            })}
                          </div>
                        </ScrollArea>
                      )}
                    />
                  </div>
              )}
              {step === 7 && (
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
                (step === 1 && ageStatus !== 'valid') ||
                (step === 4 && (!currentAddress?.country || !currentAddress?.state)) ||
                (step === 6 && selectedInterests.length < 1) ||
                (step === 7 && uploadedPhotoCount < 2)
              }
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (step === finalStep ? t.common.done : t.signup.common.next)}
            </Button>

            {step === 7 && (
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
