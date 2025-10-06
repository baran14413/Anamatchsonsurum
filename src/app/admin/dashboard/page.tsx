
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Heart, MessageSquare, Trash2, AlertTriangle } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection(usersCollectionRef);

  const matchesCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'matches') : null),
    [firestore]
  );
  const { data: matches, isLoading: isLoadingMatches } = useCollection(matchesCollectionRef);

  const handleResetSystem = async () => {
    setIsResetting(true);
    try {
        const response = await fetch('/api/reset-matches', {
            method: 'POST',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Sistem sıfırlanamadı.');
        }

        toast({
            title: 'Sistem Sıfırlandı',
            description: 'Tüm eşleşmeler ve sohbetler başarıyla silindi.',
        });

    } catch (error: any) {
        toast({
            title: 'Hata',
            description: error.message,
            variant: 'destructive',
        });
    } finally {
        setIsResetting(false);
    }
  }

  return (
    <AlertDialog>
        <div className="space-y-6">
        <h1 className="text-2xl font-bold">Genel Bakış</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Toplam Kullanıcı
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                {isLoadingUsers ? <Icons.logo className="h-6 w-6 animate-pulse" /> : users?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                Sistemdeki toplam kayıtlı kullanıcı sayısı.
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Toplam Eşleşme
                </CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {isLoadingMatches ? <Icons.logo className="h-6 w-6 animate-pulse" /> : matches?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                Gerçekleşen toplam eşleşme sayısı.
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktif Sohbetler</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                {isLoadingMatches ? <Icons.logo className="h-6 w-6 animate-pulse" /> : matches?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                Devam eden sohbetlerin sayısı.
                </p>
            </CardContent>
            </Card>
        </div>

        <div className="pt-8">
            <h2 className='text-xl font-bold text-destructive mb-2'>Tehlikeli Bölge</h2>
            <Card className='border-destructive'>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5"/>
                        Sistemi Sıfırla
                    </CardTitle>
                    <CardDescription>
                       Bu işlem, geliştirme ve test amacıyla tüm eşleşmeleri, sohbetleri ve ilgili verileri kalıcı olarak siler. Bu eylem geri alınamaz.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <AlertDialogTrigger asChild>
                        <Button variant='destructive'>
                            <Trash2 className='mr-2 h-4 w-4'/>
                            Tüm Sohbetleri ve Eşleşmeleri Sil
                        </Button>
                    </AlertDialogTrigger>
                </CardContent>
            </Card>
        </div>

        </div>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Tüm Verileri Silmek İstediğinizden Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
                Bu işlem kesinlikle geri alınamaz. Tüm kullanıcıların eşleşmeleri, sohbet geçmişleri ve denormalize edilmiş verileri kalıcı olarak silinecektir. Bu eylemi yalnızca test verilerini temizlemek için kullanın.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetSystem} disabled={isResetting}>
                {isResetting ? <Icons.logo className='h-4 w-4 animate-pulse mr-2'/> : <Trash2 className='mr-2 h-4 w-4'/>}
                {isResetting ? 'Siliniyor...' : 'Evet, Tümünü Sil'}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  );
}
