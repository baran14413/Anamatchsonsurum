
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, XCircle, Eye, EyeOff, MapPin } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { langTr } from '@/languages/tr';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore } from '@/firebase/provider';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

const lifestyleSchema = z.object({
    drinking: z.string().optional(),
    smoking: z.string().optional(),
    workout: z.string().optional(),
    pets: z.string().optional(),
}).optional();


const formSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'İsim en az 2 karakter olmalıdır.' })
    .max(20, { message: 'İsim en fazla 20 karakter olabilir.' }),
  dateOfBirth: z.any().refine((val) => val instanceof Date && !isNaN(val.getTime()), {
    message: "Lütfen geçerli bir tarih girin.",
  }).refine((val) => val <= eighteenYearsAgo, {
    message: 'En az 18 yaşında olmalısın.',
  }),
  gender: z.enum(['female', 'male'], {
    required_error: 'Lütfen cinsiyetinizi seçin.',
  }),
  showGenderOnProfile: z.boolean().default(true),
  location: z.object({
      latitude: z.number(),
      longitude: z.number()
  }).optional(),
  address: z.object({
      country: z.string().optional(),
      countryCode: z.string().optional(),
      city: z.string().optional(),
  }).optional(),
  lookingFor: z.string({ required_error: 'Lütfen bir seçim yapın.' }),
  distancePreference: z.number().min(1).max(160).default(80),
  lifestyle: lifestyleSchema,
  email: z.string().email({ message: "Lütfen geçerli bir e-posta adresi girin." }),
  password: z.string().min(6, { message: "Şifre en az 6 karakter olmalıdır." }),
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
    message: "Şifreler eşleşmiyor.",
    path: ["passwordConfirmation"],
});


type SignupFormValues = z.infer<typeof formSchema>;
type LifestyleKeys = keyof z.infer<typeof lifestyleSchema>;

type IconName = keyof Omit<typeof LucideIcons, 'createLucideIcon' | 'LucideIcon'>;


const DateInput = ({
  value,
  onChange,
  disabled,
}: {
  value?: Date;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
}) => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const dayRef = React.useRef<HTMLInputElement>(null);
  const monthRef = React.useRef<HTMLInputElement>(null);
  const yearRef = React.useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (value && !isNaN(value.getTime())) {
        setDay(String(value.getDate()).padStart(2, '0'));
        setMonth(String(value.getMonth() + 1).padStart(2, '0'));
        setYear(String(value.getFullYear()));
    } else {
        setDay('');
        setMonth('');
        setYear('');
    }
  }, [value]);


  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
    field: 'day' | 'month' | 'year'
  ) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    let newDay = day,
      newMonth = month,
      newYear = year;

    if (field === 'day') {
      if (val.length > 0 && parseInt(val.charAt(0)) > 3) {
      } else if (val.length > 1 && parseInt(val) > 31) {
      } else {
        setDay(val);
        newDay = val;
        if (val.length === 2) monthRef.current?.focus();
      }
    } else if (field === 'month') {
      if (val.length > 0 && parseInt(val.charAt(0)) > 1) {
      } else if (val.length > 1 && parseInt(val) > 12) {
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
      const date = new Date(`${newYear}-${newMonth}-${newDay}T00:00:00`);
      if (
        !isNaN(date.getTime()) &&
        date.getDate() === parseInt(newDay) &&
        date.getMonth() + 1 === parseInt(newMonth)
      ) {
        onChange(date);
      } else {
        onChange(null);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={dayRef}
        placeholder="GG"
        maxLength={2}
        value={day}
        onChange={(e) => handleDateChange(e, setDay, 'day')}
        disabled={disabled}
        inputMode="numeric"
        className="h-14 w-16 bg-transparent p-0 text-center text-2xl border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
      />
      <span className="text-2xl text-muted-foreground">/</span>
      <Input
        ref={monthRef}
        placeholder="AA"
        maxLength={2}
        value={month}
        onChange={(e) => handleDateChange(e, setMonth, 'month')}
        disabled={disabled}
        inputMode="numeric"
        className="h-14 w-16 bg-transparent p-0 text-center text-2xl border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
      />
      <span className="text-2xl text-muted-foreground">/</span>
      <Input
        ref={yearRef}
        placeholder="YYYY"
        maxLength={4}
        value={year}
        onChange={(e) => handleDateChange(e, setYear, 'year')}
        disabled={disabled}
        inputMode="numeric"
        className="h-14 w-24 bg-transparent p-0 text-center text-2xl border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
      />
    </div>
  );
};

const PasswordStrength = ({ password }: { password?: string }) => {
    const getStrength = () => {
        const length = password?.length || 0;
        let score = 0;
        if (length > 7) score++;
        if (length > 9) score++;
        if (/\d/.test(password || '')) score++;
        if (/[a-z]/.test(password || '') && /[A-Z]/.test(password || '')) score++;
        if (/[^A-Za-z0-9]/.test(password || '')) score++;
        return score;
    };

    const strength = getStrength();
    const strengthIndex = Math.min(strength, 4);
    const strengthText = ['Çok Zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok Güçlü'];
    const strengthColor = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];

    if (!password) return null;

    return (
        <div className="space-y-2">
            <Progress value={(strength / 4) * 100} className="h-1" indicatorClassName={strengthColor[strengthIndex]} />
            <p className="text-xs font-medium" style={{ color: `hsl(var(--${strengthColor[strengthIndex]?.replace('bg-', '')}-foreground))` }}>
                Şifre Gücü: {strengthText[strengthIndex]}
            </p>
        </div>
    );
};

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      dateOfBirth: undefined,
      gender: undefined,
      showGenderOnProfile: true,
      lookingFor: undefined,
      distancePreference: 80,
      lifestyle: {},
      email: '',
      password: '',
      passwordConfirmation: '',
    },
    mode: 'onChange',
  });
  
  const dateOfBirthValue = form.watch('dateOfBirth');
  const lifestyleValues = form.watch('lifestyle');
  const passwordValue = form.watch('password');
  const locationValue = form.watch('location');

  const ageStatus = useMemo(() => {
    if (dateOfBirthValue && !isNaN(dateOfBirthValue.getTime())) {
      const ageDifMs = Date.now() - dateOfBirthValue.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      return age >= 18 ? 'valid' : 'invalid';
    }
    return 'unknown';
  }, [dateOfBirthValue]);

  const handleDateOfBirthChange = (date: Date | null) => {
      form.setValue('dateOfBirth', date, { shouldValidate: true });
  };
  
  const handleLocationRequest = () => {
    setIsLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            form.setValue('location', { latitude, longitude }, { shouldValidate: true });

            try {
                // Use public Nominatim API
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                if (response.ok) {
                    const data = await response.json();
                    form.setValue('address', {
                        city: data.address.city || data.address.town || data.address.village || data.address.province,
                        country: data.address.country,
                        countryCode: data.address.country_code.toUpperCase(),
                    }, { shouldValidate: true });
                }
            } catch (error) {
                console.error("Geocoding API call failed", error);
            } finally {
                setIsLocationLoading(false);
            }
        },
        (error) => {
            let message = langTr.ayarlarKonum.errors.positionUnavailable;
            if (error.code === error.PERMISSION_DENIED) {
                message = langTr.ayarlarKonum.errors.permissionDenied;
            } else if (error.code === error.TIMEOUT) {
                message = langTr.ayarlarKonum.errors.timeout;
            }
            setLocationError(message);
            setIsLocationLoading(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const prevStep = () => (step > 0 ? setStep((prev) => prev - 1) : router.push('/'));
  
  const onSubmit = async (data: SignupFormValues) => {
    if (!auth || !firestore) {
      toast({ title: langTr.signup.errors.dbConnectionError, variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const profileData = {
        uid: user.uid,
        email: data.email,
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth.toISOString(),
        gender: data.gender,
        genderPreference: 'both',
        showGenderOnProfile: data.showGenderOnProfile,
        location: data.location,
        address: data.address,
        lookingFor: data.lookingFor,
        distancePreference: data.distancePreference,
        lifestyle: data.lifestyle,
        createdAt: serverTimestamp(),
        rulesAgreed: false,
        membershipType: 'free',
        images: [],
        superLikeBalance: 5,
        isBot: false,
      };

      await setDoc(doc(firestore, "users", user.uid), profileData);
      
      router.push('/profil/galeri');

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
            title: langTr.common.emailExistsTitle,
            description: langTr.common.emailExistsDescription,
            action: <Button onClick={() => router.push('/giris')}>{langTr.common.goToLogin}</Button>
        });
      } else {
        toast({ title: langTr.signup.errors.signupFailed, description: error.message, variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormValues)[] | undefined;
    switch (step) {
      case 0:
        fieldsToValidate = ['fullName'];
        break;
      case 1:
        fieldsToValidate = ['dateOfBirth'];
        if (ageStatus !== 'valid') {
            form.trigger('dateOfBirth');
            return;
        }
        break;
      case 2:
        fieldsToValidate = ['gender'];
        break;
      case 3:
        fieldsToValidate = ['location'];
        break;
      case 4:
        fieldsToValidate = ['lookingFor'];
        break;
      case 5:
        fieldsToValidate = ['distancePreference'];
        break;
       case 6:
        break;
      case 7:
        fieldsToValidate = ['email', 'password', 'passwordConfirmation'];
        break;
    }

    const isValid = fieldsToValidate ? await form.trigger(fieldsToValidate) : true;
    if (isValid) {
      if (step < totalSteps - 1) {
        setStep((s) => s + 1);
      } else {
        form.handleSubmit(onSubmit)();
      }
    }
  };

  const totalSteps = 8;
  const progressValue = ((step + 1) / totalSteps) * 100;

  const fullNameValue = form.watch('fullName');
  const genderValue = form.watch('gender');
  const lookingForValue = form.watch('lookingFor');
  const distanceValue = form.watch('distancePreference');
  const lifestyleQuestions = langTr.signup.step9;
  const lifestyleAnswerCount = Object.values(lifestyleValues || {}).filter(v => v).length;

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b-0 bg-transparent px-4">
        <div className="flex flex-1 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevStep}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <Progress value={progressValue} className="h-2" />
        </div>
      </header>

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-1 flex-col overflow-hidden p-6">
            <div className="flex-1 flex flex-col min-h-0">
                {step === 0 && (
                    <div className="flex-1 flex flex-col">
                        <div className="space-y-4">
                            <h1 className="text-3xl font-bold">{langTr.signup.step2.title}</h1>
                            <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <Input
                                    placeholder={langTr.signup.step2.placeholder}
                                    {...field}
                                    className="h-14 rounded-none border-0 border-b-2 bg-transparent text-2xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <p className="text-muted-foreground">
                            {langTr.signup.step2.label}
                            </p>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="flex-1 flex flex-col">
                        <div className="space-y-4">
                            <h1 className="text-3xl font-bold">{langTr.signup.step3.title}</h1>
                            <Controller
                            control={form.control}
                            name="dateOfBirth"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                <FormControl>
                                    <DateInput
                                    value={field.value}
                                    onChange={handleDateOfBirthChange}
                                    />
                                </FormControl>
                                {ageStatus === 'valid' && (
                                    <div className="flex items-center pt-2 text-sm text-green-600">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {langTr.signup.step3.ageConfirm}
                                    </div>
                                )}
                                {ageStatus === 'invalid' && (
                                    <div className="flex items-center pt-2 text-sm text-red-600">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    {langTr.signup.step3.ageError}
                                    </div>
                                )}
                                <FormMessage>{fieldState.error?.message}</FormMessage>
                                </FormItem>
                            )}
                            />
                            <p className="text-muted-foreground">
                            {langTr.signup.step3.label}
                            </p>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex-1 flex flex-col">
                        <div className="space-y-8">
                            <h1 className="text-3xl font-bold">{langTr.signup.step4.title}</h1>
                            <div className="space-y-4">
                            <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                'h-14 w-full rounded-full text-lg',
                                genderValue === 'female' &&
                                    'border-2 border-primary text-primary'
                                )}
                                onClick={() =>
                                form.setValue('gender', 'female', { shouldValidate: true })
                                }
                            >
                                {langTr.signup.step4.woman}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                'h-14 w-full rounded-full text-lg',
                                genderValue === 'male' &&
                                    'border-2 border-primary text-primary'
                                )}
                                onClick={() =>
                                form.setValue('gender', 'male', { shouldValidate: true })
                                }
                            >
                                {langTr.signup.step4.man}
                            </Button>
                            <FormMessage>{form.formState.errors.gender?.message}</FormMessage>
                            </div>
                            <FormField
                            control={form.control}
                            name="showGenderOnProfile"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    id="showGenderOnProfile"
                                    />
                                </FormControl>
                                <Label className="font-normal" htmlFor="showGenderOnProfile">
                                    Profilimde cinsiyetimi göster
                                </Label>
                                </FormItem>
                            )}
                            />
                        </div>
                    </div>
                )}

                 {step === 3 && (
                    <div className="flex-1 flex flex-col justify-center text-center">
                        <div className="space-y-6">
                            <MapPin className="h-16 w-16 mx-auto text-primary" />
                            <h1 className="text-3xl font-bold">{langTr.signup.step6.title}</h1>
                            <p className="text-muted-foreground">{langTr.signup.step6.description}</p>
                            
                            <Button onClick={handleLocationRequest} disabled={isLocationLoading} className="h-14 w-full max-w-sm mx-auto rounded-full text-lg">
                                {isLocationLoading ? 
                                    <Icons.logo width={24} height={24} className="animate-pulse" /> : 
                                (locationValue ? <>Konum Alındı <CheckCircle className='ml-2 h-5 w-5'/></> : langTr.signup.step6.button)
                                }
                            </Button>
                            {locationError && <p className="text-destructive text-sm mt-2">{locationError}</p>}
                            <FormMessage>{form.formState.errors.location?.message}</FormMessage>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="flex flex-col h-full">
                        <div className="space-y-2 mb-6 shrink-0">
                            <h1 className="text-3xl font-bold">{langTr.signup.step5.title}</h1>
                            <p className="text-muted-foreground">
                            {langTr.signup.step5.label}
                            </p>
                        </div>
                        <div className="flex-1 flex items-center justify-center min-h-0">
                           <div className="grid grid-cols-2 grid-rows-3 gap-3 w-full max-w-sm mx-auto">
                                {langTr.signup.step5.options.map((option) => (
                                <div
                                    key={option.id}
                                    onClick={() => form.setValue('lookingFor', option.id, { shouldValidate: true })}
                                    className={cn(
                                        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-1 text-center transition-all h-28 hover:bg-muted/50",
                                        lookingForValue === option.id ? "border-primary" : "border-card bg-card"
                                    )}
                                >
                                    <span className="text-2xl">{option.emoji}</span>
                                    <p className="font-semibold text-sm">{option.label}</p>
                                </div>
                                ))}
                            </div>
                        </div>
                         <FormMessage className="mt-4 text-center">{form.formState.errors.lookingFor?.message}</FormMessage>
                    </div>
                )}

                {step === 5 && (
                    <div className="flex-1 flex flex-col">
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold">{langTr.signup.step7.title}</h1>
                                <p className="text-muted-foreground">{langTr.signup.step7.description}</p>
                            </div>
                            <div className="space-y-4 pt-8">
                                <div className="flex justify-between items-baseline">
                                    <Label className="text-lg">{langTr.signup.step7.label}</Label>
                                    <span className="text-lg font-bold text-foreground">{distanceValue} {langTr.signup.step7.unit}</span>
                                </div>
                                <Controller
                                    control={form.control}
                                    name="distancePreference"
                                    render={({ field }) => (
                                        <Slider
                                            value={[field.value]}
                                            onValueChange={(value) => field.onChange(value[0])}
                                            max={160}
                                            min={1}
                                            step={1}
                                            className="w-full"
                                        />
                                    )}
                                />
                            </div>
                            <p className="text-muted-foreground text-center pt-8">{langTr.signup.step7.info}</p>
                        </div>
                    </div>
                )}
                
                {step === 6 && (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="space-y-2 mb-6 shrink-0">
                            <h1 className="text-3xl font-bold">{lifestyleQuestions.title.replace('{name}', fullNameValue || '')}</h1>
                            <p className="text-muted-foreground">{lifestyleQuestions.description}</p>
                        </div>
                        <ScrollArea className="flex-1 -mr-6 pr-6">
                            <div className="space-y-8">
                                {(Object.keys(lifestyleQuestions) as Array<keyof typeof lifestyleQuestions>)
                                    .filter(key => key !== 'title' && key !== 'description')
                                    .map(key => {
                                        const question = lifestyleQuestions[key as Exclude<keyof typeof lifestyleQuestions, 'title'|'description'>];
                                        const Icon = LucideIcons[question.icon as IconName] as React.ElementType || LucideIcons.Sparkles;

                                        return (
                                            <div key={key}>
                                                <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
                                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                                    {question.question}
                                                </h2>
                                                <div className="flex flex-wrap gap-2">
                                                    {question.options.map(option => (
                                                        <Badge
                                                            key={option.id}
                                                            variant={lifestyleValues?.[key as LifestyleKeys] === option.id ? 'default' : 'secondary'}
                                                            onClick={() => form.setValue(`lifestyle.${key as LifestyleKeys}`, option.id, { shouldValidate: true })}
                                                            className="cursor-pointer py-1.5 px-3 text-sm"
                                                        >
                                                            {option.label}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {step === 7 && (
                    <div className="flex-1 flex flex-col">
                        <div className="space-y-4">
                            <h1 className="text-3xl font-bold">{langTr.signup.step1.title}</h1>
                            <p className="text-muted-foreground">{langTr.signup.step1.description}</p>
                            <div className="space-y-6 pt-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{langTr.signup.step1.emailLabel}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="E-posta adresini gir..." {...field} className="h-14 rounded-none border-0 border-b-2 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary" />
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
                                        <FormLabel>{langTr.signup.step1.passwordLabel}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                            <Input type={showPassword ? 'text' : 'password'} placeholder="Şifreni belirle..." {...field} className="h-14 pr-10 rounded-none border-0 border-b-2 bg-background text-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 p-2">
                                                {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                                            </button>
                                            </div>
                                        </FormControl>
                                        <PasswordStrength password={passwordValue} />
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="passwordConfirmation"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{langTr.login.confirmPasswordLabel}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Şifreni tekrar gir..." {...field} className="h-14 pr-10 rounded-none border-0 border-b-2 bg-background text-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary" />
                                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 p-2">
                                                    {showConfirmPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                                                </button>
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
            </div>
            
            <div className="shrink-0 pt-6">
                <Button
                type="button"
                onClick={handleNextStep}
                className="h-14 w-full rounded-full text-lg font-bold"
                disabled={isSubmitting || isLocationLoading}
                >
                {isSubmitting ? (
                    <Icons.logo width={24} height={24} className="animate-pulse" />
                ) : (
                    step === totalSteps -1 ? 'Bitir' : (step === 6 ? `İlerle (${lifestyleAnswerCount}/4)` : 'İlerle')
                )}
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
