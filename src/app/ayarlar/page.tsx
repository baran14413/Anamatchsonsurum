
'use client';

import { useUser } from '@/firebase';
import { langTr } from '@/languages/tr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import googleLogo from '@/img/googlelogin.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const ProviderIcon = ({ providerId }: { providerId: string }) => {
    switch (providerId) {
        case 'google.com':
            return <Image src={googleLogo} alt="Google" width={24} height={24} />;
        case 'password':
            return <KeyRound className="h-6 w-6 text-muted-foreground" />;
        default:
            return <Mail className="h-6 w-6 text-muted-foreground" />;
    }
};

const getProviderName = (providerId: string) => {
    switch (providerId) {
        case 'google.com':
            return 'Google';
        case 'password':
            return 'E-posta & Şifre';
        default:
            return providerId;
    }
}


export default function SettingsPage() {
    const { user } = useUser();
    const router = useRouter();
    const t = langTr;

    return (
        <div className="flex h-dvh flex-col bg-gray-50 dark:bg-black">
             <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Ayarlar</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-2xl mx-auto space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Hesap</CardTitle>
                            <CardDescription>Hesap bilgilerinizi ve bağlı hesapları yönetin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 p-4 border rounded-lg">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={user?.photoURL || undefined} />
                                    <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className='flex-1'>
                                    <p className="font-semibold">{user?.displayName}</p>
                                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Bağlı Hesaplar</CardTitle>
                            <CardDescription>Giriş yapmak için kullandığınız servisler.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {user?.providerData.map((provider) => (
                                <div key={provider.providerId} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <ProviderIcon providerId={provider.providerId} />
                                        <div>
                                            <p className="font-medium">{getProviderName(provider.providerId)}</p>
                                            {provider.email && <p className="text-sm text-muted-foreground">{provider.email}</p>}
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" disabled>Bağlı</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
