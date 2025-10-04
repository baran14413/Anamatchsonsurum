
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Shield, Settings, ChevronRight, Star, Zap, Gem, Check, Lock, Pencil } from "lucide-react";
import CircularProgress from "@/components/circular-progress";
import Link from "next/link";

const mockUser = {
  name: "Testhesap",
  age: 19,
  avatar: "https://picsum.photos/seed/currentuser/200/200",
  profileCompletion: 5,
};

const premiumFeatures = [
    { name: "Seni Kimlerin Beğendiğini Gör", free: false, gold: true },
    { name: "En Seçkin Profiller", free: false, gold: true },
    { name: "Ücretsiz Super Like'lar", free: false, gold: true },
];

export default function ProfilPage() {
  return (
    <div className="bg-muted/40 dark:bg-black h-full overflow-y-auto pb-24">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-background dark:bg-black sticky top-0 z-10">
        <Icons.tinder className="h-8 w-8 text-primary" />
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Shield className="h-6 w-6 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-8">
        <div className="flex flex-col items-center gap-4">
            {/* Profile Avatar and Info */}
            <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white dark:border-black">
                    <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
                    <AvatarFallback className="text-4xl bg-muted">
                        {mockUser.name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2">
                    <CircularProgress progress={mockUser.profileCompletion} />
                </div>
            </div>

            <div className="text-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    {mockUser.name}, {mockUser.age}
                    <Check className="h-5 w-5 p-0.5 rounded-full bg-blue-500 text-white" strokeWidth={3} />
                </h1>
            </div>
            
            <Button className="w-full max-w-xs rounded-full h-12 text-base font-semibold bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg">
                <Pencil className="mr-2 h-4 w-4" />
                Profili Düzenle
            </Button>
        </div>

        <div className="space-y-4 mt-8">
            {/* Çifte Randevu Card */}
            <Card className="overflow-hidden">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="bg-pink-100 p-2 rounded-lg">
                        <Gem className="h-6 w-6 text-pink-500" />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-semibold">Çifte Randevu'yu dene</h2>
                        <p className="text-sm text-muted-foreground">Arkadaşlarını davet et ve diğer çiftleri bul.</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
            </Card>

            {/* Premium Actions Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
                <Card className="flex flex-col items-center justify-center p-4 aspect-square relative">
                     <button className="absolute top-1 right-1 h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">+</button>
                     <Star className="h-8 w-8 text-blue-500 fill-blue-500" />
                     <p className="font-bold mt-1">0 Super Like</p>
                     <Link href="#" className="text-xs font-semibold text-blue-500 hover:underline mt-0.5">DAHA FAZLA AL</Link>
                </Card>
                 <Card className="flex flex-col items-center justify-center p-4 aspect-square relative">
                     <button className="absolute top-1 right-1 h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">+</button>
                     <Zap className="h-8 w-8 text-purple-500 fill-purple-500" />
                     <p className="font-bold mt-1">Boost'larım</p>
                     <Link href="#" className="text-xs font-semibold text-purple-500 hover:underline mt-0.5">DAHA FAZLA AL</Link>
                </Card>
                 <Card className="flex flex-col items-center justify-center p-4 aspect-square relative">
                     <button className="absolute top-1 right-1 h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">+</button>
                     <Icons.tinderFlame className="h-8 w-8 text-primary" />
                     <p className="font-bold mt-1">Abonelikler</p>
                </Card>
            </div>
            
            {/* Tinder Gold Card */}
            <Card className="bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400 text-black overflow-hidden shadow-lg">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <Icons.tinder className="h-8 w-8" />
                             <span className="text-2xl font-extrabold tracking-tight">BeMatch</span>
                             <span className="text-xs font-bold bg-black text-yellow-300 px-2 py-0.5 rounded-md">GOLD</span>
                        </div>
                        <Button className="bg-black text-white rounded-full font-bold hover:bg-gray-800">Yükselt</Button>
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between items-center font-bold text-sm text-black/70 px-2">
                            <p>Özellikler</p>
                            <div className="flex gap-8">
                                <p>Ücretsiz</p>
                                <p>Gold</p>
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
                        <Link href="#" className="font-bold hover:underline">Tüm Özellikleri Gör</Link>
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
