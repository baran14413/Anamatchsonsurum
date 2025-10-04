

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

const TOTAL_STEPS = 6;

const INTERESTS_LIST = [
  "Spor", "Müzik", "Seyahat", "Sinema", "Yemek", "Sanat", 
  "Teknoloji", "Kitaplar", "Dans", "Moda", "Oyun", "Doğa Yürüyüşü",
  "Fotoğrafçılık", "Yoga", "Gönüllülük", "Hayvansever"
];

// Step 1 Schema
const step1Schema = z.object({
  email: z.string().email({ message: "Geçerli bir e-posta adresi girin." }),
  fullName: z.string().min(3, { message: "Kullanıcı adı en az 3 karakter olmalıdır." }),
  dateOfBirth: z.date({
    required_error: "Doğum tarihi gereklidir.",
  }),
});

// Step 2 Schema
const step2Schema = z.object({
    profilePicture: z.string().url({ message: "Lütfen geçerli bir profil resmi yükleyin." }),
});

// Step 3 Schema
const step3Schema = z.object({
    gender: z.enum(["male", "female", "other"], { required_error: "Lütfen cinsiyetinizi seçin." }),
});

// Step 4 Schema
const step4Schema = z.object({
    images: z.array(z.string().url()).min(2, { message: "Lütfen en az 2 fotoğraf yükleyin." }),
});

// Step 5 Schema
const step5Schema = z.object({
  interests: z.array(z.string()).min(5, { message: "Lütfen en az 5 ilgi alanı seçin." }),
});


// Step 6 Schema
const step6Schema = z.object({
  password: z.string().min(8, { message: "Şifre en az 8 karakter olmalıdır." }),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, { message: "Kullanım koşullarını kabul etmelisiniz."}),
}).refine(data => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor.",
  path: ["confirmPassword"],
});


const combinedSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema).merge(step5Schema).merge(step6Schema);

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
       step === 5 ? step5Schema :
       step6Schema
    ),
    mode: "onChange",
    defaultValues: {
        email: "",
        fullName: "",
        dateOfBirth: undefined,
        profilePicture: "",
        gender: undefined,
        images: [],
        interests: [],
        password: "",
        confirmPassword: "",
        terms: false,
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

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const cloudinaryUrl = await uploadFile(file);
        if (cloudinaryUrl) {
            form.setValue("profilePicture", cloudinaryUrl, { shouldValidate: true });
            const currentImages = form.getValues("images");
            const otherImages = currentImages.length > 0 && form.getValues("profilePicture") === currentImages[0]
                ? currentImages.slice(1)
                : currentImages;
            form.setValue("images", [cloudinaryUrl, ...otherImages.filter(img => img !== cloudinaryUrl)], { shouldValidate: true });
        }
    }
  };

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
    }
  };

  const toggleInterest = (interest: string) => {
    const currentInterests = form.getValues("interests") || [];
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    form.setValue("interests", newInterests, { shouldValidate: true });
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

    if (!data.profilePicture) {
        toast({ title: "Profil Resmi Eksik", description: "Lütfen Adım 2'ye geri dönüp profil resminizi yükleyin.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    if (data.images.length < 2) {
        toast({ title: "Eksik Galeri Fotoğrafı", description: "Lütfen Adım 4'e geri dönüp en az 2 fotoğraf yükleyin.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    if (data.interests.length < 5) {
        toast({ title: "Eksik İlgi Alanı", description: "Lütfen Adım 5'e geri dönüp en az 5 ilgi alanı seçin.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    if (!location) {
        toast({ title: "Konum Bilgisi Eksik", description: "Lütfen Adım 3'e geri dönüp konum izni verin veya manuel olarak seçin.", variant: "destructive" });
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
            profilePicture: data.profilePicture,
            gender: data.gender,
            images: data.images, 
            location: location,
            interests: data.interests,
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFinalSubmit)} className="space-y-6">
            <Progress value={progress} className="h-2" />
            
            {step > 1 && (
                <Button variant="ghost" onClick={prevStep} className="absolute top-6 left-4 text-muted-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Geri
                </Button>
            )}

            {step === 1 && (
                <div className="space-y-4 pt-8">
                    <h3 className="text-xl font-semibold">Hesabını Oluştur</h3>
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>E-posta</FormLabel>
                            <FormControl><Input placeholder="ornek@eposta.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tam Adınız</FormLabel>
                            <FormControl><Input placeholder="Adınız Soyadınız" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Doğum Tarihi</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
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

            {step === 2 && (
                <div className="space-y-4 text-center pt-8">
                    <h3 className="text-xl font-semibold">Profil Fotoğrafı Ekle</h3>
                    <p className="text-muted-foreground text-sm">İlk izlenim önemlidir. Yüzünün net göründüğü bir fotoğraf seç.</p>
                    <FormField control={form.control} name="profilePicture" render={({ field }) => (
                        <FormItem>
                           <FormControl>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-40 h-40 border-4 border-muted rounded-full overflow-hidden flex items-center justify-center bg-muted relative">
                                        {field.value ? (
                                             <Image src={field.value} alt="Profil resmi" width={160} height={160} className="object-cover w-full h-full" />
                                        ): (
                                             <Camera className="h-16 w-16 text-muted-foreground" />
                                        )}
                                    </div>
                                    <Button type="button" onClick={() => document.getElementById('profile-pic-upload')?.click()} disabled={isUploading}>
                                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                                        {isUploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
                                    </Button>
                                    <Input id="profile-pic-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureUpload} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            )}
            
            {step === 3 && (
                 <div className="space-y-6 pt-8">
                    <div>
                        <h3 className="text-xl font-semibold">Biraz Daha Detay</h3>
                        <p className="text-muted-foreground text-sm mt-1">Bu bilgiler profilinde görünecek.</p>
                    </div>
                    <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Cinsiyetiniz</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value="female" /></FormControl>
                                        <FormLabel className="font-normal">Kadın</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value="male" /></FormControl>
                                        <FormLabel className="font-normal">Erkek</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value="other" /></FormControl>
                                        <FormLabel className="font-normal">Diğer</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <div>
                        <FormLabel>Konum</FormLabel>
                        <p className="text-xs text-muted-foreground py-2">Çevrendeki kişileri gösterebilmemiz için konum izni vermen gerekiyor.</p>
                        
                        {location && address ? (
                            <div className="flex items-center justify-center p-3 rounded-md bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                {isGeocoding ? (
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin"/>
                                ) : (
                                    <Building className="h-5 w-5 mr-2"/>
                                )}
                                <span className="text-sm font-medium">Konum: {address}</span>
                            </div>
                        ) : (
                          <>
                            {locationError ? (
                                <div className="space-y-2">
                                <Alert variant="destructive">
                                    <Terminal className="h-4 w-4" />
                                    <AlertTitle>Konum Hatası</AlertTitle>
                                    <AlertDescription>{locationError}</AlertDescription>
                                </Alert>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" variant="outline" className="w-full">
                                            <Map className="mr-2 h-4 w-4"/> Haritadan Seç
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Konumu Manuel Olarak Seç</AlertDialogTitle>
                                            <AlertDialogDescription>
                                            Uygulama, gelecekte burada bir harita görüntüleyerek konumunuzu seçmenize olanak tanıyacaktır. Şimdilik, devam etmek için temsili bir konumu ayarlamak üzere "Ayarla" düğmesine tıklayın.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleManualLocationSelect}>Ayarla</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                </div>
                            ) : (
                                <Button type="button" variant="outline" onClick={handleLocationRequest} className="w-full" disabled={isLoading || isGeocoding}>
                                    {isLoading || isGeocoding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MapPin className="mr-2 h-4 w-4"/>}
                                    {isLoading ? 'Konum Alınıyor...' : 'Konum İzni Ver'}
                                </Button>
                            )}
                          </>
                        )}
                    </div>
                 </div>
            )}

            {step === 4 && (
                 <div className="space-y-4 pt-8 text-center">
                    <h3 className="text-xl font-semibold">Galeri Fotoğrafları</h3>
                    <p className="text-muted-foreground text-sm">
                        Kendine ait, net ve farklı anlarını yansıtan en az 2 fotoğraf daha ekle. 
                        Bu fotoğraflar eşleşme ekranında diğer kullanıcılara gösterilecek.
                    </p>
                    <FormField control={form.control} name="images" render={({ field }) => (
                        <FormItem>
                           <FormControl>
                                <div className="grid grid-cols-3 gap-2">
                                     {field.value.map((src, index) => (
                                         <div key={index} className="relative aspect-square">
                                             <Image src={src} alt={`Eşleşme fotoğrafı ${index+1}`} layout="fill" className="rounded-md object-cover"/>
                                         </div>
                                     ))}
                                     {field.value.length < 9 && (
                                         <label htmlFor="match-pics-upload" className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md cursor-pointer hover:bg-muted">
                                            {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/> : <Upload className="h-8 w-8 text-muted-foreground"/>}
                                            <span className="text-xs text-muted-foreground mt-1">
                                                {isUploading ? 'Yükleniyor...' : 'Yükle'}
                                            </span>
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

            {step === 5 && (
                <div className="space-y-4 pt-8">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold">İlgi Alanların</h3>
                    <p className="text-muted-foreground text-sm">
                        Seni en iyi anlatan en az 5 ilgi alanı seç.
                    </p>
                  </div>
                   <FormField
                      control={form.control}
                      name="interests"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <div className="flex flex-wrap gap-2 justify-center">
                                  {INTERESTS_LIST.map((interest) => (
                                      <Button
                                        key={interest}
                                        type="button"
                                        variant={field.value?.includes(interest) ? "default" : "outline"}
                                        onClick={() => toggleInterest(interest)}
                                        className="rounded-full"
                                      >
                                          {interest}
                                      </Button>
                                  ))}
                              </div>
                          </FormControl>
                           <FormMessage className="text-center"/>
                        </FormItem>
                      )}
                    />
                </div>
            )}

            {step === 6 && (
                 <div className="space-y-4 pt-8">
                    <h3 className="text-xl font-semibold">Neredeyse Bitti!</h3>
                     <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Şifre</FormLabel>
                            <div className="relative">
                                <FormControl><Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} /></FormControl>
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Şifre Tekrar</FormLabel>
                            <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="terms" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Kullanım koşullarını ve gizlilik politikasını kabul ediyorum.</FormLabel>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )} />
                 </div>
            )}
           
            <div className="pt-4">
               {step !== TOTAL_STEPS ? (
                 <Button 
                    type="button"
                    onClick={async () => {
                        const isValid = await form.trigger();
                        if (isValid) {
                            if (step === 2 && isUploading) {
                                toast({ title: "Lütfen Bekleyin", description: "Profil fotoğrafınız hala yükleniyor." });
                                return;
                            }
                            if (step === 2 && !form.getValues("profilePicture")) {
                                toast({ title: "Profil Resmi Gerekli", description: "Lütfen devam etmeden önce bir profil resmi yükleyin.", variant: "destructive" });
                                return;
                            }
                            if(step === 3 && !location) {
                                 toast({ title: "Konum Gerekli", description: "Lütfen devam etmeden önce konum bilginizi paylaşın.", variant: "destructive" });
                                 return;
                            }
                            nextStep();
                        }
                    }}
                    className="w-full h-12 text-base font-bold rounded-full" 
                    disabled={
                        (step === 3 && !location) || 
                        isUploading || 
                        isGeocoding || 
                        (step === 1 && !form.formState.isValid) ||
                        (step === 2 && !form.formState.isValid) ||
                        (step === 3 && !form.formState.isValid) ||
                        (step === 4 && !form.formState.isValid) ||
                        (step === 5 && !form.formState.isValid)
                    }
                 >
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : isGeocoding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    {isUploading ? 'Resim Yükleniyor...' : isGeocoding ? 'Adres Alınıyor...' : 'Devam Et'}
                 </Button>
               ) : (
                <Button 
                    type='submit'
                    className="w-full h-12 text-base font-bold rounded-full" 
                    disabled={isLoading || isUploading}
                >
                    {isLoading || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PartyPopper className="mr-2 h-5 w-5" />}
                    {isLoading || isUploading ? 'Kaydediliyor...' : 'Kaydı Tamamla'}
                </Button>
               )}
            </div>
        </form>
      </Form>
  );
}



