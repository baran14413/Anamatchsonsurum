
'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Gem, ChevronRight, Info, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const StatCard = ({ icon: Icon, title, value, actionText, actionLink, iconColor }: { icon: React.ElementType, title: string, value: string, actionText?: string, actionLink?: string, iconColor?: string }) => (
    <Card>
        <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-${iconColor}-100 dark:bg-${iconColor}-900/50`}>
                <Icon className={`h-6 w-6 text-${iconColor}-500`} />
            </div>
            <div className="flex-1">
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
            {actionLink && (
                <Link href={actionLink}>
                    <Button variant="ghost" size="sm">
                        {actionText}
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </Link>
            )}
        </CardContent>
    </Card>
);


export default function WalletPage() {
    const router = useRouter();
    const { userProfile } = useUser();

    const isGoldMember = userProfile?.membershipType === 'gold';
    const membershipType = isGoldMember ? 'BeMatch Gold' : 'BeMatch Free';
    const superLikeBalance = userProfile?.superLikeBalance ?? 0;
    
    let expiryDate: Date | null = null;
    if (isGoldMember && userProfile?.goldMembershipExpiresAt) {
      try {
        expiryDate = userProfile.goldMembershipExpiresAt.toDate();
      } catch (e) {
        console.warn("Could not parse expiry date, it might not be a Firebase Timestamp yet.", e)
      }
    }


    return (
        <div className="flex h-dvh flex-col bg-gray-50 dark:bg-black">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Cüzdanım</h1>
                 <Link href="/market">
                    <Button variant="outline" className="rounded-full">
                        <ShoppingCart className="mr-2 h-4 w-4"/>
                        Market
                    </Button>
                </Link>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-8">
                <Link href="/market">
                    <Card className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 text-white shadow-lg cursor-pointer hover:opacity-90 transition-opacity">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-2xl">
                                    {membershipType}
                                </CardTitle>
                                <Gem className="h-8 w-8" />
                            </div>
                            <CardDescription className="text-white/80">
                            {isGoldMember ? 'Tüm premium özelliklere erişiminiz var.' : 'Daha fazla özellik için Gold\'a yükseltin.'}
                            </CardDescription>
                        </CardHeader>
                        {isGoldMember && expiryDate && (
                            <CardFooter className='!pt-0 !pb-4'>
                                <div className="flex items-center gap-2 text-sm text-white/90">
                                    <Info className="h-4 w-4" />
                                    <span>Gold üyeliğiniz {format(expiryDate, "d MMMM yyyy", { locale: tr })} tarihinde sona erecek.</span>
                                </div>
                            </CardFooter>
                        )}
                    </Card>
                </Link>

                <div className="space-y-4">
                     <h2 className="text-xl font-bold">Bakiyelerin</h2>
                     <div className="space-y-3">
                        <StatCard 
                            icon={Star}
                            title="Super Like Bakiyesi"
                            value={String(superLikeBalance)}
                            actionText="Daha Fazla Al"
                            actionLink="/market"
                            iconColor="blue"
                        />
                     </div>
                </div>

            </main>
        </div>
    );
}
