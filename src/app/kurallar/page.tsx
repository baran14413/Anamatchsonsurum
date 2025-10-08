
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Check, ShieldCheck, Heart, User } from 'lucide-react';
import { langTr } from '@/languages/tr';
import { useUser, useFirestore } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';

interface RuleItemProps {
    icon: React.ElementType;
    title: string;
    description: string;
}

const RuleItem: React.FC<RuleItemProps> = ({ icon: Icon, title, description }) => (
    <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
        </div>
        <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    </div>
);

export default function RulesPage() {
    const t = langTr.rules;
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleAgree = async () => {
        if (!user || !firestore) {
            toast({
                title: langTr.common.error,
                description: 'Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, {
                rulesAgreed: true
            });
            router.push('/anasayfa');
        } catch (error) {
            console.error("Failed to update rules agreement:", error);
            toast({
                title: langTr.common.error,
                description: 'Kurallar kabul edilirken bir hata oluştu.',
                variant: 'destructive',
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-dvh flex-col bg-background">
            <main className="flex-1 flex flex-col justify-center p-6 text-center">
                <div className="mx-auto w-full max-w-md space-y-8">
                    <div>
                        <Icons.logo width={120} height={40} className="mx-auto" />
                        <h1 className="mt-6 text-2xl font-bold">{t.welcome}</h1>
                        <p className="text-muted-foreground">{t.description}</p>
                    </div>

                    <div className="space-y-6 text-left">
                        <RuleItem icon={User} title={t.rule1Title} description={t.rule1Desc} />
                        <RuleItem icon={Heart} title={t.rule2Title} description={t.rule2Desc} />
                        <RuleItem icon={ShieldCheck} title={t.rule3Title} description={t.rule3Desc} />
                         <RuleItem icon={Check} title={t.rule4Title} description={t.rule4Desc} />
                    </div>
                </div>
            </main>
            <footer className="sticky bottom-0 border-t bg-background p-4">
                <Button className="w-full h-12 rounded-full text-lg font-bold" onClick={handleAgree} disabled={isLoading}>
                    {isLoading ? <Icons.logo width={24} height={24} className="animate-pulse" /> : t.agree}
                </Button>
            </footer>
        </div>
    );
}
