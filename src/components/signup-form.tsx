
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
import { Loader2, Eye, EyeOff, MapPin, Camera, Upload, ArrowLeft, Check, PartyPopper } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import Image from "next/image";

const TOTAL_STEPS = 5;

// Step 1 Schema
const step1Schema = z.object({
  email: z.string().email({ message: "Geçerli bir e-posta adresi girin." }),
  fullName: z.string().min(3, { message: "Kullanıcı adı en az 3 karakter olmalıdır." }),
  dateOfBirth: z.string().refine((dob) => new Date(dob) < new Date(), { message: "Doğum tarihi geçmiş bir tarih olmalıdır."}),
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
    matchPictures: z.array(z.string().url()).min(2, { message: "Lütfen en az 2 fotoğraf yükleyin." }),
});

// Step 5 Schema
const step5Schema = z.object({
  password: z.string().min(8, { message: "Şifre en az 8 karakter olmalıdır." }),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, { message: "Kullanım koşullarını kabul etmelisiniz."}),
}).refine(data => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor.",
  path: ["confirmPassword"],
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
  
  const auth = useAuth();
  const firestore = useFirestore();

  // Store the final Cloudinary URL separately
  const [finalProfilePictureUrl, setFinalProfilePictureUrl] = useState<string>('');

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
      fullName: "",
      dateOfBirth: "",
      profilePicture: "",
      gender: undefined,
      matchPictures: [],
      password: "",
      confirmPassword: "",
      terms: false,
    }
  });

  const uploadFile = async (file: File) => {
    // This function can still indicate loading for individual file uploads if needed
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
        // 1. Show local preview immediately
        const localUrl = URL.createObjectURL(file);
        form.setValue("profilePicture", localUrl, { shouldValidate: true });

        // 2. Start upload in the background
        setIsUploading(true);
        uploadFile(file).then(cloudinaryUrl => {
            if (cloudinaryUrl) {
                // 3. Store the final URL when ready
                setFinalProfilePictureUrl(cloudinaryUrl);
                // Optional: Revoke the local URL to free up memory if the user navigates away
                // URL.revokeObjectURL(localUrl); 
            }
            setIsUploading(false);
        });
    }
  };

  const handleMatchPicturesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const currentPictures = form.getValues("matchPictures") || [];
        if(currentPictures.length + files.length > 5) {
            toast({ title: "Hata", description: "En fazla 5 fotoğraf yükleyebilirsiniz.", variant: "destructive" });
            return;
        }

        const uploadPromises = Array.from(files).map(file => uploadFile(file));
        const urls = await Promise.all(uploadPromises);
        const validUrls = urls.filter((url): url is string => url !== null);
        
        form.setValue("matchPictures", [...currentPictures, ...validUrls], { shouldValidate: true });
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);
  
  const handleNextStep = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      if (step === 2 && isUploading) {
        toast({
          title: "Lütfen Bekleyin",
          description: "Profil fotoğrafınız hala yükleniyor.",
        });
        return;
      }
      nextStep();
    }
  }

  const onFinalSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);

    if (isUploading) {
        toast({ title: "Lütfen Bekleyin", description: "Resimler hala yükleniyor.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    if (!finalProfilePictureUrl) {
        toast({ title: "Profil Resmi Eksik", description: "Lütfen profil resminizin yüklenmesini bekleyin veya tekrar yükleyin.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        const userDocRef = doc(firestore, "users", user.uid);
        
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            await setDoc(userDocRef, {
                uid: user.uid,
                email: data.email,
                fullName: data.fullName,
                dateOfBirth: data.dateOfBirth,
                profilePicture: finalProfilePictureUrl, // Use the final URL
                gender: data.gender,
                images: data.matchPictures,
                location: { latitude, longitude },
                createdAt: new Date(),
                profileComplete: true,
            });

            toast({
                title: "Kayıt Tamamlandı!",
                description: "Hesabın oluşturuldu. Maceraya hazırsın!",
                className: "bg-green-500 text-white",
            });
            router.push("/anasayfa");

        }, (error) => {
            setLocationError("Konum bilgisi alınamadı. Kayıt tamamlanamadı.");
            setIsLoading(false);
        });

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
                            <FormLabel>Kullanıcı Adı</FormLabel>
                            <FormControl><Input placeholder="benzersiz_kullanici_adin" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Doğum Tarihi</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
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
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="h-8 w-8 animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <Button type="button" onClick={() => document.getElementById('profile-pic-upload')?.click()} disabled={isUploading}>
                                        <Upload className="mr-2 h-4 w-4" /> Fotoğraf Yükle
                                    </Button>
                                    <Input id="profile-pic-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureUpload} disabled={isUploading} />
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
                        <FormLabel>Konum İzni</FormLabel>
                        <p className="text-xs text-muted-foreground py-2">Çevrendeki kişileri gösterebilmemiz için konum izni vermen gerekiyor. Bu adımı geçmek için "Devam Et" butonuna tıkla.</p>
                        {locationError && (
                          <Alert variant="destructive" className="mt-2">
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>Konum Hatası</AlertTitle>
                            <AlertDescription>{locationError}</AlertDescription>
                          </Alert>
                        )}
                    </div>
                 </div>
            )}

            {step === 4 && (
                 <div className="space-y-4 pt-8 text-center">
                    <h3 className="text-xl font-semibold">Eşleşme Fotoğrafları</h3>
                    <p className="text-muted-foreground text-sm">
                        Kendine ait, net ve farklı anlarını yansıtan en az 2 fotoğraf daha ekle. 
                        Bu fotoğraflar eşleşme ekranında diğer kullanıcılara gösterilecek.
                    </p>
                    <FormField control={form.control} name="matchPictures" render={({ field }) => (
                        <FormItem>
                           <FormControl>
                                <div className="grid grid-cols-3 gap-2">
                                     {field.value.map((src, index) => (
                                         <div key={index} className="relative aspect-square">
                                             <Image src={src} alt={`Eşleşme fotoğrafı ${index+1}`} layout="fill" className="rounded-md object-cover"/>
                                         </div>
                                     ))}
                                     {field.value.length < 5 && (
                                         <label htmlFor="match-pics-upload" className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md cursor-pointer hover:bg-muted">
                                            <Upload className="h-8 w-8 text-muted-foreground"/>
                                            <span className="text-xs text-muted-foreground mt-1">Yükle</span>
                                         </label>
                                     )}
                                     <Input id="match-pics-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleMatchPicturesUpload} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            )}

            {step === 5 && (
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
               <Button 
                type={step === TOTAL_STEPS ? 'submit' : 'button'}
                onClick={step !== TOTAL_STEPS ? handleNextStep : undefined}
                className="w-full h-12 text-base font-bold rounded-full" 
                disabled={isLoading || (step === 2 && isUploading)}
               >
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 {step === TOTAL_STEPS ? (
                     <>
                        <PartyPopper className="mr-2 h-5 w-5" />
                        Kaydı Tamamla
                     </>
                 ) : (
                    "Devam Et"
                 )}
               </Button>
            </div>
        </form>
      </Form>
  );
}

