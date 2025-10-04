
"use client";

import { useUser, useFirestore, useDoc, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Shield, Settings, ChevronRight, Star, Zap, Gem, Check, Lock, Pencil, Loader2, Menu, LogOut } from "lucide-react";
import CircularProgress from "@/components/circular-progress";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { langEn } from '@/languages/en';
import { langTr } from '@/languages/tr';

export default function ProfilPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { lang } = useLanguage();
  const t = lang === 'en' ? langEn : langTr;

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading, error } = useDoc(userProfileRef);

  const calculateAge = (dateString: string | undefined) => {
    if (!dateString) return 0;
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleLogout = async () => {
      try {
        if (auth) {
          await signOut(auth);
          router.push('/');
          toast({
            title: t.ayarlar.toasts.logoutSuccessTitle,
            description: t.ayarlar.toasts.logoutSuccessDesc,
          });
        }
      } catch (error) {
        toast({
          title: t.ayarlar.toasts.logoutErrorTitle,
          description: t.ayarlar.toasts.logoutErrorDesc,
          variant: 'destructive',
        });
      }
    };
  
  const userAge = userProfile ? calculateAge(userProfile.dateOfBirth) : 0;
  
  const profileCompletion = useMemoFirebase(() => {
    if (!userProfile) return 0;
    const fields = ['fullName', 'dateOfBirth', 'gender', 'profilePicture', 'interests', 'bio'];
    const completedFields = fields.filter(field => !!userProfile[field] && (Array.isArray(userProfile[field]) ? userProfile[field].length > 0 : true));
    return Math.round((completedFields.length / fields.length) * 100);
  }, [userProfile]);
  
  const premiumFeatures = [
    { name: t.profil.featureSeeLikes, free: false, gold: true },
    { name: t.profil.featureTopPicks, free: false, gold: true },
    { name: t.profil.featureFreeSuperLikes, free: false, gold: true },
  ];


  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="bg-muted/40 dark:bg-black h-full overflow-y-auto pb-24">
       <div className="absolute top-4 right-4 z-10">
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t.profil.logout}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      <div className="container mx-auto max-w-lg px-4 py-8">
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white dark:border-black">
                    <AvatarImage src={userProfile?.profilePicture} alt={userProfile?.fullName || ''} />
                    <AvatarFallback className="text-4xl bg-muted">
                        {userProfile?.fullName?.charAt(0) || 'B'}
                    </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2">
                    <CircularProgress progress={profileCompletion} />
                </div>
            </div>

            <div className="text-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    {userProfile?.fullName || t.profil.user}, {userAge > 0 ? userAge : ''}
                    <Check className="h-5 w-5 p-0.5 rounded-full bg-blue-500 text-white" strokeWidth={3} />
                </h1>
            </div>
            
            <Link href="/profil/duzenle" className="w-full max-w-xs">
              <Button className="w-full rounded-full h-12 text-base font-semibold bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg">
                  <Pencil className="mr-2 h-4 w-4" />
                  {t.common.editProfile}
              </Button>
            </Link>
        </div>

        <div className="space-y-4 mt-8">
            <Card className="overflow-hidden">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="bg-pink-100 p-2 rounded-lg">
                        <Gem className="h-6 w-6 text-pink-500" />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-semibold">{t.profil.tryDoubleDate}</h2>
                        <p className="text-sm text-muted-foreground">{t.profil.tryDoubleDateDesc}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3 text-center">
                <Card className="flex flex-col items-center justify-center p-4 aspect-square relative">
                     <button className="absolute top-1 right-1 h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">+</button>
                     <Star className="h-8 w-8 text-blue-500 fill-blue-500" />
                     <p className="font-bold mt-1">{t.profil.superLikes.replace('{count}', '0')}</p>
                     <Link href="#" className="text-xs font-semibold text-blue-500 hover:underline mt-0.5">{t.profil.getMore}</Link>
                </Card>
                 <Card className="flex flex-col items-center justify-center p-4 aspect-square relative">
                     <button className="absolute top-1 right-1 h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">+</button>
                     <Zap className="h-8 w-8 text-purple-500 fill-purple-500" />
                     <p className="font-bold mt-1">{t.profil.myBoosts}</p>
                     <Link href="#" className="text-xs font-semibold text-purple-500 hover:underline mt-0.5">{t.profil.getMore}</Link>
                </Card>
                 <Card className="flex flex-col items-center justify-center p-4 aspect-square relative">
                     <button className="absolute top-1 right-1 h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">+</button>
                     <Icons.tinderFlame className="h-8 w-8 text-primary" />
                     <p className="font-bold mt-1">{t.profil.subscriptions}</p>
                </Card>
            </div>
            
            <Card className="bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400 text-black overflow-hidden shadow-lg">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <Icons.logo width={32} height={32} />
                             <span className="text-2xl font-extrabold tracking-tight">BeMatch</span>
                             <span className="text-xs font-bold bg-black text-yellow-300 px-2 py-0.5 rounded-md">{t.profil.gold.toUpperCase()}</span>
                        </div>
                        <Button className="bg-black text-white rounded-full font-bold hover:bg-gray-800">{t.profil.upgrade}</Button>
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between items-center font-bold text-sm text-black/70 px-2">
                            <p>{t.profil.features}</p>
                            <div className="flex gap-8">
                                <p>{t.profil.free}</p>
                                <p>{t.profil.gold}</p>
                            </div>
                        </div>
                        <div className="space-y-3 mt-3">
                            {premiumFeatures.map(feature => (
                                <div key={feature.name} className="flex justify-between items-center text-base font-semibold">
                                    <p>{feature.name}</p>
                                    <div className="flex items-center gap-10">
                                        {feature.free ? <Check className="h-5 w-5 text-green-700" /> : <Lock className="h-4 w-4 text-black/60" />}
                                        {feature.gold ? <Check className="h-5 w-5 text-green-700" strokeWidth={3}/> : <Lock className="h-4 w-4" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="text-center mt-6">
                        <Link href="#" className="font-bold hover:underline">{t.profil.viewAllFeatures}</Link>
                    </div>
                </CardContent>
            </Card>

             <div className="flex justify-center gap-2 mt-4">
                <span className="h-2 w-2 rounded-full bg-black dark:bg-white"></span>
                <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                <span className="h-2 w-2 rounded-full bg-gray-400"></span>
             </div>
        </div>
      </div>
    </div>
  );
}
