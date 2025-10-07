
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Heart, MessageSquare, Trash2, AlertTriangle, Send, Bot } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCreatingBots, setIsCreatingBots] = useState(false);
  const [botCount, setBotCount] = useState(10);
  const [botGender, setBotGender] = useState('mixed');
  const [isResetting, setIsResetting] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');


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

  
    const handleCreateBots = async () => {
    if (botCount <= 0) {
        toast({
            title: 'Hata',
            description: 'Bot sayısı 0\'dan büyük olmalıdır.',
            variant: 'destructive',
        });
        return;
    }
    setIsCreatingBots(true);
    try {
        const response = await fetch('/api/create-bots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: botCount, gender: botGender }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Botlar oluşturulamadı.');
        }

        toast({
            title: 'Botlar Oluşturuldu',
            description: `${result.createdCount} adet yeni bot başarıyla oluşturuldu.`,
        });

    } catch (error: any) {
        toast({
            title: 'Hata',
            description: error.message || 'Bilinmeyen bir hata oluştu.',
            variant: 'destructive',
        });
    } finally {
        setIsCreatingBots(false);
    }
  };

  const handleResetSystem = async () => {
      setIsResetting(true);
       try {
        const response = await fetch('/api/reset-matches', {
            method: 'POST',
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Sistem sıfırlanamadı.');
        }

        toast({
            title: 'Sistem Sıfırlandı',
            description: `Tüm eşleşmeler ve sohbetler başarıyla silindi.`,
        });

    } catch (error: any) {
        toast({
            title: 'Hata',
            description: error.message || 'Bilinmeyen bir hata oluştu.',
            variant: 'destructive',
        });
    } finally {
        setIsResetting(false);
    }
  }

  const handleBroadcastMessage = async () => {
    if (!broadcastMessage.trim()) {
      toast({
        title: 'Hata',
        description: 'Duyuru mesajı boş olamaz.',
        variant: 'destructive',
      });
      return;
    }
    setIsBroadcasting(true);
    try {
      const response = await fetch('/api/broadcast-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMessage }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Duyuru gönderilemedi.');
      }

      toast({
        title: 'Duyuru Gönderildi',
        description: `Mesajınız ${result.count} kullanıcıya başarıyla iletildi.`,
      });
      setBroadcastMessage('');
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Bilinmeyen bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsBroadcasting(false);
    }
  };


  return (
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

        <div className="pt-4 grid md:grid-cols-2 gap-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        Bot Yönetimi
                    </CardTitle>
                    <CardDescription>
                        Uygulamaya test veya başlangıç amacıyla sahte kullanıcı profilleri (bot) ekleyin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center gap-4">
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="bot-count">Bot Sayısı</Label>
                            <Input 
                                id="bot-count"
                                type="number"
                                value={botCount}
                                onChange={(e) => setBotCount(parseInt(e.target.value))}
                                min="1"
                                max="100"
                                disabled={isCreatingBots}
                             />
                        </div>
                         <div className="space-y-2 flex-1">
                            <Label htmlFor="bot-gender">Cinsiyet</Label>
                            <Select 
                                value={botGender}
                                onValueChange={setBotGender}
                                disabled={isCreatingBots}
                            >
                                <SelectTrigger id="bot-gender">
                                    <SelectValue placeholder="Seçiniz..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mixed">Karışık</SelectItem>
                                    <SelectItem value="female">Kadın</SelectItem>
                                    <SelectItem value="male">Erkek</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <Button onClick={handleCreateBots} disabled={isCreatingBots}>
                        {isCreatingBots ? (
                            <><Icons.logo className='h-4 w-4 animate-pulse mr-2'/> Oluşturuluyor...</>
                        ) : (
                            <><Bot className='mr-2 h-4 w-4'/> Botları Oluştur</>
                        )}
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                       Toplu Duyuru Gönder
                    </CardTitle>
                    <CardDescription>
                        Tüm kullanıcılara sistem mesajı olarak bir duyuru gönderin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                        <Label htmlFor="broadcast-message">Mesajınız</Label>
                        <Textarea
                            id="broadcast-message"
                            placeholder="Duyurunuzu buraya yazın..."
                            value={broadcastMessage}
                            onChange={(e) => setBroadcastMessage(e.target.value)}
                            disabled={isBroadcasting}
                        />
                   </div>
                   <Button onClick={handleBroadcastMessage} disabled={isBroadcasting}>
                        {isBroadcasting ? (
                             <><Icons.logo className='h-4 w-4 animate-pulse mr-2'/> Gönderiliyor...</>
                        ) : (
                             <><Send className='mr-2 h-4 w-4'/> Duyuruyu Gönder</>
                        )}
                    </Button>
                </CardContent>
            </Card>
            <Card className="md:col-span-2 border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                       <AlertTriangle className='h-5 w-5'/> Tehlikeli Bölge
                    </CardTitle>
                    <CardDescription>
                        Bu işlemler geri alınamaz ve uygulamanın veritabanını kalıcı olarak etkiler.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" disabled={isResetting}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Maçları ve Sohbetleri Sıfırla
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Bu işlem geri alınamaz. Tüm kullanıcı eşleşmeleri ve sohbet geçmişleri kalıcı olarak silinecektir. Bu, test amacıyla veya sistemi temizlemek için kullanılır.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetSystem} disabled={isResetting} className='bg-destructive hover:bg-destructive/90'>
                                     {isResetting ? (
                                        <><Icons.logo className='h-4 w-4 animate-pulse mr-2'/> Sıfırlanıyor...</>
                                    ) : (
                                        "Evet, Sıfırla"
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
        </div>
  );
}
