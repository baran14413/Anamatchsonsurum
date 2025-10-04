
"use client";

import { useState, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Heart, GlassWater, Users, Briefcase, Sparkles, Hand, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

const formSchema = z.object({
    name: z.string().min(2, { message: "İsim en az 2 karakter olmalıdır." }),
    dateOfBirth: z.date().max(eighteenYearsAgo, { message: "En az 18 yaşında olmalısın." })
        .refine(date => !isNaN(date.getTime()), { message: "Geçerli bir tarih girin." }),
    gender: z.enum(['male', 'female'], { required_error: "Lütfen cinsiyetini seç." }),
    lookingFor: z.string({ required_error: "Lütfen birini seç." }).min(1, { message: "Lütfen birini seç." }),
    location: z.object({
        latitude: z.number(),
        longitude: z.number(),
    }).optional(),
    distancePreference: z.number().min(1).max(100).default(80),
});

type SignupFormValues = z.infer<typeof formSchema>;

const lookingForOptions = [
    { id: 'long-term', label: 'Uzun süreli ilişki', icon: Heart },
    { id: 'short-term', label: 'Kısa süreli ilişki', icon: GlassWater },
    { id: 'friends', label: 'Yeni arkadaşlar', icon: Users },
    { id: 'casual', label: 'Takılmak için', icon: Briefcase },
    { id: 'not-sure', label: 'Emin değilim', icon: Sparkles },
    { id: 'whatever', label: 'Her şeye açığım', icon: Hand },
];


const DateInput = ({ value, onChange, disabled }: { value?: Date, onChange: (date: Date) => void, disabled?: boolean }) => {
    const [day, setDay] = useState(() => value ? String(value.getDate()).padStart(2, '0') : '');
    const [month, setMonth] = useState(() => value ? String(value.getMonth() + 1).padStart(2, '0') : '');
    const [year, setYear] = useState(() => value ? String(value.getFullYear()) : '');

    const monthRef = useRef<HTMLInputElement>(null);
    const yearRef = useRef<HTMLInputElement>(null);

    const smartInputHandler = (
      e: React.ChangeEvent<HTMLInputElement>,
      field: 'day' | 'month'
    ) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        let currentVal = field === 'day' ? day : month;

        if (val.length > 0) {
            if (field === 'day' && parseInt(val.charAt(0)) > 3) val = currentVal;
            if (field === 'month' && parseInt(val.charAt(0)) > 1) val = currentVal;
        }
        if (val.length > 1) {
            if (field === 'day' && parseInt(val) > 31) val = currentVal;
            if (field === 'month' && parseInt(val) > 12) val = currentVal;
        }

        if (field === 'day') {
            setDay(val);
            if (val.length === 2) monthRef.current?.focus();
        } else if (field === 'month') {
            setMonth(val);
            if (val.length === 2) yearRef.current?.focus();
        }

        const newDay = field === 'day' ? val : day;
        const newMonth = field === 'month' ? val : month;

        if (newDay.length === 2 && newMonth.length === 2 && year.length === 4) {
            const date = new Date(`${year}-${newMonth}-${newDay}`);
             if (!isNaN(date.getTime()) && date.getDate() === parseInt(newDay) && date.getMonth() + 1 === parseInt(newMonth)) {
                onChange(date);
            } else {
                onChange(new Date('invalid'));
            }
        }
    };
    
    const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        setYear(val);

        if (day.length === 2 && month.length === 2 && val.length === 4) {
            const date = new Date(`${val}-${month}-${day}`);
            if (!isNaN(date.getTime()) && 
                date.getDate() === parseInt(day, 10) &&
                date.getMonth() + 1 === parseInt(month, 10) &&
                date.getFullYear() === parseInt(val, 10)) {
            onChange(date);
            } else {
            onChange(new Date('invalid'));
            }
        }
    };


    return (
        <div className="flex items-center gap-2">
            <Input
                placeholder="GG"
                maxLength={2}
                value={day}
                onChange={(e) => smartInputHandler(e, 'day')}
                disabled={disabled}
                className="text-xl text-center h-14 w-16 p-0 border-0 border-b-2 rounded-none bg-transparent focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
            />
            <span className="text-xl text-muted-foreground">/</span>
            <Input
                ref={monthRef}
                placeholder="AA"
                maxLength={2}
                value={month}
                onChange={(e) => smartInputHandler(e, 'month')}
                disabled={disabled}
                 className="text-xl text-center h-14 w-16 p-0 border-0 border-b-2 rounded-none bg-transparent focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
            />
            <span className="text-xl text-muted-foreground">/</span>
            <Input
                ref={yearRef}
                placeholder="YYYY"
                maxLength={4}
                value={year}
                onChange={handleYearChange}
                disabled={disabled}
                className="text-xl text-center h-14 w-24 p-0 border-0 border-b-2 rounded-none bg-transparent focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
            />
        </div>
    )
}

export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      gender: undefined,
      lookingFor: "",
      distancePreference: 80,
    },
    mode: "onChange",
  });

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  async function onSubmit(data: SignupFormValues) {
    console.log(data);
    nextStep(); 
  }
  
  const progressValue = (step / 6) * 100;

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormValues)[] = [];
    if (step === 1) fieldsToValidate = ['name'];
    if (step === 2) fieldsToValidate = ['dateOfBirth'];
    if (step === 3) fieldsToValidate = ['gender'];
    if (step === 4) fieldsToValidate = ['lookingFor'];
    if (step === 5) fieldsToValidate = ['location'];
    if (step === 6) fieldsToValidate = ['distancePreference'];


    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      if (step === 6) {
         toast({title: "Şimdilik bu kadar!", description: "Tasarım devam ediyor."})
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
            title: "Konum İzni Reddedildi",
            description: "Eşleşmeleri bulmak için konum izni gereklidir. Lütfen tarayıcı ayarlarından izin verin.",
            variant: "destructive"
        });
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4">
        {step > 1 && (
          <Button variant="ghost" size="icon" onClick={prevStep}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
        )}
        <Progress value={progressValue} className="h-2 flex-1" />
      </header>
      <main className="flex flex-1 flex-col p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-4">
              {step === 1 && (
                <>
                  <h1 className="text-3xl font-bold">Adın ne?</h1>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Adını gir"
                            className="border-0 border-b-2 rounded-none px-0 text-xl h-auto focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 bg-transparent"
                            {...field}
                          />
                        </FormControl>
                        <FormLabel className="text-muted-foreground">
                          Profilinde bu şekilde görünecek. Bunu daha sonra değiştiremezsin.
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
               {step === 2 && (
                <>
                  <h1 className="text-3xl font-bold">Doğum tarihin?</h1>
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
                                    />
                                </FormControl>
                                <FormLabel className="text-muted-foreground pt-2 block">
                                    Profilinde yaşın gösterilir, doğum tarihin değil.
                                </FormLabel>
                                {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                            </FormItem>
                        )}
                    />
                </>
              )}
              {step === 3 && (
                 <>
                   <h1 className="text-3xl font-bold">Ben bir...</h1>
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
                                Kadın
                              </Button>
                              <Button
                                type="button"
                                variant={field.value === 'male' ? 'default' : 'outline'}
                                className="w-full h-14 rounded-full text-lg"
                                onClick={() => field.onChange('male')}
                              >
                                Erkek
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
                 <>
                   <h1 className="text-3xl font-bold">Ne arıyorsun?</h1>
                   <p className="text-muted-foreground">Merak etme, bunu daha sonra profilinden istediğin zaman değiştirebilirsin.</p>
                   <FormField
                    control={form.control}
                    name="lookingFor"
                    render={({ field }) => (
                      <FormItem className="space-y-3 pt-4">
                        <FormControl>
                           <div className="grid grid-cols-2 gap-3">
                                {lookingForOptions.map(option => {
                                    const Icon = option.icon;
                                    const isSelected = field.value === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => field.onChange(option.id)}
                                            className={`p-4 border rounded-lg flex flex-col items-center justify-center gap-2 transition-colors ${
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
                 </>
              )}
               {step === 5 && (
                <div className="flex flex-col items-center text-center h-full justify-center">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                     <MapPin className="w-12 h-12 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold">Konumunu Paylaş</h1>
                  <p className="text-muted-foreground mt-2 max-w-sm">
                    Çevrendeki potansiyel eşleşmeleri görebilmek için konumunu bizimle paylaşman gerekiyor.
                  </p>
                </div>
              )}
              {step === 6 && (
                <>
                  <h1 className="text-3xl font-bold">Mesafe tercihin nedir?</h1>
                  <p className="text-muted-foreground">Potansiyel eşleşmelerin bulunmasını istediğin maksimum mesafeyi ayarlamak için kaydırıcıyı kullan.</p>
                  <FormField
                    control={form.control}
                    name="distancePreference"
                    render={({ field }) => (
                      <FormItem className="pt-12">
                        <div className="flex justify-between items-center mb-4">
                            <FormLabel className="text-base">Mesafe Tercihi</FormLabel>
                            <span className="font-bold text-base">{field.value} Km</span>
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
                            Tercihleri daha sonra Ayarlar'dan değiştirebilirsin
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <div className="shrink-0">
              {step === 5 ? (
                 <Button
                    type="button"
                    onClick={handleLocationRequest}
                    className="w-full h-14 rounded-full text-lg font-bold"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Konumumu Paylaş'}
              </Button>
              ) : (
                <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full h-14 rounded-full text-lg font-bold"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'İlerle'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
