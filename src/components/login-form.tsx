"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: langTr.login.errors.invalidEmail }),
  password: z.string().min(1, { message: langTr.login.errors.wrongPassword }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginForm() {
  const t = langTr;
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    if (!auth) {
      toast({
        title: t.common.error,
        description: t.login.errors.authServiceError,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      // The AppShell component will handle redirecting to /anasayfa on successful login
    } catch (error: any) {
      let description = t.login.errors.wrongPassword;
      switch (error.code) {
        case 'auth/user-not-found':
          description = t.login.errors.emailNotRegistered;
          break;
        case 'auth/wrong-password':
          description = t.login.errors.wrongPassword;
          break;
        case 'auth/invalid-email':
          description = t.login.errors.invalidEmail;
          break;
      }
      toast({
        title: 'Giriş Başarısız',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-posta</FormLabel>
              <FormControl>
                <Input placeholder="ornek@mail.com" {...field} />
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
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Giriş Yap
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              veya
            </span>
          </div>
        </div>
        
        <div className='text-center text-sm'>
            <p className='text-muted-foreground'>
                {t.login.noAccount}{' '}
                <Link href="/kurallar" className="font-semibold text-primary hover:underline">
                    {t.login.signupNow}
                </Link>
            </p>
        </div>
      </form>
    </Form>
  );
}
