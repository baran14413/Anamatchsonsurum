'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Gem, ThumbsUp, ThumbsDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const StatCard = ({ icon: Icon, title, value, actionText, actionLink, iconColor }: { icon: React.ElementType, title: string, value: string, actionText?: string, actionLink?: string, iconColor?: string }) => (
    <Card>
        <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${iconColor ? `bg-${iconColor}-100 dark:bg-${iconColor}-900/50` : 'bg-muted'}`}>
                <Icon className={`h-6 w-6 ${iconColor ? `text-${iconColor}-500` : 'text-foreground'}`} />
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

    const membershipType = userProfile?.membershipType === 'gold' ? 'BeMatch Gold' : 'BeMatch Free';
    const superLikeBalance = userProfile?.superLikeBalance ?? 0;

    return (
        <div className="flex h-dvh flex-col bg-gray-50 dark:bg-black">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Cüzdanım</h1>
                <div className="w-9"></div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-8">
                <Card className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 text-white shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl">
                                {membershipType}
                            </CardTitle>
                             <Gem className="h-8 w-8" />
                        </div>
                        <CardDescription className="text-white/80">
                           {membershipType === 'BeMatch Gold' ? 'Tüm premium özelliklere erişiminiz var.' : 'Daha fazla özellik için Gold\'a yükseltin.'}
                        </CardDescription>
                    </CardHeader>
                </Card>

                <div className="space-y-4">
                     <h2 className="text-xl font-bold">Bakiyelerin</h2>
                     <div className="space-y-3">
                        <StatCard 
                            icon={Star}
                            title="Super Like Bakiyesi"
                            value={String(superLikeBalance)}
                            actionText="Daha Fazla Al"
                            actionLink="/satin-al/super-like"
                            iconColor="blue"
                        />
                     </div>
                </div>

                {membershipType === 'BeMatch Free' && (
                     <div className="space-y-4">
                        <h2 className="text-xl font-bold">Günlük Ücretsiz Hakların</h2>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             <StatCard
                                icon={ThumbsUp}
                                title="Beğeni Hakkı"
                                value="100"
                                iconColor="green"
                            />
                            <StatCard
                                icon={ThumbsDown}
                                title="Pas Geçme Hakkı"
                                value="150"
                                iconColor="red"
                            />
                         </div>
                    </div>
                )}
            </main>
        </div>
    );
}
