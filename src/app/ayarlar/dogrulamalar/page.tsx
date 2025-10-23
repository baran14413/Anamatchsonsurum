
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MailCheck, MailWarning, Send, Camera, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { sendEmailVerification } from 'firebase/auth';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
    const isPhotoVerified = false; // Placeholder

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
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           {isEmailVerified ? <MailCheck className="w-6 h-6 text-green-500" /> : <MailWarning className="w-6 h-6 text-yellow-500" />}
                           E-posta Doğrulaması
                        </CardTitle>
                        <CardDescription>Hesabınızın güvenliğini artırmak ve tüm özelliklere erişmek için e-posta adresinizi doğrulayın.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isEmailVerified ? (
                            <div className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                                <MailCheck className="h-6 w-6 text-green-600" />
                                <div className="flex-1">
                                    <p className="font-semibold text-green-800 dark:text-green-300">E-postanız Doğrulandı</p>
                                    <p className="text-sm text-green-600 dark:text-green-400">{user?.email}</p>
                                </div>
                            </div>
                        ) : (
                             <div className="space-y-4">
                                <div className="flex items-center gap-3 rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
                                    <MailWarning className="h-6 w-6 text-yellow-600" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-yellow-800 dark:text-yellow-300">E-postanız Doğrulanmadı</p>
                                        <p className="text-sm text-yellow-600 dark:text-yellow-400">Lütfen e-postanızı doğrulayın.</p>
                                    </div>
                                </div>
                                <Button onClick={handleSendVerificationEmail} disabled={isSending || cooldown > 0}>
                                    {isSending ? (
                                        <>
                                            <Icons.logo width={16} height={16} className="mr-2 animate-pulse" />
                                            Gönderiliyor...
                                        </>
                                    ) : cooldown > 0 ? (
                                        <>
                                            Tekrar Gönder ({cooldown}s)
                                        </>
                                    ) : (
                                        <>
                                            <Send className='mr-2 h-4 w-4' />
                                            Doğrulama E-postası Gönder
                                        </>
                                    )}
                                </Button>
                             </div>
                        )}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           {isPhotoVerified ? <ShieldCheck className="w-6 h-6 text-green-500" /> : <Camera className="w-6 h-6 text-blue-500" />}
                           Profil Fotoğrafı Doğrulaması
                        </CardTitle>
                        <CardDescription>Profilinin gerçekliğini kanıtla ve diğer kullanıcılarda güven oluştur. Mavi tik rozetini kap!</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isPhotoVerified ? (
                            <div className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                                <ShieldCheck className="h-6 w-6 text-green-600" />
                                <div className="flex-1">
                                    <p className="font-semibold text-green-800 dark:text-green-300">Profilin Doğrulandı</p>
                                    <p className="text-sm text-green-600 dark:text-green-400">Profilinde mavi tik rozetin görünüyor.</p>
                                </div>
                            </div>
                        ) : (
                             <div className="space-y-4">
                                <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                                    <Camera className="h-6 w-6 text-blue-600" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-blue-800 dark:text-blue-300">Profilin Doğrulanmadı</p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400">Profilini doğrulayarak daha fazla güven kazan.</p>
                                    </div>
                                </div>
                                <Link href="/ayarlar/dogrulamalar/yuz">
                                    <Button className={cn('bg-blue-500 hover:bg-blue-600')}>
                                        <Camera className='mr-2 h-4 w-4' />
                                        Şimdi Doğrula
                                    </Button>
                                </Link>
                             </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
