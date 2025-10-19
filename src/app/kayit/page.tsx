
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { langTr } from '@/languages/tr';
import { Icons } from '@/components/icons';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User, X } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(2, { message: "İsim en az 2 karakter olmalıdır." }),
  email: z.string().email({ message: langTr.login.errors.invalidEmail }),
  password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır.' }),
});

type SignUpFormValues = z.infer<typeof formSchema>;

export default function SignUpPage() {
  const t = langTr;
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    if (!auth) {
      toast({ title: t.login.errors.authServiceError, variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      // The onAuthStateChanged listener in the provider will now catch this new user
      // and redirect them to the rules page or wherever is appropriate next.
      // We can also push them to the next step manually if needed.
       router.push('/kurallar'); // Example redirect after successful creation

    } catch (error: any) {
      setIsSubmitting(false);
      if (error.code === 'auth/email-already-in-use') {
        toast({ title: 'Kayıt Hatası', description: 'Bu e-posta adresi zaten kullanımda. Lütfen giriş yapmayı deneyin.', variant: 'destructive' });
      } else {
        toast({ title: 'Kayıt Hatası', description: error.message, variant: 'destructive' });
      }
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground animated-gradient-bg">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/20 bg-transparent px-4 text-white">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} disabled={isSubmitting}>
          <X className="h-6 w-6" />
        </Button>
      </header>
      <main className="flex-1 flex flex-col justify-center items-center p-6 text-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Kayıt Yap</h1>
            <p className="text-white/80">Yeni bir hesap oluşturarak aramıza katıl.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adın</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                        <Input type="text" placeholder="Adını gir" className="pl-10 h-12 bg-white/10 border-white/30 placeholder:text-white/60 focus:ring-white/80" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {isSubmitting ? <Icons.logo width={24} height={24} className="animate-pulse" /> : 'Hesap Oluştur'}
              </Button>
            </form>
          </Form>
           <p className="text-center text-sm text-white/80">
              Zaten bir hesabın var mı?{' '}
              <Link href="/giris" className="font-semibold text-white hover:underline">
                Giriş Yap
              </Link>
            </p>
        </div>
      </main>
    </div>
  );
}
