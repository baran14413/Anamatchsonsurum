'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Flame, Star, Zap, ShieldCheckIcon, Pencil, ChevronRight } from 'lucide-react';
import { langTr } from '@/languages/tr';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import CircularProgress from '@/components/circular-progress';


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
  
    const calculateAge = (dateOfBirth: string | undefined | null): number | null => {
        if (!dateOfBirth) return null;
        const birthday = new Date(dateOfBirth);
        if (isNaN(birthday.getTime())) return null;
        const ageDifMs = Date.now() - birthday.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const age = calculateAge(user?.dateOfBirth);


  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black">
      <div className="container mx-auto max-w-2xl p-4 space-y-6">

        {/* Profile Header */}
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
              <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
              <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
             <div className="absolute -bottom-1 -right-1">
                 <CircularProgress progress={5} size={44} />
             </div>
          </div>
          
          <div className="text-center space-y-3">
             <h1 className="text-2xl font-bold flex items-center gap-2">
                {user?.displayName || t.profil.user}{age && `, ${age}`}
                <ShieldCheckIcon className="h-6 w-6 text-blue-500" />
            </h1>
            <Button className='rounded-full h-10 font-bold text-base bg-gradient-to-r from-pink-500 to-orange-400 text-white'>
                <Pencil className="mr-2 h-5 w-5"/>
                {t.common.editProfile}
            </Button>
          </div>
        </div>

        {/* Double Date Card */}
        <Card className='shadow-md'>
            <CardContent className='p-4 flex items-center gap-4'>
                <Icons.tinderFlame className="h-8 w-8 text-pink-500" />
                <div className='flex-1'>
                    <h2 className='font-bold'>{t.profil.tryDoubleDate}</h2>
                    <p className='text-sm text-muted-foreground'>{t.profil.tryDoubleDateDesc}</p>
                </div>
                <ChevronRight className='h-6 w-6 text-muted-foreground'/>
            </CardContent>
        </Card>

        {/* Subscriptions & Boosts */}
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
           <Card className="p-3 shadow-md">
              <Star className="h-6 w-6 text-blue-400 mx-auto mb-1" />
              <p className="font-semibold">{t.profil.superLikes.replace('{count}', '0')}</p>
              <span className="text-xs text-blue-500 font-bold cursor-pointer">{t.profil.getMore}</span>
          </Card>
          <Card className="p-3 shadow-md">
              <Zap className="h-6 w-6 text-purple-500 mx-auto mb-1" />
              <p className="font-semibold">{t.profil.myBoosts}</p>
              <span className="text-xs text-purple-500 font-bold cursor-pointer">{t.profil.getMore}</span>
          </Card>
           <Card className="p-3 shadow-md">
              <Flame className="h-6 w-6 text-red-500 mx-auto mb-1" />
              <p className="font-semibold">{t.profil.subscriptions}</p>
              <span className="text-xs text-yellow-500 font-bold cursor-pointer">{t.profil.upgrade}</span>
          </Card>
        </div>

        {/* Logout */}
        <div className="pt-8">
           <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full text-muted-foreground font-bold">
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
