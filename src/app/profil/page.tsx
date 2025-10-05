'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signOut } from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Crown, Star, Zap, ShieldCheckIcon } from 'lucide-react';
import { langTr } from '@/languages/tr';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const t = langTr;
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!auth) return;
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      // AppShell will handle the redirect
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: t.ayarlar.toasts.logoutErrorTitle,
        description: t.ayarlar.toasts.logoutErrorDesc,
        variant: "destructive"
      });
      setIsLoggingOut(false);
    }
  };

  const features = [
    { name: t.profil.featureSeeLikes, free: false, gold: true },
    { name: t.profil.featureTopPicks, free: false, gold: true },
    { name: 'Sınırsız Beğeni', free: true, gold: true },
    { name: 'Sınırsız Geri Alma', free: false, gold: true },
    { name: t.profil.featureFreeSuperLikes, free: false, gold: true },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black">
      <div className="container mx-auto max-w-2xl p-4 space-y-6">

        {/* Profile Header */}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
            <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
            <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {user?.displayName || t.profil.user}
              <ShieldCheckIcon className="h-6 w-6 text-blue-500" />
            </h1>
            <p className="text-muted-foreground">{t.profil.verified}</p>
          </div>
        </div>

        {/* Subscriptions & Boosts */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
           <Card className="p-3">
              <Star className="h-6 w-6 text-yellow-400 mx-auto mb-1" />
              <p className="font-semibold">{t.profil.superLikes.replace('{count}', '5')}</p>
              <span className="text-xs text-muted-foreground">{t.profil.getMore}</span>
          </Card>
          <Card className="p-3">
              <Zap className="h-6 w-6 text-purple-500 mx-auto mb-1" />
              <p className="font-semibold">{t.profil.myBoosts}</p>
              <span className="text-xs text-muted-foreground">{t.profil.getMore}</span>
          </Card>
           <Card className="p-3">
              <Crown className="h-6 w-6 text-blue-500 mx-auto mb-1" />
              <p className="font-semibold">{t.profil.subscriptions}</p>
              <span className="text-xs text-muted-foreground">{t.profil.upgrade}</span>
          </Card>
        </div>
        
        {/* BeMatch Gold Card */}
        <Card className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-black overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">{t.profil.goldTitle} <Crown/></CardTitle>
            <CardDescription className="text-yellow-900">{t.profil.features}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {features.slice(0, 3).map((feature) => (
                <div key={feature.name} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{feature.name}</span>
                  <div className="flex items-center gap-6">
                    <span className="w-8 text-center">{feature.free ? <ShieldCheckIcon className="h-5 w-5 text-gray-600 mx-auto" /> : '-'}</span>
                    <span className="w-8 text-center">{feature.gold ? <ShieldCheckIcon className="h-5 w-5 text-black mx-auto" /> : '-'}</span>
                  </div>
                </div>
              ))}
            </div>
             <Separator className="my-4 bg-yellow-600/50" />
             <Button variant="outline" className="w-full bg-transparent border-black text-black hover:bg-black hover:text-white">
                {t.profil.viewAllFeatures}
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <div className="pt-4">
           <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full text-muted-foreground">
                        {t.profil.logout}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t.common.logoutConfirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t.common.logoutConfirmDescription}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
                        {isLoggingOut ? t.common.loading : t.common.logout}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
    </div>
  );
}
