'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { ArrowLeft, Mail, Send } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: "Lütfen geçerli bir e-posta adresi girin." }),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    if (!auth) {
      toast({ title: "Hata", description: "Kimlik doğrulama hizmeti yüklenemedi.", variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      toast({
        title: 'Sıfırlama E-postası Gönderildi',
        description: 'Lütfen e-posta kutunuzu (spam klasörünü de) kontrol edin ve şifrenizi sıfırlamak için bağlantıya tıklayın.',
      });
      router.push('/giris');
    } catch (error: any) {
      toast({ title: 'Hata', description: "Şifre sıfırlama e-postası gönderilirken bir sorun oluştu. Lütfen e-posta adresinizi kontrol edin.", variant: 'destructive' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b-0 bg-transparent px-4 text-foreground">
        <Button variant="ghost" size="icon" onClick={() => router.back()} disabled={isSubmitting}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </header>
      <main className="flex-1 flex flex-col justify-center items-center p-6 text-foreground">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Şifreni Sıfırla</h1>
            <p className="text-muted-foreground">Kayıtlı e-posta adresini girerek şifreni sıfırlayabilirsin.</p>
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
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="email" placeholder="E-posta adresini gir" className="pl-10 h-12 bg-secondary border-border placeholder:text-muted-foreground focus:ring-ring" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 rounded-full font-bold text-lg" disabled={isSubmitting}>
                {isSubmitting ? <Icons.logo width={24} height={24} className="animate-pulse" /> : 
                <>
                    <Send className="mr-2 h-5 w-5" />
                    Sıfırlama Linki Gönder
                </>
                }
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
