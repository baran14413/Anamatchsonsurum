
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
import { Loader2, ArrowLeft, Heart, GlassWater, Users, Briefcase, Sparkles, Hand, MapPin, Cigarette, Dumbbell, PawPrint } from "lucide-react";
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
    school: z.string().optional(),
    drinking: z.string().optional(),
    smoking: z.string().optional(),
    workout: z.string().optional(),
    pets: z.array(z.string()).optional(),
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

const lifestyleOptions = {
  drinking: [
    { id: 'not_for_me', label: 'Bana göre değil' },
    { id: 'dont_drink', label: 'İçmiyorum' },
    { id: 'rarely', label: 'Nadiren' },
    { id: 'special_occasions', label: 'Özel günlerde' },
    { id: 'socially_weekends', label: 'Hafta sonları sosyalleşirken' },
    { id: 'most_nights', label: 'Çoğu gece' },
  ],
  smoking: [
    { id: 'social_smoker', label: 'Sosyal içici' },
    { id: 'with_drinks', label: 'İçkiyle birlikte' },
    { id: 'non_smoker', label: 'Kullanmıyorum' },
    { id: 'smoker', label: 'Sigara Kullanan' },
    { id: 'trying_to_quit', label: 'Bırakmaya çalışıyorum' },
  ],
  workout: [
    { id: 'everyday', label: 'Her gün' },
    { id: 'often', label: 'Sık sık' },
    { id: 'sometimes', label: 'Ara sıra' },
    { id: 'never', label: 'Asla yapmam'},
  ],
  pets: [
    { id: 'dog', label: 'Köpek' },
    { id: 'cat', label: 'Kedi' },
    { id: 'reptile', label: 'Sürüngen' },
    { id: 'amphibian', label: 'Amfibik' },
    { id: 'bird', label: 'Kuş' },
    { id: 'fish', label: 'Balık' },
    { id: 'none_but_love', label: 'Hayvanım yok ama çok severim' },
    { id: 'other', label: 'Diğer' },
    { id: 'turtle', label: 'Kaplumbağa' },
    { id: 'hamster', label: 'Hamster' },
    { id: 'rabbit', label: 'Tavşan' },
    { id: 'dont_like', label: 'Hoşlanmam' },
    { id: 'all_pets', label: 'Tüm evcil hayvanlar' },
  ]
};


const DateInput = ({ value, onChange, disabled }: { value?: Date, onChange: (date: Date) => void, disabled?: boolean }) => {
    const [day, setDay] = useState(() => value ? String(value.getDate()).padStart(2, '0') : '');
    const [month, setMonth] = useState(() => value ? String(value.getMonth() + 1).padStart(2, '0') : '');
    const [year, setYear] = useState(() => value ? String(value.getFullYear()) : '');

    const monthRef = useRef<HTMLInputElement>(null);
    const yearRef = useRef<HTMLInputElement>(null);

    const smartInputHandler = (
      e: React.ChangeEvent<HTMLInputElement>,
      setter: React.Dispatch<React.SetStateAction<string>>,
      field: 'day' | 'month'
    ) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        
        if (field === 'day') {
            if (val.length > 0 && parseInt(val.charAt(0)) > 3) val = day;
            else if (val.length > 1 && parseInt(val) > 31) val = day;
            setDay(val);
            if (val.length === 2) monthRef.current?.focus();
        } else if (field === 'month') {
            if (val.length > 0 && parseInt(val.charAt(0)) > 1) {
              val = month;
            } else if (val.length > 1 && parseInt(val) > 12) {
              val = month;
            }
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
                onChange={(e) => smartInputHandler(e, setDay, 'day')}
                disabled={disabled}
                className="text-xl text-center h-14 w-16 p-0 border-0 border-b-2 rounded-none bg-transparent focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0"
            />
            <span className="text-xl text-muted-foreground">/</span>
            <Input
                ref={monthRef}
                placeholder="AA"
                maxLength={2}
                value={month}
                onChange={(e) => smartInputHandler(e, setMonth, 'month')}
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
      school: "",
      drinking: undefined,
      smoking: undefined,
      workout: undefined,
      pets: [],
    },
    mode: "onChange",
  });
  
  const currentName = form.watch("name");
  const lifestyleValues = form.watch(['drinking', 'smoking', 'workout', 'pets']);

  const filledLifestyleCount = useMemo(() => {
    // We count 'pets' array differently. If it has items, it counts as 1.
    return lifestyleValues.filter((value, index) => {
        if (index === 3) { // This is the 'pets' array
            return Array.isArray(value) && value.length > 0;
        }
        return !!value;
    }).length;
  }, [lifestyleValues]);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  async function onSubmit(data: SignupFormValues) {
    console.log(data);
    nextStep(); 
  }
  
  const progressValue = (step / 8) * 100;

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormValues)[] = [];
    if (step === 1) fieldsToValidate = ['name'];
    if (step === 2) fieldsToValidate = ['dateOfBirth'];
    if (step === 3) fieldsToValidate = ['gender'];
    if (step === 4) fieldsToValidate = ['lookingFor'];
    if (step === 5) fieldsToValidate = ['location'];
    if (step === 6) fieldsToValidate = ['distancePreference'];
    if (step === 7) fieldsToValidate = ['school'];
    if (step === 8) fieldsToValidate = ['drinking', 'smoking', 'workout', 'pets'];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      if (step === 8) {
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
  
  const handleSkip = () => {
    if (step === 7) {
        form.setValue('school', '');
    }
    if (step === 8) {
        form.setValue('drinking', undefined);
        form.setValue('smoking', undefined);
        form.setValue('workout', undefined);
        form.setValue('pets', []);
    }
    handleNextStep();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
       <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4">
        {step > 1 && (
          <Button variant="ghost" size="icon" onClick={prevStep}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
        )}
        <Progress value={progressValue} className="h-2 flex-1" />
        {(step === 7 || step === 8) && (
            <Button variant="ghost" onClick={handleSkip} className="shrink-0">
              Atla
            </Button>
        )}
      </header>
      <main className="flex flex-1 flex-col p-6 overflow-y-auto">
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
              {step === 7 && (
                <>
                  <h1 className="text-3xl font-bold">Okulunu yazmak istersen...</h1>
                  <FormField
                    control={form.control}
                    name="school"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Okulunu gir"
                            className="border-0 border-b-2 rounded-none px-0 text-xl h-auto focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 bg-transparent"
                            {...field}
                          />
                        </FormControl>
                        <FormLabel className="text-muted-foreground">
                          Profilinde bu şekilde görünecek.
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {step === 8 && (
                <>
                  <h1 className="text-3xl font-bold">{currentName}, biraz da yaşam tarzı alışkanlıklarından bahsedelim</h1>
                  <p className="text-muted-foreground">Eşleşme adaylarının alışkanlıkları, seninkilerle uyumlu mu? İlk sen başla.</p>
                  <div className="space-y-8 pt-4">
                    {/* Drinking */}
                    <FormField
                      control={form.control}
                      name="drinking"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold flex items-center gap-2"><GlassWater className="w-5 h-5" />Ne sıklıkla içki içersin?</FormLabel>
                          <FormControl>
                            <div className="flex flex-wrap gap-2 pt-2">
                              {lifestyleOptions.drinking.map(opt => (
                                <Button key={opt.id} type="button" variant={field.value === opt.id ? 'default' : 'outline'} onClick={() => field.onChange(opt.id)} className="rounded-full">{opt.label}</Button>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     {/* Smoking */}
                    <FormField
                      control={form.control}
                      name="smoking"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold flex items-center gap-2"><Cigarette className="w-5 h-5" />Ne sıklıkla sigara içersin?</FormLabel>
                          <FormControl>
                            <div className="flex flex-wrap gap-2 pt-2">
                              {lifestyleOptions.smoking.map(opt => (
                                <Button key={opt.id} type="button" variant={field.value === opt.id ? 'default' : 'outline'} onClick={() => field.onChange(opt.id)} className="rounded-full">{opt.label}</Button>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     {/* Workout */}
                    <FormField
                      control={form.control}
                      name="workout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold flex items-center gap-2"><Dumbbell className="w-5 h-5" />Spor yapıyor musun?</FormLabel>
                          <FormControl>
                            <div className="flex flex-wrap gap-2 pt-2">
                              {lifestyleOptions.workout.map(opt => (
                                <Button key={opt.id} type="button" variant={field.value === opt.id ? 'default' : 'outline'} onClick={() => field.onChange(opt.id)} className="rounded-full">{opt.label}</Button>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     {/* Pets */}
                    <Controller
                        name="pets"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold flex items-center gap-2"><PawPrint className="w-5 h-5" />Evcil hayvanın var mı?</FormLabel>
                            <FormControl>
                              <div className="flex flex-wrap gap-2 pt-2">
                                {lifestyleOptions.pets.map(opt => {
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
                </>
              )}
            </div>

            <div className="shrink-0 pt-6">
              {step === 5 ? (
                 <Button
                    type="button"
                    onClick={handleLocationRequest}
                    className="w-full h-14 rounded-full text-lg font-bold"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Konumumu Paylaş'}
              </Button>
              ) : step === 8 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-14 rounded-full text-lg font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Sonraki ${filledLifestyleCount}/4`}
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
