
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Send, Users } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SystemMessagesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), where('isBot', '!=', true)) : null),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<UserProfile>(usersCollectionRef);

  const handleSendMessage = async () => {
    if (!firestore || !users || users.length === 0) {
      toast({
        title: 'Hata',
        description: 'Kullanıcılar bulunamadı veya veritabanı bağlantısı yok.',
        variant: 'destructive',
      });
      return;
    }
    if (message.trim() === '') {
      toast({
        title: 'Hata',
        description: 'Mesaj boş olamaz.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      const batch = writeBatch(firestore);
      const timestamp = serverTimestamp();
      const messageText = message.trim();

      users.forEach(user => {
        const systemMatchRef = doc(firestore, `users/${user.uid}/matches`, 'system');
        batch.set(systemMatchRef, {
            id: 'system',
            matchedWith: 'system',
            lastMessage: messageText,
            timestamp: timestamp,
            fullName: 'BeMatch - Sistem Mesajları',
            profilePicture: '', // Placeholder, client will use icon
        }, { merge: true });
      });

      await batch.commit();

      toast({
        title: 'Mesaj Gönderildi',
        description: `${users.length} kullanıcıya sistem mesajı başarıyla gönderildi.`,
      });
      setMessage('');

    } catch (error: any) {
      console.error("Error sending system message:", error);
      toast({
        title: 'Gönderme Başarısız',
        description: `Mesajlar gönderilirken bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sistem Mesajı Gönder</h1>

      <Card>
        <CardHeader>
          <CardTitle>Toplu Mesaj Paneli</CardTitle>
          <CardDescription>
            Buradan uygulamadaki tüm aktif (bot olmayan) kullanıcılara bir sistem mesajı gönderebilirsiniz. Bu mesaj, kullanıcıların sohbet listesindeki "BeMatch - Sistem Mesajları" sohbetinde görünecektir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                {isLoading ? (
                  <Icons.logo className="h-4 w-4 animate-pulse" />
                ) : (
                  `Bu mesaj toplam ${users?.length || 0} kullanıcıya gönderilecek.`
                )}
              </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="system-message">Mesajınız</Label>
            <Textarea
              id="system-message"
              placeholder="Tüm kullanıcılara göndermek istediğiniz mesajı buraya yazın..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              disabled={isSending}
            />
          </div>
          <Button onClick={handleSendMessage} disabled={isSending || isLoading}>
            {isSending ? (
              <>
                <Icons.logo className="mr-2 h-4 w-4 animate-pulse" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Tüm Kullanıcılara Gönder
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
