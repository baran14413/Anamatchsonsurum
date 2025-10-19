
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase/provider';
import {
  fetchSignInMethodsForEmail,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { Icons } from '@/components/icons';
import { langTr } from '@/languages/tr';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AnimatePresence, motion } from 'framer-motion';

const emailSchema = z.object({
  email: z.string().email({ message: langTr.login.errors.invalidEmail }),
});

const passwordSchema = z.object({
    password: z.string().min(1, { message: "Şifre boş olamaz." }),
});

const signupSchema = z.object({
  password: z.string().min(6, { message: "Şifre en az 6 karakter olmalıdır." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: langTr.login.errors.passwordMismatch,
  path: ["confirmPassword"],
});


export default function LoginPage() {
  const router = useRouter();
  const { auth, user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const t = langTr.login;

  const [step, setStep] = useState<'email' | 'password' | 'signup'>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/profilini-tamamla');
    }
  }, [user, router]);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
     defaultValues: { password: '' },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handleEmailSubmit = async ({ email }: z.infer<typeof emailSchema>) => {
    if (!auth) return;
    setIsLoading(true);
    setEmail(email);

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        if(methods.includes('google.com')) {
           toast({
             title: t.errors.googleRedirectTitle,
             description: t.errors.googleRedirectDescription,
             variant: "destructive",
           });
           setIsLoading(false);
           return;
        }
        setStep('password');
      } else {
        setStep('signup');
      }
    } catch (error: any) {
      toast({ title: t.errors.emailCheckError, description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async ({ password }: z.infer<typeof passwordSchema>) => {
    if (!auth) return;
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/profilini-tamamla');
    } catch (error: any) {
      toast({ title: t.errors.wrongPassword, description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async ({ password }: z.infer<typeof signupSchema>) => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      const userDocRef = doc(firestore, "users", newUser.uid);
      await setDoc(userDocRef, {
        uid: newUser.uid,
        email: newUser.email,
        createdAt: serverTimestamp(),
        isBot: false,
      });

      router.push('/profilini-tamamla');
    } catch (error: any) {
      toast({ title: "Kayıt Başarısız", description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const goBack = () => {
    if (step === 'email') {
        router.back();
    } else {
        setStep('email');
        passwordForm.reset();
        signupForm.reset();
    }
  }

  const renderStep = () => {
    switch(step) {
      case 'email':
        return (
          <motion.div key="email" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-6">
                <h1 className="text-2xl font-bold">{t.emailStepTitle}</h1>
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                         <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input type="email" placeholder={t.emailPlaceholder} className="pl-10 h-12" {...field} />
                         </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                  {isLoading ? <Icons.logo className="h-6 w-6 animate-pulse" /> : langTr.common.next}
                </Button>
              </form>
            </Form>
          </motion.div>
        );
      case 'password':
        return (
          <motion.div key="password" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
                <h1 className="text-2xl font-bold">{t.passwordStepTitle}</h1>
                 <p className='text-muted-foreground text-sm'>
                    <span className='font-semibold'>{email}</span> e-postası için şifrenizi girin. 
                    <button type="button" onClick={goBack} className='text-primary hover:underline ml-1'>{t.change}</button>
                 </p>
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                       <FormControl>
                         <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input type="password" placeholder={t.passwordPlaceholder} className="pl-10 h-12" {...field} />
                         </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                   {isLoading ? <Icons.logo className="h-6 w-6 animate-pulse" /> : langTr.common.goToLogin}
                </Button>
              </form>
            </Form>
          </motion.div>
        );
      case 'signup':
        return (
          <motion.div key="signup" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(handleSignupSubmit)} className="space-y-6">
                <h1 className="text-2xl font-bold">{t.createPasswordTitle}</h1>
                <p className='text-muted-foreground text-sm'>
                    <span className='font-semibold'>{email}</span> için yeni bir hesap oluşturuyorsunuz.
                    <button type="button" onClick={goBack} className='text-primary hover:underline ml-1'>{t.change}</button>
                </p>
                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şifre</FormLabel>
                       <FormControl>
                         <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input type="password" placeholder={t.passwordPlaceholder} className="pl-10 h-12" {...field} />
                         </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.confirmPasswordLabel}</FormLabel>
                      <FormControl>
                         <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                           <Input type="password" placeholder={t.passwordPlaceholder} className="pl-10 h-12" {...field} />
                         </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                   {isLoading ? <Icons.logo className="h-6 w-6 animate-pulse" /> : langTr.common.next}
                </Button>
              </form>
            </Form>
          </motion.div>
        );
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">{t.title}</h1>
        <div className="w-9"></div>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
            <AnimatePresence mode="wait">
             {renderStep()}
            </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
