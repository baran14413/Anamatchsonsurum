'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MailCheck, ShieldCheck, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendEmailVerification } from 'firebase/auth';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';

const VerificationItem = ({ icon: Icon, title, description, isVerified, actionText, onAction, disabled = false }: {
    icon: React.ElementType;
    title: string;
    description: string;
    isVerified: boolean;
    actionText: string;
    onAction?: () => void;
    disabled?: boolean;
}) => {
    const content = (
        <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {isVerified ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                    <ShieldCheck className="w-4 h-4 mr-1" />
                    Doğrulandı
                </Badge>
            ) : (
                <Button variant="ghost" size="sm" disabled={disabled} onClick={onAction}>
                    {disabled ? (
                        <>
                            <Icons.logo width={16} height={16} className="mr-2 animate-pulse" />
                            Gönderiliyor...
                        </>
                    ) : (
                       actionText
                    )}
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            )}
        </div>
    );

    return <div onClick={!isVerified ? onAction : undefined}>{content}</div>;
};


export default function VerificationsPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const handleSendVerificationEmail = async () => {
        if (!user || user.emailVerified || isSending || cooldown > 0) return;

        setIsSending(true);
        try {
            await sendEmailVerification(user);
            toast({
                title: 'E-posta Gönderildi',
                description: 'Lütfen e-posta kutunuzu (spam klasörünü de) kontrol edin ve doğrulama bağlantısına tıklayın.',
            });
            
            // Start cooldown
            setCooldown(60);
            const interval = setInterval(() => {
                setCooldown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (error: any) {
            console.error("Error sending verification email:", error);
            toast({
                title: 'Hata',
                description: `E-posta gönderilirken bir sorun oluştu: ${error.message}`,
                variant: 'destructive',
            });
        } finally {
            setIsSending(false);
        }
    };

    if (isUserLoading) {
        return (
             <div className="flex h-dvh items-center justify-center bg-background">
                <Icons.logo width={48} height={48} className="animate-pulse" />
            </div>
        )
    }

    const isEmailVerified = user?.emailVerified ?? false;

    return (
        <div className="flex h-dvh flex-col">
             <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Doğrulamalar</h1>
                <div className='w-9'></div>
            </header>
            <main className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="divide-y border rounded-lg">
                    <VerificationItem
                        icon={MailCheck}
                        title="E-posta Doğrulaması"
                        description={isEmailVerified ? user?.email || 'E-posta adresiniz doğrulandı' : 'Hesap güvenliğinizi artırın'}
                        isVerified={isEmailVerified}
                        actionText={cooldown > 0 ? `Tekrar Gönder (${cooldown}s)` : 'Doğrulama E-postası Gönder'}
                        onAction={handleSendVerificationEmail}
                        disabled={isSending || cooldown > 0}
                    />
                </div>
            </main>
        </div>
    )
}
