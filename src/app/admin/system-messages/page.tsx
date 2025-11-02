
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, writeBatch, serverTimestamp, doc, addDoc, orderBy, deleteDoc, getDocs, arrayUnion } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Send, Users, X, Plus, BarChart2, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { UserProfile, SystemMessage, ChatMessage } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const SentMessageCard = ({ message, onDelete }: { message: ChatMessage, onDelete: (messageId: string) => void }) => {
    return (
        <Card>
            <CardHeader className='p-4 flex-row items-start justify-between'>
                 <div className="space-y-1">
                    <p className="text-sm text-muted-foreground break-words font-semibold">
                        {message.text}
                    </p>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => onDelete(message.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Bu Mesajı Sil</span>
                            </DropdownMenuItem>
                         </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>

            <CardFooter className='p-4 pt-0 flex items-center justify-between'>
                <div className="text-xs text-muted-foreground">
                    {message.timestamp?.toDate && formatDistanceToNow(message.timestamp.toDate(), { locale: tr, addSuffix: true })}
                </div>
            </CardFooter>
        </Card>
    );
};


export default function SystemMessagesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const allUsersCollectionRef = useMemo(
    () => (firestore ? query(collection(firestore, 'users')) : null),
    [firestore]
  );
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection<UserProfile>(allUsersCollectionRef);

  const users = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(user => user.isBot !== true);
  }, [allUsers]);

  // Fetch from a single user's system chat to display history
  const systemMessagesQuery = useMemo(
    () => (firestore && users.length > 0 ? query(collection(firestore, `users/${users[0].uid}/matches/system/messages`), orderBy('timestamp', 'desc')) : null),
    [firestore, users]
  );
  const { data: sentMessages, isLoading: isLoadingMessages } = useCollection<ChatMessage>(systemMessagesQuery);


  const handleSendMessage = async () => {
    if (!firestore || !users || users.length === 0) {
        toast({ title: 'Hata', description: 'Mesaj gönderilecek kullanıcı bulunamadı.', variant: 'destructive' });
        return;
    }

    const messageContent = message.trim();
    if (!messageContent) {
        toast({ title: 'Hata', description: 'Mesaj boş olamaz.', variant: 'destructive' });
        return;
    }

    setIsSending(true);
    try {
        const batch = writeBatch(firestore);
        const timestamp = serverTimestamp();
        
        const systemMatchData = {
            id: 'system',
            matchedWith: 'system',
            lastMessage: messageContent,
            timestamp: timestamp,
            fullName: 'BeMatch Studio',
            profilePicture: '', 
            hasUnreadSystemMessage: true,
        };
        
        const messageData = {
            senderId: 'system',
            text: messageContent,
            timestamp: timestamp,
            type: 'user',
        };

        // Create the message and update the match for each user
        for (const user of users) {
            const systemMatchRef = doc(firestore, `users/${user.uid}/matches`, 'system');
            const newMessageRef = doc(collection(firestore, `users/${user.uid}/matches/system/messages`));
            
            batch.set(systemMatchRef, systemMatchData, { merge: true });
            batch.set(newMessageRef, { ...messageData, id: newMessageRef.id });
        }

        await batch.commit();

        toast({
            title: 'Mesaj Gönderildi',
            description: `${users.length} kullanıcıya mesaj başarıyla gönderildi.`,
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


  const handleDeleteMessage = async () => {
    if (!firestore || !messageToDelete || !users) return;

    try {
        const batch = writeBatch(firestore);
        
        // Delete the message from every user's system chat
        for (const user of users) {
            const messageRef = doc(firestore, `users/${user.uid}/matches/system/messages`, messageToDelete);
            batch.delete(messageRef);
        }

        await batch.commit();

        toast({
            title: 'Mesaj Silindi',
            description: 'Mesaj tüm kullanıcılardan başarıyla kaldırıldı.',
        });
    } catch (error: any) {
        console.error("Error deleting system message:", error);
        toast({
            title: 'Silme Başarısız',
            description: `Mesaj silinirken bir hata oluştu: ${error.message}`,
            variant: 'destructive',
        });
    } finally {
        setMessageToDelete(null);
    }
  }


  const isLoading = isLoadingUsers || isLoadingMessages;

  return (
    <AlertDialog>
        <div className="space-y-6">
        <h1 className="text-2xl font-bold">Duyurular</h1>

        <div className="grid lg:grid-cols-2 gap-8">
            <Card>
            <CardHeader>
                <CardTitle>Toplu Mesaj Paneli</CardTitle>
                <CardDescription>
                Buradan tüm aktif (bot olmayan) kullanıcılara bir sistem mesajı gönderebilirsiniz.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                    {isLoadingUsers ? (
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

                <Button onClick={handleSendMessage} disabled={isSending || isLoadingUsers}>
                {isSending ? (
                    <><Icons.logo className="mr-2 h-4 w-4 animate-pulse" /> Gönderiliyor...</>
                ) : (
                    <><Send className="mr-2 h-4 w-4" /> Mesajı Gönder</>
                )}
                </Button>
            </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle>Gönderilmiş Mesajlar</CardTitle>
                <CardDescription>Daha önce gönderilen sistem mesajları.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                <div className="space-y-4">
                    <Icons.logo className="h-8 w-8 animate-pulse mx-auto" />
                    <p className='text-center text-sm text-muted-foreground'>Mesajlar yükleniyor...</p>
                </div>
                ) : sentMessages && sentMessages.length > 0 ? (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {sentMessages.map(msg => (
                            <SentMessageCard key={msg.id} message={msg} onDelete={() => setMessageToDelete(msg.id)} />
                        ))}
                    </div>
                ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Henüz hiç sistem mesajı gönderilmemiş.</p>
                )}
            </CardContent>
            </Card>

        </div>
        </div>
         <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Mesajı Silmek İstediğinizden Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
                Bu işlem geri alınamaz. Mesaj tüm kullanıcılardan silinecek ve istatistikleri kaybolacaktır.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMessageToDelete(null)}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage} className='bg-destructive hover:bg-destructive/90'>Sil</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  );
}
