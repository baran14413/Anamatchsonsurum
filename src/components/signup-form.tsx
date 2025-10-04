"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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
import { Loader2, Eye, EyeOff, MapPin, Camera, Upload, ArrowLeft, Check, PartyPopper, Map, Building, CalendarIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import Image from "next/image";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import Link from "next/link";
import { Icons } from "./icons";

const TOTAL_STEPS = 5;

// Step 1 Schema: Email
const step1Schema = z.object({
  email: z.string().email({ message: "Geçerli bir e-posta adresi girin." }),
});

// Step 2 Schema: Password
const step2Schema = z.object({
  password: z.string().min(8, { message: "Şifre en az 8 karakter olmalıdır." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor.",
  path: ["confirmPassword"],
});

// Step 3 Schema: Personal Info
const step3Schema = z.object({
  fullName: z.string().min(3, { message: "Tam ad en az 3 karakter olmalıdır." }),
  dateOfBirth: z.date({
    required_error: "Doğum tarihi gereklidir.",
  }),
});

// Step 4 Schema: Gender & Location
const step4Schema = z.object({
    gender: z.enum(["male", "female", "other"], { required_error: "Lütfen cinsiyetinizi seçin." }),
});

// Step 5 Schema: Photos
const step5Schema = z.object({
    images: z.array(z.string().url()).min(2, { message: "Lütfen en az 2 fotoğraf yükleyin." }),
    profilePicture: z.string().url({ message: "Lütfen geçerli bir profil resmi yükleyin." }),
});

const combinedSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema).merge(step5Schema);

type SignupFormValues = z.infer<typeof combinedSchema>;

export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState(1);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(
       step === 1 ? step1Schema :
       step === 2 ? step2Schema :
       step === 3 ? step3Schema :
       step === 4 ? step4Schema :
       step5Schema
    ),
    mode: "onChange",
    defaultValues: {
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        dateOfBirth: undefined,
        gender: undefined,
        images: [],
        profilePicture: "",
    }
  });
  
  const fetchAddress = async (lat: number, lon: number) => {
    setIsGeocoding(true);
    try {
        const response = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
        const data = await response.json();
        
        if (response.ok && data.address) {
            const adr = data.address;
            const formattedAddress = [adr.district, adr.city].filter(Boolean).join(', ');
            setAddress(formattedAddress || "Konum Alındı");
        } else {
            setAddress("Adres bulunamadı");
        }
    } catch (err) {
        console.error("Geocoding fetch error:", err);
        setAddress("Adres bilgisi alınamadı.");
    } finally {
        setIsGeocoding(false);
    }
  };


  const uploadFile = async (file: File) => {
    setIsUploading(true); 
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
        }
        
        const { url } = await response.json();
        return url;
    } catch (error: any) {
        console.error('Upload failed:', error);
        toast({
            title: "Yükleme Başarısız",
            description: `Resim yüklenirken bir hata oluştu: ${error.message}`,
            variant: 'destructive',
        });
        return null;
    } finally {
        setIsUploading(false);
    }
  }
  
  const handleMatchPicturesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const currentPictures = form.getValues("images") || [];
        if(currentPictures.length + files.length > 9) {
            toast({ title: "Hata", description: "En fazla 9 fotoğraf yükleyebilirsiniz.", variant: "destructive" });
            return;
        }
        
        setIsUploading(true);
        const uploadPromises = Array.from(files).map(file => uploadFile(file));
        const urls = await Promise.all(uploadPromises);
        setIsUploading(false);
        const validUrls = urls.filter((url): url is string => url !== null);
        
        const newImages = [...new Set([...currentPictures, ...validUrls])];

        form.setValue("images", newImages, { shouldValidate: true });

        // Set profile picture if not set
        if (!form.getValues("profilePicture") && newImages.length > 0) {
            form.setValue("profilePicture", newImages[0], { shouldValidate: true });
        }
    }
  };


  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);
  
  const handleLocationRequest = () => {
    setLocationError(null);
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(newLocation);
        fetchAddress(newLocation.latitude, newLocation.longitude); // Fetch address right away
        setLocationError(null);
        setIsLoading(false);
      },
      (error) => {
        setLocationError("Otomatik konum alınamadı. Lütfen konum iznini kontrol edin veya manuel olarak seçin.");
        setIsLoading(false);
      },
      { timeout: 10000 }
    );
  };
  
  const handleManualLocationSelect = () => {
    const newLocation = { latitude: 41.0082, longitude: 28.9784 }; // Istanbul as default
    setLocation(newLocation); 
    fetchAddress(newLocation.latitude, newLocation.longitude);
    setLocationError(null);
    toast({
        title: "Konum Ayarlandı",
        description: "Konumunuz manuel olarak ayarlandı.",
    });
  }


  const onFinalSubmit = async () => {
    const data = form.getValues();
    setIsLoading(true);

    if (isUploading) {
        toast({ title: "Lütfen Bekleyin", description: "Resimler hala yükleniyor.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    if (data.images.length < 2) {
        toast({ title: "Eksik Galeri Fotoğrafı", description: "Lütfen Adım 5'e geri dönüp en az 2 fotoğraf yükleyin.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    if (!location) {
        toast({ title: "Konum Bilgisi Eksik", description: "Lütfen Adım 4'e geri dönüp konum izni verin veya manuel olarak seçin.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        const userDocRef = doc(firestore, "users", user.uid);
        
        await setDoc(userDocRef, {
            uid: user.uid,
            email: data.email,
            fullName: data.fullName,
            dateOfBirth: format(data.dateOfBirth, "yyyy-MM-dd"),
            profilePicture: data.profilePicture || data.images[0],
            gender: data.gender,
            images: data.images, 
            location: location,
            interests: [], // Will be added later
            createdAt: new Date(),
            profileComplete: true,
            bio: "" 
        });

        toast({
            title: "Kayıt Tamamlandı!",
            description: "Hesabın oluşturuldu. Maceraya hazırsın!",
            className: "bg-green-500 text-white",
        });
        router.push("/anasayfa");

    } catch (error: any) {
        let description = "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
        if (error.code === 'auth/email-already-in-use') {
            description = "Bu e-posta adresi zaten kullanılıyor. Lütfen Adım 1'e geri dönün.";
        }
        toast({
            title: "Kayıt Başarısız",
            description,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-black p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-start w-full mb-4">
            {step > 1 ? (
                <Button variant="ghost" onClick={prevStep} size="icon">
                    <ArrowLeft className="h-6 w-6 text-muted-foreground" />
                </Button>
            ) : (
                <Link href="/" legacyBehavior>
                    <a className="invisible">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-6 w-6 text-muted-foreground" />
                        </Button>
                    </a>
                </Link>
            )}
        </div>

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onFinalSubmit)} className="space-y-6">
                
                {step === 1 && (
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold">E-posta adresin nedir?</h3>
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-muted-foreground">Potansiyel eşleşmeler ve daha fazlası hakkında güncellemeler alacaksın.</FormLabel>
                                <FormControl><Input placeholder="E-posta" {...field} className="h-12 text-base" autoFocus/></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold">Şifreni oluştur</h3>
                         <FormField control={form.control} name="password" render={({ field }) => (
                            <FormItem>
                                <div className="relative">
                                    <FormControl><Input type={showPassword ? "text" : "password"} placeholder="Şifre" {...field} className="h-12 text-base" autoFocus/></FormControl>
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                            <FormItem>
                                <FormControl><Input type="password" placeholder="Şifreni Onayla" {...field} className="h-12 text-base" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                )}
                
                {step === 3 && (
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold">Profil Bilgileri</h3>
                        <FormField control={form.control} name="fullName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Adın</FormLabel>
                                <FormControl><Input placeholder="Adın" {...field} className="h-12 text-base" autoFocus/></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Doğum Tarihin</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "h-12 text-base justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd MMMM yyyy", { locale: tr })
                                      ) : (
                                        <span>Bir tarih seçin</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                    captionLayout="dropdown-buttons"
                                    fromYear={1950}
                                    toYear={new Date().getFullYear() - 18}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                )}

                 {step === 4 && (
                     <div className="space-y-6">
                        <h3 className="text-2xl font-bold">Ben bir...</h3>
                        <FormField control={form.control} name="gender" render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                                        <FormItem>
                                            <FormControl>
                                               <Button type="button" variant={field.value === 'female' ? 'default': 'outline'} onClick={() => field.onChange('female')} className="w-full h-12 text-base justify-start pl-4 rounded-full">Kadın</Button>
                                            </FormControl>
                                        </FormItem>
                                        <FormItem>
                                            <FormControl>
                                               <Button type="button" variant={field.value === 'male' ? 'default': 'outline'} onClick={() => field.onChange('male')} className="w-full h-12 text-base justify-start pl-4 rounded-full">Erkek</Button>
                                            </FormControl>
                                        </FormItem>
                                        <FormItem>
                                            <FormControl>
                                               <Button type="button" variant={field.value === 'other' ? 'default': 'outline'} onClick={() => field.onChange('other')} className="w-full h-12 text-base justify-start pl-4 rounded-full">Diğer</Button>
                                            </FormControl>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage className="text-center pt-2" />
                            </FormItem>
                        )} />
                     </div>
                )}


                {step === 5 && (
                     <div className="space-y-4">
                        <h3 className="text-2xl font-bold">Fotoğraflarını Ekle</h3>
                        <p className="text-muted-foreground text-sm">
                            Profilinde gösterilecek en az 2 fotoğraf ekle. İlk fotoğraf profil resmin olacak.
                        </p>
                        <FormField control={form.control} name="images" render={({ field }) => (
                            <FormItem>
                               <FormControl>
                                    <div className="grid grid-cols-3 gap-3">
                                         {field.value.map((src, index) => (
                                             <div key={index} className="relative aspect-w-1 aspect-h-1">
                                                 <Image src={src} alt={`Eşleşme fotoğrafı ${index+1}`} layout="fill" className="rounded-lg object-cover"/>
                                                  {index === 0 && <div className="absolute bottom-1 right-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded-full">Profil</div>}
                                             </div>
                                         ))}
                                         {field.value.length < 9 && (
                                             <label htmlFor="match-pics-upload" className="flex flex-col items-center justify-center aspect-w-1 aspect-h-1 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                                {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/> : <Camera className="h-8 w-8 text-muted-foreground"/>}
                                             </label>
                                         )}
                                         <Input id="match-pics-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleMatchPicturesUpload} disabled={isUploading} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                )}

                <div className="pt-8">
                   <Button 
                        type={step === TOTAL_STEPS ? "submit" : "button"}
                        onClick={async () => {
                            const isValid = await form.trigger();
                            if (isValid) {
                                if (step === TOTAL_STEPS) {
                                    onFinalSubmit();
                                } else {
                                    nextStep();
                                }
                            }
                        }}
                        className="w-full h-12 text-base font-bold rounded-full" 
                        disabled={isLoading || isUploading}
                   >
                        {isLoading || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        {isLoading ? 'Kaydediliyor...' : isUploading ? 'Yükleniyor...' : 'Devam Et'}
                   </Button>
                </div>
            </form>
        </Form>
      </div>
    </div>
  );
}
