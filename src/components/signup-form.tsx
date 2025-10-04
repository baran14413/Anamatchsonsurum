"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Heart, GlassWater, Users, Briefcase, Sparkles, Hand, MapPin, Cigarette, Dumbbell, PawPrint, MessageCircle, GraduationCap, Moon, Eye, EyeOff, Tent, Globe, DoorOpen, Home, Music, Gamepad2, Sprout, Clapperboard, Paintbrush, Plus, Camera, Trash2, Pencil } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { langTr } from "@/languages/tr";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import CircularProgress from "./circular-progress";

const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

const formSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    dateOfBirth: z.date().max(eighteenYearsAgo, { message: "You must be at least 18 years old." })
        .refine(date => !isNaN(date.getTime()), { message: "Please enter a valid date." }),
    gender: z.enum(['male', 'female'], { required_error: "Please select your gender." }),
    lookingFor: z.string({ required_error: "Please choose one." }).min(1, { message: "Please choose one." }),
    location: z.object({
        latitude: z.number(),
        longitude: z.number(),
    }).optional(),
    distancePreference: z.number().min(1).max(100).default(80),
    school: z.string().optional(),
    drinking: z.string().optional(),
    smoking: z.string().optional(),
    workout: z.string().optional(),
    pets: z.array(z.string()).optional(),
    communicationStyle: z.string().optional(),
    loveLanguage: z.string().optional(),
    educationLevel: z.string().optional(),
    zodiacSign: z.string().optional(),
    interests: z.array(z.string()).max(10, { message: 'You can select up to 10 interests.'}).optional(),
    photos: z.array(z.string().url()).min(2, {message: 'You must upload at least 2 photos.'}).max(6),
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
    label: string;
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
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailExistsDialog, setShowEmailExistsDialog] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(
    Array.from({ length: 6 }, (_, i) => ({ file: null, preview: null, label: t.signup.step12.photoSlotLabels[i] || '' }))
  );
  
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      gender: undefined,
      lookingFor: "",
      distancePreference: 50,
      school: "",
      drinking: undefined,
      smoking: undefined,
      workout: undefined,
      pets: [],
      communicationStyle: undefined,
      loveLanguage: undefined,
      educationLevel: undefined,
      zodiacSign: undefined,
      interests: [],
      photos: [],
    },
    mode: "onChange",
  });
  
  const currentName = form.watch("name");
  const lifestyleValues = form.watch(['drinking', 'smoking', 'workout', 'pets']);
  const moreInfoValues = form.watch(['communicationStyle', 'loveLanguage', 'educationLevel', 'zodiacSign']);
  const selectedInterests = form.watch('interests') || [];
  const uploadedPhotoCount = useMemo(() => photoSlots.filter(p => p.file).length, [photoSlots]);

  const filledLifestyleCount = useMemo(() => {
    return lifestyleValues.filter((value, index) => {
        if (index === 3) { // This is the 'pets' array
            return Array.isArray(value) && value.length > 0;
        }
        return !!value;
    }).length;
  }, [lifestyleValues]);

  const filledMoreInfoCount = useMemo(() => {
    return moreInfoValues.filter(v => !!v).length;
  }, [moreInfoValues]);


  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  async function onSubmit(data: SignupFormValues) {
    if (!auth || !firestore) {
      toast({ title: t.common.error, description: t.signup.errors.dbConnectionError, variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // 2. Upload photos to a service (e.g., Cloudinary via your API)
      const photoUrls: string[] = [];
      const filesToUpload = photoSlots.filter(p => p.file).map(p => p.file);

      for (const file of filesToUpload) {
        if (file) {
          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) {
            throw new Error(t.signup.errors.uploadFailed.replace('{fileName}', file.name));
          }
          const result = await response.json();
          photoUrls.push(result.url);
        }
      }

      // 3. Create user profile object to save in Firestore
      const userProfile = {
        uid: user.uid,
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
        images: photoUrls,
        profilePicture: photoUrls[0] || '', // Set first image as profile picture
        location: data.location || null,
      };

      // 4. Save user profile to Firestore
      await setDoc(doc(firestore, "users", user.uid), userProfile);
      
      // 5. Redirect to the app
      router.push("/kesfet");

    } catch (error: any) {
      console.error("Signup error:", error);
       if (error.code === 'auth/email-already-in-use') {
        setShowEmailExistsDialog(true);
      } else {
        toast({
          title: "Signup Failed",
          description: error.message || t.signup.errors.signupFailed,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }
  
  const totalSteps = 12;
  const progressValue = (step / totalSteps) * 100;

  const checkEmailExists = async () => {
    setIsLoading(true);
    const email = form.getValues("email");
    if (!auth) {
        toast({ title: t.common.error, description: "Authentication service could not be initialized.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
            setShowEmailExistsDialog(true);
        } else {
            nextStep();
        }
    } catch (error: any) {
        if (error.code === 'auth/invalid-email') {
            form.setError("email", { type: "manual", message: t.login.errors.invalidEmail });
        } else {
            console.error("Email check error:", error);
            toast({ title: t.common.error, description: "An error occurred while checking the email.", variant: "destructive" });
        }
    } finally {
        setIsLoading(false);
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeSlot !== null) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      const newSlots = [...photoSlots];
      newSlots[activeSlot] = { ...newSlots[activeSlot], file, preview };
      setPhotoSlots(newSlots);
      
      // Update form value
      const newPhotos = newSlots.map(slot => slot.preview).filter((p): p is string => p !== null);
      form.setValue('photos', newPhotos, { shouldValidate: true });
    }
    setActiveSlot(null);
    e.target.value = ''; // Reset file input
  };

  const openFilePicker = (index: number) => {
    if (photoSlots[index].file) {
      // If photo exists, clicking opens file picker to change it.
      setActiveSlot(index);
      fileInputRef.current?.click();
    } else {
      // If slot is empty, find the first truly empty slot to fill
      const firstEmptyIndex = photoSlots.findIndex(p => !p.file);
      setActiveSlot(firstEmptyIndex);
      fileInputRef.current?.click();
    }
  };
  
  const handleDeletePhoto = (e: React.MouseEvent, index: number) => {
      e.stopPropagation(); // Prevent opening file picker
      const newSlots = [...photoSlots];
      
      // Remove the clicked one
      newSlots[index] = { file: null, preview: null, label: t.signup.step12.photoSlotLabels[index] || '' };

      // Re-order the array so that filled slots are at the beginning
      const filledSlots = newSlots.filter(p => p.file);
      const emptySlots = Array.from({ length: 6 - filledSlots.length }, (_, i) => ({ 
        file: null, 
        preview: null, 
        label: t.signup.step12.photoSlotLabels[filledSlots.length + i] || ''
      }));

      const reorderedSlots = [...filledSlots, ...emptySlots];
      
      setPhotoSlots(reorderedSlots);
      
      const newPhotos = reorderedSlots.map(slot => slot.preview).filter((p): p is string => p !== null);
      form.setValue('photos', newPhotos, { shouldValidate: true });
  }


  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormValues)[] = [];
    if (step === 1) fieldsToValidate = ['email', 'password'];
    if (step === 2) fieldsToValidate = ['name'];
    if (step === 3) fieldsToValidate = ['dateOfBirth'];
    if (step === 4) fieldsToValidate = ['gender'];
    if (step === 5) fieldsToValidate = ['lookingFor'];
    if (step === 6) fieldsToValidate = ['location'];
    if (step === 7) fieldsToValidate = ['distancePreference'];
    if (step === 8) fieldsToValidate = ['school'];
    if (step === 11) fieldsToValidate = ['interests'];
    if (step === 12) fieldsToValidate = ['photos'];

    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      if (step === 1) {
        await checkEmailExists();
      } else if (step === totalSteps) {
         form.handleSubmit(onSubmit)();
      } else {
        nextStep();
      }
    }
  };

  const handleLocationRequest = () => {
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue('location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        });
        setIsLoading(false);
        nextStep();
      },
      (error) => {
        toast({
            title: t.signup.step6.errorTitle,
            description: t.signup.step6.errorMessage,
            variant: "destructive"
        });
        setIsLoading(false);
      }
    );
  };
  
  const handleSkip = () => {
    if (step === 8) {
        form.setValue('school', '');
    }
    if (step === 9) {
        form.setValue('drinking', undefined);
        form.setValue('smoking', undefined);
        form.setValue('workout', undefined);
        form.setValue('pets', []);
    }
    if (step === 10) {
        form.setValue('communicationStyle', undefined);
        form.setValue('loveLanguage', undefined);
        form.setValue('educationLevel', undefined);
        form.setValue('zodiacSign', undefined);
    }
    if (step === 11) {
        form.setValue('interests', []);
    }
    nextStep();
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
       <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4">
        {step > 1 ? (
          <Button variant="ghost" size="icon" onClick={prevStep}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
        ) : <div className="w-10"></div>}
        <Progress value={progressValue} className="h-2 flex-1" />
        {(step === 8 || step === 9 || step === 10 || step === 11) ? (
          <Button variant="ghost" onClick={handleSkip} className="shrink-0 w-16">
            {t.signup.progressHeader.skip}
          </Button>
        ) : <div className="w-16"></div>}
      </header>
      
      <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col p-6 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
              {step === 1 && (
                <div className="flex-1 flex flex-col">
                  <div className="shrink-0">
                    <h1 className="text-3xl font-bold">{t.signup.step1.title}</h1>
                    <p className="text-muted-foreground">{t.signup.step1.description}</p>
                  </div>
                   <div className="space-y-4 pt-8 flex-1 overflow-y-auto -mr-6 pr-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.signup.step1.emailLabel}</FormLabel>
                          <FormControl>
                            <Input placeholder="example@domain.com" {...field} />
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
                           <div className="relative">
                            <FormControl>
                                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                            </FormControl>
                             <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                                >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                             </button>
                           </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
              {step === 2 && (
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
              {step === 3 && (
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
                            onChange={field.onChange}
                            disabled={field.disabled}
                            t={t.signup.step3}
                          />
                        </FormControl>
                        <FormLabel className="text-muted-foreground pt-2 block">
                          {t.signup.step3.label}
                        </FormLabel>
                        {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                      </FormItem>
                    )}
                  />
                </>
              )}
              {step === 4 && (
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
              {step === 5 && (
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
              {step === 6 && (
                <div className="flex flex-col items-center text-center h-full justify-center">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <MapPin className="w-12 h-12 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold">{t.signup.step6.title}</h1>
                  <p className="text-muted-foreground mt-2 max-w-sm">
                    {t.signup.step6.description}
                  </p>
                </div>
              )}
              {step === 7 && (
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
              {step === 8 && (
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
              {step === 9 && (
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
               {step === 10 && (
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
              {step === 11 && (
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
               {step === 12 && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="shrink-0">
                    <h1 className="text-3xl font-bold">{t.signup.step12.title}</h1>
                     <div className="flex items-center gap-4 mt-2">
                        <CircularProgress progress={(uploadedPhotoCount / 6) * 100} size={40} />
                        <p className="text-muted-foreground flex-1">{t.signup.step12.description}</p>
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto -mr-6 pr-5 pt-6">
                     <div className="grid grid-cols-2 gap-4">
                      {photoSlots.map((slot, index) => (
                        <div key={index} 
                          className={`relative aspect-[3/4] rounded-lg
                            ${index === 0 ? 'col-span-2 row-span-2' : ''}
                          `}
                        >
                           <div
                            onClick={() => openFilePicker(index)}
                            className="cursor-pointer w-full h-full border-2 border-dashed bg-card rounded-lg flex items-center justify-center relative overflow-hidden transition-colors hover:bg-muted"
                          >
                            {slot.preview ? (
                              <>
                                <Image src={slot.preview} alt={`Preview ${index}`} layout="fill" objectFit="cover" className="rounded-lg"/>
                                <div className="absolute bottom-2 right-2 flex gap-2">
                                   <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openFilePicker(index); }}
                                    className="h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                                   >
                                     <Pencil className="w-4 h-4"/>
                                   </button>
                                   {uploadedPhotoCount > 2 && (
                                     <button
                                        type="button"
                                        onClick={(e) => handleDeletePhoto(e, index)}
                                        className="h-8 w-8 rounded-full bg-red-600/80 text-white flex items-center justify-center hover:bg-red-600"
                                     >
                                         <Trash2 className="w-4 h-4"/>
                                     </button>
                                   )}
                                </div>
                              </>
                            ) : (
                                <div className="text-center text-muted-foreground p-2">
                                  <button
                                    type="button"
                                    className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto"
                                  >
                                    <Plus className="w-5 h-5"/>
                                  </button>
                                  {slot.label && <span className="text-xs font-medium mt-2 block">{slot.label}</span>}
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
            {step === 6 ? (
              <Button
                type="button"
                onClick={handleLocationRequest}
                className="w-full h-14 rounded-full text-lg font-bold"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t.signup.step6.button}
              </Button>
            ) : step === 9 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="w-full h-14 rounded-full text-lg font-bold"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t.signup.common.nextDynamic.replace('{count}', String(filledLifestyleCount)).replace('{total}', '4')}
              </Button>
            ) : step === 10 ? (
                <Button
                type="button"
                onClick={nextStep}
                className="w-full h-14 rounded-full text-lg font-bold"
                disabled={isLoading || filledMoreInfoCount === 0}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t.signup.common.nextDynamic.replace('{count}', String(filledMoreInfoCount)).replace('{total}', '4')}
              </Button>
            ) : step === 11 ? (
                 <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full h-14 rounded-full text-lg font-bold"
                    disabled={isLoading || selectedInterests.length === 0}
                    >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t.signup.common.nextDynamic.replace('{count}', String(selectedInterests.length)).replace('{total}', '10')}
                 </Button>
            ) : step === 12 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-14 rounded-full text-lg font-bold"
                  disabled={isLoading || uploadedPhotoCount < 2}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t.signup.step12.button}
                </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNextStep}
                className="w-full h-14 rounded-full text-lg font-bold"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t.signup.common.next}
              </Button>
            )}

            {step === 12 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                  {t.signup.step12.requirementText}
              </p>
            )}
          </div>
        </form>
      </Form>
      <AlertDialog open={showEmailExistsDialog} onOpenChange={setShowEmailExistsDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t.signup.common.emailExistsTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t.signup.common.emailExistsDescription}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => router.push(`/login?email=${encodeURIComponent(form.getValues("email"))}`)}>
                    {t.signup.common.goToLogin}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
