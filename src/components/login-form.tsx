
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { useAuth, useFirestore } from "@/firebase";
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
import { Loader2, Eye, EyeOff, ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { langTr } from "@/languages/tr";
import Image from 'next/image';
import googleLogo from '@/img/googlelogin.png';
import { doc, setDoc } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const getSchema = (t: any) => z.object({
  email: z.string().email({ message: t.login.errors.invalidEmail }),
  password: z.string().optional(),
});

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [showGoogleRedirectDialog, setShowGoogleRedirectDialog] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const t = langTr;
  const formSchema = getSchema(t);

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
        title: t.common.error,
        description: t.login.errors.authServiceError,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const methods = await fetchSignInMethodsForEmail(auth, emailValue);
      if (methods.length === 0) {
        form.setError("email", { type: "manual", message: t.login.errors.emailNotRegistered });
      } else if (methods.includes('password')) {
        setStep('password');
      } else if (methods.includes('google.com')) {
        setShowGoogleRedirectDialog(true);
      } else {
        // Fallback for other providers if any
        form.setError("email", { type: "manual", message: t.login.errors.otherProvider.replace('{provider}', methods.join(', ')) });
      }
    } catch (error: any) {
        if (error.code === 'auth/invalid-email') {
            form.setError("email", { type: "manual", message: t.login.errors.invalidEmail });
        } else {
            toast({
                title: t.common.error,
                description: t.login.errors.emailCheckError,
                variant: "destructive"
            });
        }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    if (!auth || !firestore) {
      toast({ title: t.common.error, description: t.login.errors.authServiceError, variant: "destructive" });
      setIsLoading(false);
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user profile exists, if not, create it (first time Google login)
        const userDocRef = doc(firestore, "users", user.uid);
        await setDoc(userDocRef, {
            uid: user.uid,
            fullName: user.displayName,
            email: user.email,
            profilePicture: user.photoURL,
        }, { merge: true });

        router.push("/anasayfa");
    } catch (error: any) {
        toast({
            title: t.login.errors.googleLoginFailedTitle,
            description: error.message || t.login.errors.googleLoginFailed,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
        setShowGoogleRedirectDialog(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!values.password) return;
    setIsLoading(true);
    if (!auth) {
      toast({
        title: t.common.error,
        description: t.login.errors.authServiceError,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push("/anasayfa");
    } catch (error: any) {
      form.setError("password", { type: "manual", message: t.login.errors.wrongPassword });
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
            <h1 className="text-xl font-bold">{t.login.title}</h1>
      </header>
       <div className="flex-1 flex flex-col p-6 overflow-y-auto">
         <div className="flex-1 flex flex-col">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {step === 'email' ? (
                <>
                    <h1 className="text-3xl font-bold">{t.login.emailStepTitle}</h1>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                          <FormItem>
                          <FormControl>
                              <Input placeholder={t.login.emailPlaceholder} {...field} className="h-12 text-lg border-0 border-b-2 rounded-none px-0" />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    <p className="text-sm text-muted-foreground flex items-center gap-2 pt-2">
                        {t.login.emailHint}
                        <Heart className="h-4 w-4 text-red-500 fill-current" />
                    </p>
                </>
                ) : (
                <>
                    <div className="flex justify-between items-center bg-muted p-3 rounded-lg">
                        <span className="text-muted-foreground">{emailValue}</span>
                        <Button variant="link" size="sm" onClick={() => setStep('email')}>{t.login.change}</Button>
                    </div>
                    <h1 className="text-3xl font-bold">{t.login.passwordStepTitle}</h1>
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <div className="relative">
                            <FormControl>
                            <Input type={showPassword ? "text" : "password"} placeholder={t.login.passwordPlaceholder} {...field} className="h-12 text-lg border-0 border-b-2 rounded-none px-0" autoFocus/>
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
                {step === 'email' ? t.common.next : t.login.title}
            </Button>

            <div className="mt-6 text-center text-sm text-muted-foreground">
                {t.login.noAccount}{" "}
                <Link
                    href={`/kayit-ol`}
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                    {t.login.signupNow}
                </Link>
            </div>
        </div>
      </div>
      <AlertDialog open={showGoogleRedirectDialog} onOpenChange={setShowGoogleRedirectDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t.login.errors.googleRedirectTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t.login.errors.googleRedirectDescription}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                 <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={handleGoogleSignIn} disabled={isLoading}>
                   {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                    <Image src={googleLogo} alt="Google logo" width={20} height={20} className="mr-2" />
                   }
                   {t.welcome.continueWithGoogle}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    