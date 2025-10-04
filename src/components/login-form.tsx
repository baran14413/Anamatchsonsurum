
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Icons } from "./icons";

const formSchema = z.object({
  email: z.string().email({ message: "Geçerli bir e-posta adresi girin." }),
  password: z.string().optional(),
});

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'email' | 'password'>('email');
  const auth = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange"
  });

  const emailValue = form.watch("email");

  const checkEmailExists = async () => {
    const isValid = await form.trigger("email");
    if (!isValid) return;

    setIsLoading(true);
    if (!auth) {
      toast({
        title: "Hata",
        description: "Kimlik doğrulama hizmeti yüklenemedi.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const methods = await fetchSignInMethodsForEmail(auth, emailValue);
      if (methods.length > 0) {
        // Email exists, proceed to password step
        setStep('password');
      } else {
        // Email does not exist
        form.setError("email", { type: "manual", message: "Bu e-posta kayıtlı değil. Lütfen önce kayıt olunuz." });
      }
    } catch (error: any) {
        // Handle specific errors, like invalid email format
        if (error.code === 'auth/invalid-email') {
            form.setError("email", { type: "manual", message: "Geçersiz e-posta adresi." });
        } else {
            // Handle other potential errors (network, etc.)
            toast({
                title: "Bir hata oluştu",
                description: "E-posta kontrol edilirken bir sorun yaşandı. Lütfen tekrar deneyin.",
                variant: "destructive"
            });
        }
    } finally {
      setIsLoading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!values.password) return; // Should not happen in password step
    setIsLoading(true);
    if (!auth) {
      toast({
        title: "Hata",
        description: "Kimlik doğrulama hizmeti yüklenemedi.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push("/anasayfa");
    } catch (error: any) {
      form.setError("password", { type: "manual", message: "Şifreniz yanlış. Lütfen tekrar deneyin." });
    } finally {
      setIsLoading(false);
    }
  }

  const handleBack = () => {
    if (step === 'password') {
        setStep('email');
        form.clearErrors();
        form.setValue('password', '');
    } else {
        router.back();
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">E-posta ile Giriş</h1>
      </header>
       <div className="flex-1 flex flex-col p-6 overflow-y-auto">
         <div className="flex-1 flex flex-col">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {step === 'email' ? (
                <>
                    <h1 className="text-3xl font-bold">E-postan nedir?</h1>
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Input placeholder="E-posta adresini gir" {...field} className="h-12 text-lg border-0 border-b-2 rounded-none px-0" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </>
                ) : (
                <>
                    <div className="flex justify-between items-center bg-muted p-3 rounded-lg">
                        <span className="text-muted-foreground">{emailValue}</span>
                        <Button variant="link" size="sm" onClick={() => setStep('email')}>Değiştir</Button>
                    </div>
                    <h1 className="text-3xl font-bold">Şifreni gir</h1>
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <div className="relative">
                            <FormControl>
                            <Input type={showPassword ? "text" : "password"} placeholder="Şifreni gir" {...field} className="h-12 text-lg border-0 border-b-2 rounded-none px-0" autoFocus/>
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
                </>
                )}
            </form>
            </Form>
        </div>
        <div className="shrink-0 pt-6">
            <Button
                type="button"
                onClick={step === 'email' ? checkEmailExists : form.handleSubmit(onSubmit)}
                className="w-full h-14 rounded-full text-lg font-bold"
                disabled={isLoading}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {step === 'email' ? 'Devam Et' : 'Giriş Yap'}
            </Button>

            <div className="mt-6 text-center text-sm text-muted-foreground">
                Henüz hesabın yokmu?{" "}
                <Link
                    href="/kayit-ol"
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                    O zaman kayıt ol
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
