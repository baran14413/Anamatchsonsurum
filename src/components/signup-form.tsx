"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc } from "firebase/firestore";
import { useAuth, useFirestore, setDocumentNonBlocking } from "@/firebase";

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
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  email: z.string().email({ message: "Geçerli bir e-posta adresi girin." }),
  password: z.string().min(8, { message: "Şifre en az 8 karakter olmalıdır." })
    .regex(/[a-z]/, { message: "Şifre en az bir küçük harf içermelidir." })
    .regex(/[A-Z]/, { message: "Şifre en az bir büyük harf içermelidir." })
    .regex(/[0-9]/, { message: "Şifre en az bir rakam içermelidir." })
    .regex(/[^a-zA-Z0-9]/, { message: "Şifre en az bir özel karakter içermelidir." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor.",
  path: ["confirmPassword"],
});

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (!password) return 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
};

export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange"
  });
  
  const passwordValue = form.watch("password");
  const passwordStrength = getPasswordStrength(passwordValue);
  const strengthPercentage = passwordStrength > 0 ? (passwordStrength / 5) * 100 : 0;
  
  const strengthColors: { [key: number]: string } = {
    0: "bg-transparent",
    1: "bg-red-500",
    2: "bg-orange-500",
    3: "bg-yellow-500",
    4: "bg-green-400",
    5: "bg-green-500",
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      
      const userDocRef = doc(firestore, "users", userCredential.user.uid);
      
      setDocumentNonBlocking(userDocRef, {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        createdAt: new Date(),
        profileComplete: false,
      }, { merge: true });

      toast({
        title: "Kayıt Başarılı!",
        description: "Hesabınız oluşturuldu. Maceraya hazırsın!",
      });
      router.push("/anasayfa");
    } catch (error: any) {
        let description = "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
        if (error.code === 'auth/email-already-in-use') {
            description = "Bu e-posta adresi zaten kullanılıyor.";
        }
      toast({
        title: "Kayıt Başarısız",
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl>
                  <Input placeholder="ornek@eposta.com" {...field} className="bg-white/50 dark:bg-black/20" />
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
                <FormLabel>Şifre</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} className="bg-white/50 dark:bg-black/20"/>
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                 {passwordValue && (
                  <div className="space-y-1 pt-1">
                    <Progress value={strengthPercentage} className={'h-1.5'} indicatorClassName={strengthColors[passwordStrength]} />
                    <p className="text-xs text-muted-foreground">
                      Şifre gücü
                    </p>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Şifre Tekrar</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} className="bg-white/50 dark:bg-black/20"/>
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full h-12 text-base font-bold rounded-full mt-6" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kayıt Ol ve Başla
          </Button>
        </form>
      </Form>
  );
}
