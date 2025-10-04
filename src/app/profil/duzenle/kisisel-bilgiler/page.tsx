
'use client';

import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { Loader2, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { langTr } from '@/languages/tr';

const profileSchema = z.object({
  fullName: z.string().min(3, { message: "İsim en az 3 karakter olmalıdır." }),
  bio: z.string().max(150, { message: "Biyografi en fazla 150 karakter olabilir." }).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function KisiselBilgilerPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const t = langTr.ayarlarPersonalInfo;

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isDocLoading, error } = useDoc(userProfileRef);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        fullName: userProfile.fullName || '',
        bio: userProfile.bio || '',
      });
    }
  }, [userProfile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!userProfileRef) return;
    
    try {
      await updateDoc(userProfileRef, {
        fullName: data.fullName,
        bio: data.bio,
      });
      toast({
        title: t.toasts.successTitle,
        description: t.toasts.successDesc,
      });
    } catch (error) {
      toast({
        title: t.toasts.errorTitle,
        description: t.toasts.errorDesc,
        variant: "destructive",
      });
    }
  };

  const isLoading = form.formState.isSubmitting || isDocLoading;

  if (isDocLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            {t.title}
          </CardTitle>
          <CardDescription>
            {t.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.nameLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.namePlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.bioLabel}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t.bioPlaceholder}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.button}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
