
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Heart, MessageSquare, Bot, AlertTriangle, Trash2 } from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, writeBatch, getDocs, collectionGroup } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import { useMemo, useState } from 'react';
import type { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const allUsersCollectionRef = useMemo(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection<UserProfile>(allUsersCollectionRef);

  const { realUsers, bots } = useMemo(() => {
    if (!allUsers) return { realUsers: [], bots: [] };
    const realUsers = allUsers.filter(user => user.isBot !== true);
    const bots = allUsers.filter(user => user.isBot === true);
    return { realUsers, bots };
  }, [allUsers]);

  const matchesCollectionRef = useMemo(
    () => (firestore ? query(collection(firestore, 'matches'), where('status', '==', 'matched')) : null),
    [firestore]
  );
  const { data: matches, isLoading: isLoadingMatches } = useCollection(matchesCollectionRef);

  const messagesQuery = useMemo(() => {
        if (!firestore) return null;
        // Assuming system_messages is a root collection
        return query(collection(firestore, 'system_messages'));
    }, [firestore]);
    const { data: systemMessages, isLoading: isLoadingMessages } = useCollection(messagesQuery);

  const handleResetInteractions = async () => {
    if (!firestore) {
      toast({ title: 'Hata', description: 'Veritabanı bağlantısı kurulamadı.', variant: 'destructive'});
      return;
    }
    setIsResetting(true);
    
    try {
      const batch = writeBatch(firestore);
      
      // 1. Delete all documents in the 'matches' collection and their subcollections
      const allMatchesQuery = collection(firestore, 'matches');
      const allMatchesSnapshot = await getDocs(allMatchesQuery);
      for (const matchDoc of allMatchesSnapshot.docs) {
          const messagesQuery = collection(matchDoc.ref, 'messages');
          const messagesSnapshot = await getDocs(messagesQuery);
          messagesSnapshot.forEach(msgDoc => batch.delete(msgDoc.ref));
          batch.delete(matchDoc.ref);
      }

      // 2. Delete the 'matches' subcollection for every user
      if (allUsers) {
        for (const user of allUsers) {
            const userMatchesQuery = collection(firestore, `users/${user.uid}/matches`);
            const userMatchesSnapshot = await getDocs(userMatchesQuery);
            userMatchesSnapshot.forEach(doc => batch.delete(doc.ref));
        }
      }
      
      await batch.commit();

      toast({
        title: 'Sıfırlama Başarılı',
        description: 'Tüm eşleşmeler, sohbetler ve etkileşimler kalıcı olarak silindi.'
      });

    } catch (error: any) {
      console.error("Error resetting interactions:", error);
      toast({ title: 'Sıfırlama Başarısız', description: `Bir hata oluştu: ${error.message}`, variant: 'destructive'});
    } finally {
      setIsResetting(false);
      setShowResetDialog(false);
    }
  }


  return (
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Genel Bakış</h1>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                        Toplam Kullanıcı
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                        {isLoadingUsers ? <Icons.logo className="h-6 w-6 animate-pulse" /> : realUsers?.length ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                        Sistemdeki toplam gerçek kullanıcı sayısı.
                        </p>
                    </CardContent>
                    </Card>
                    <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                        Toplam Bot
                        </CardTitle>
                        <Bot className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                        {isLoadingUsers ? <Icons.logo className="h-6 w-6 animate-pulse" /> : bots?.length ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                        Sistemdeki toplam bot kullanıcı sayısı.
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
                        <CardTitle className="text-sm font-medium">Sistem Mesajları</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                        {isLoadingMessages ? <Icons.logo className="h-6 w-6 animate-pulse" /> : systemMessages?.length ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                        Gönderilen toplam sistem mesajı.
                        </p>
                    </CardContent>
                    </Card>
                </div>

                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-destructive">
                            <AlertTriangle />
                            Tehlikeli Bölge
                        </CardTitle>
                        <CardDescription>
                            Bu alandaki işlemler geri alınamaz. Lütfen dikkatli olun.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" onClick={() => setShowResetDialog(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Tüm Etkileşimleri ve Sohbetleri Sıfırla
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tüm Verileri Sıfırlamak İstediğinizden Emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu işlem geri alınamaz. Tüm beğeniler, beğenmemeler, eşleşmeler ve sohbet geçmişleri kalıcı olarak silinecektir. Bu, genellikle test ortamını temizlemek için kullanılır.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetInteractions} disabled={isResetting} className='bg-destructive hover:bg-destructive/90'>
                        {isResetting ? <><Icons.logo className="h-4 w-4 mr-2 animate-pulse" /> Sıfırlanıyor...</> : "Evet, Tümünü Sil"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
  );
}
