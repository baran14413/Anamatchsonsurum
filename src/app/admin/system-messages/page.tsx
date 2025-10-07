
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, serverTimestamp, doc, addDoc, orderBy, deleteDoc, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Send, Users, X, Plus, BarChart2, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { UserProfile, SystemMessage } from '@/lib/types';
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
} from "@/components/ui/alert-dialog";


const SentMessageCard = ({ message, totalUsers, onDelete }: { message: SystemMessage, totalUsers: number, onDelete: (messageId: string) => void }) => {
    const isPoll = message.type === 'poll';
    const totalVotes = isPoll && message.pollResults ? Object.values(message.pollResults).reduce((sum, count) => sum + count, 0) : 0;
    const seenCount = message.seenBy?.length || 0;

    return (
        <Card>
            <CardHeader className='p-4 flex-row items-start justify-between'>
                 <div className="space-y-1">
                    <p className="text-sm text-muted-foreground break-words font-semibold">
                        {isPoll ? <><strong>Anket:</strong> {message.pollQuestion}</> : <>{message.text}</>}
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

            <CardContent className="p-4 pt-0 space-y-3">
                 {isPoll && message.pollOptions && (
                    <div className="space-y-2">
                        {message.pollOptions.map((option, index) => {
                            const votes = message.pollResults?.[option] || 0;
                            const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                            return (
                                <div key={index} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-medium">{option}</span>
                                        <span className="text-muted-foreground">{votes} oy ({percentage.toFixed(1)}%)</span>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
            <CardFooter className='p-4 pt-0 flex items-center justify-between'>
                <div className="text-xs text-muted-foreground">
                    {message.createdAt?.toDate && formatDistanceToNow(message.createdAt.toDate(), { locale: tr, addSuffix: true })}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                     <div className='flex items-center gap-1.5' title={`${seenCount} kullanıcı tarafından görüldü`}>
                        <Eye className="h-4 w-4" />
                        <span>{seenCount} / {totalUsers}</span>
                    </div>
                    {isPoll && (
                        <div className='flex items-center gap-1.5' title={`Toplam ${totalVotes} oy kullanıldı`}>
                            <BarChart2 className="h-4 w-4" />
                            <span>{totalVotes}</span>
                        </div>
                    )}
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
  
  const [isPoll, setIsPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const allUsersCollectionRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users')) : null),
    [firestore]
  );
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection<UserProfile>(allUsersCollectionRef);

  const users = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(user => user.isBot !== true);
  }, [allUsers]);

  const systemMessagesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'system_messages'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: sentMessages, isLoading: isLoadingMessages } = useCollection<SystemMessage>(systemMessagesQuery);


  const handleAddOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleSendMessage = async () => {
    if (!firestore || !users || users.length === 0) {
        toast({ title: 'Hata', description: 'Mesaj gönderilecek kullanıcı bulunamadı.', variant: 'destructive' });
        return;
    }

    const messageToSend = isPoll ? pollQuestion.trim() : message.trim();
    if (messageToSend === '') {
        toast({ title: 'Hata', description: 'Mesaj veya anket sorusu boş olamaz.', variant: 'destructive' });
        return;
    }

    if (isPoll && (pollOptions.some(opt => opt.trim() === '') || pollOptions.length < 2)) {
        toast({ title: 'Hata', description: 'Tüm anket seçenekleri dolu olmalı ve en az 2 seçenek bulunmalıdır.', variant: 'destructive' });
        return;
    }

    setIsSending(true);
    try {
        const batch = writeBatch(firestore);
        const timestamp = serverTimestamp();
        const centralMessageRef = doc(collection(firestore, 'system_messages'));

        const baseMessageData = {
            createdAt: timestamp,
            sentTo: users.map(u => u.uid),
            seenBy: [],
        };

        let centralMessageData: any;
        if (isPoll) {
            centralMessageData = {
                ...baseMessageData,
                type: 'poll',
                pollQuestion: messageToSend,
                pollOptions: pollOptions.map(o => o.trim()),
                pollResults: pollOptions.reduce((acc, opt) => ({ ...acc, [opt.trim()]: 0 }), {}),
                text: null,
            };
        } else {
            centralMessageData = {
                ...baseMessageData,
                type: 'text',
                text: messageToSend,
                pollQuestion: null,
                pollOptions: null,
                pollResults: null,
            };
        }

        batch.set(centralMessageRef, centralMessageData);

        users.forEach(user => {
            const systemMatchRef = doc(firestore, `users/${user.uid}/matches`, 'system');
            const systemMatchData = {
                id: 'system',
                matchedWith: 'system',
                lastMessage: isPoll ? `Anket: ${messageToSend}` : messageToSend,
                timestamp: timestamp,
                fullName: 'BeMatch - Sistem Mesajları',
                profilePicture: '',
                lastSystemMessageId: centralMessageRef.id,
                hasUnreadSystemMessage: true,
            };
            batch.set(systemMatchRef, systemMatchData, { merge: true });
        });

        await batch.commit();

        toast({
            title: 'Mesaj Gönderildi',
            description: `${users.length} kullanıcıya ${isPoll ? 'anket' : 'mesaj'} başarıyla gönderildi.`,
        });

        setMessage('');
        setPollQuestion('');
        setPollOptions(['', '']);
        setIsPoll(false);

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
        
        // 1. Delete the central message document
        const centralMessageRef = doc(firestore, 'system_messages', messageToDelete);
        batch.delete(centralMessageRef);

        // 2. Clear the last message preview for all users
        users.forEach(user => {
            const systemMatchRef = doc(firestore, `users/${user.uid}/matches`, 'system');
            batch.update(systemMatchRef, {
                lastMessage: "Sistem mesajı silindi.",
                hasUnreadSystemMessage: false,
            });
        });

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
        <h1 className="text-2xl font-bold">Sistem Mesajları ve Anketler</h1>

        <div className="grid md:grid-cols-2 gap-8">
            <Card>
            <CardHeader>
                <CardTitle>Toplu Mesaj Paneli</CardTitle>
                <CardDescription>
                Buradan tüm aktif (bot olmayan) kullanıcılara bir sistem mesajı veya anket gönderebilirsiniz.
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
                <div className="flex items-center justify-between">
                    <Label htmlFor="system-message">{isPoll ? "Anket Sorusu" : "Mesajınız"}</Label>
                    <Button variant="link" onClick={() => setIsPoll(!isPoll)}>
                    {isPoll ? "Normal Mesaja Dön" : "Anket Oluştur"}
                    </Button>
                </div>

                {isPoll ? (
                    <div className="space-y-3">
                        <Input 
                            id="poll-question"
                            placeholder="Anket sorusunu buraya yazın..."
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                            disabled={isSending}
                        />
                        <Label>Seçenekler</Label>
                        {pollOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input 
                                placeholder={`Seçenek ${index + 1}`}
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                disabled={isSending}
                            />
                            {pollOptions.length > 2 && (
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(index)} disabled={isSending}>
                                <X className="h-4 w-4 text-red-500"/>
                            </Button>
                            )}
                        </div>
                        ))}
                        {pollOptions.length < 4 && (
                        <Button variant="outline" size="sm" onClick={handleAddOption} disabled={isSending}>
                            <Plus className="mr-2 h-4 w-4"/> Seçenek Ekle
                        </Button>
                        )}
                    </div>
                ) : (
                    <Textarea
                    id="system-message"
                    placeholder="Tüm kullanıcılara göndermek istediğiniz mesajı buraya yazın..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    disabled={isSending}
                    />
                )}
                </div>

                <Button onClick={handleSendMessage} disabled={isSending || isLoadingUsers}>
                {isSending ? (
                    <><Icons.logo className="mr-2 h-4 w-4 animate-pulse" /> Gönderiliyor...</>
                ) : (
                    <><Send className="mr-2 h-4 w-4" /> {isPoll ? "Anketi Gönder" : "Mesajı Gönder"}</>
                )}
                </Button>
            </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle>Gönderilmiş Mesajlar</CardTitle>
                <CardDescription>Daha önce gönderilen sistem mesajları ve anketlerin durumu.</CardDescription>
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
                            <SentMessageCard key={msg.id} message={msg} totalUsers={users?.length || 0} onDelete={() => setMessageToDelete(msg.id)} />
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
