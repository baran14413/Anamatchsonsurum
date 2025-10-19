
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { langTr } from '@/languages/tr';
import { Icons } from '@/components/icons';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: langTr.login.errors.invalidEmail }),
  password: z.string().min(1, { message: 'Şifre boş olamaz.' }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const t = langTr;
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (!auth) {
      toast({ title: t.login.errors.authServiceError, variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      // onAuthStateChanged in provider will handle redirect
    } catch (error: any) {
      setIsSubmitting(false);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast({ title: 'Giriş Başarısız', description: 'E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.', variant: 'destructive' });
      } else {
        toast({ title: t.login.errors.emailCheckError, description: error.message, variant: 'destructive' });
      }
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground animated-gradient-bg">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/20 bg-transparent px-4 text-white">
        <Button variant="ghost" size="icon" onClick={() => router.back()} disabled={isSubmitting}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </header>
      <main className="flex-1 flex flex-col justify-center items-center p-6 text-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Tekrar Hoş Geldin!</h1>
            <p className="text-white/80">Hesabına giriş yaparak maceraya devam et.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta Adresi</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                        <Input type="email" placeholder={t.login.emailPlaceholder} className="pl-10 h-12 bg-white/10 border-white/30 placeholder:text-white/60 focus:ring-white/80" {...field} />
                      </div>
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
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                        <Input type={showPassword ? 'text' : 'password'} placeholder={t.login.passwordPlaceholder} className="pl-10 pr-10 h-12 bg-white/10 border-white/30 placeholder:text-white/60 focus:ring-white/80" {...field} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                          {showPassword ? <EyeOff className="h-5 w-5 text-white/60" /> : <Eye className="h-5 w-5 text-white/60" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 rounded-full font-bold text-lg bg-white text-red-600 hover:bg-gray-200" disabled={isSubmitting}>
                {isSubmitting ? <Icons.logo width={24} height={24} className="animate-pulse" /> : 'Giriş Yap'}
              </Button>
            </form>
          </Form>
           <p className="text-center text-sm text-white/80">
              {t.login.noAccount}{' '}
              <Link href="/profilini-tamamla" className="font-semibold text-white hover:underline">
                {t.login.signupNow}
              </Link>
            </p>
        </div>
      </main>
    </div>
  );
}
