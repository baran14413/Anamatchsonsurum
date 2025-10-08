
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { langTr } from '@/languages/tr';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import * as LucideIcons from 'lucide-react';

const interestCategories = langTr.signup.step11.categories;

type IconName = keyof Omit<typeof LucideIcons, 'createLucideIcon' | 'LucideIcon'>;

export default function EditInterestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile } = useUser();
  const firestore = useFirestore();

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile?.interests) {
      setSelectedInterests(userProfile.interests);
    }
  }, [userProfile]);

  const handleInterestToggle = (interest: string, categoryOptions: string[]) => {
    setSelectedInterests((prev) => {
      const isSelected = prev.includes(interest);
      if (isSelected) {
        return prev.filter((i) => i !== interest);
      }

      const interestsInCategory = prev.filter(i => categoryOptions.includes(i));
      if (interestsInCategory.length >= 2) {
        toast({
          title: `Limit Aşıldı`,
          description: `Bu kategoriden en fazla 2 ilgi alanı seçebilirsin.`,
          variant: 'destructive',
        });
        return prev;
      }

      return [...prev, interest];
    });
  };

  const handleSaveChanges = async () => {
    if (!user || !firestore) {
      toast({
        title: 'Hata',
        description: 'Kullanıcı oturumu bulunamadı.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        interests: selectedInterests,
      });
      toast({
        title: 'Başarılı',
        description: 'İlgi alanların güncellendi.',
      });
      router.back();
    } catch (error) {
      console.error('Failed to update interests:', error);
      toast({
        title: 'Hata',
        description: 'İlgi alanları güncellenirken bir sorun oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} disabled={isSubmitting}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">İlgi Alanlarını Düzenle</h1>
        <Button onClick={handleSaveChanges} disabled={isSubmitting}>
          {isSubmitting ? <Icons.logo width={24} height={24} className="animate-pulse" /> : langTr.common.save}
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">İlgini çeken konular neler?</h2>
            <p className="text-muted-foreground">
              Profilinde sergilemek için ilgi alanlarını seç. Her kategoriden en fazla 2 tane seçebilirsin.
            </p>
          </div>

          <Accordion type="multiple" defaultValue={interestCategories.map(c => c.title)} className="w-full">
            {interestCategories.map((category) => {
              const Icon = LucideIcons[category.icon as IconName] as React.ElementType || LucideIcons.Sparkles;
              return (
                <AccordionItem value={category.title} key={category.title}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span>{category.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2">
                      {category.options.map((interest) => (
                        <Badge
                          key={interest}
                          variant={selectedInterests.includes(interest) ? 'default' : 'secondary'}
                          onClick={() => handleInterestToggle(interest, category.options)}
                          className="cursor-pointer text-base py-1 px-3"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>
      </main>
    </div>
  );
}
