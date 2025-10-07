
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, serverTimestamp, doc, addDoc, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Send, Users, X, Plus, BarChart2, Eye } from 'lucide-react';
import { UserProfile, SystemMessage } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const SentMessageCard = ({ message, totalUsers }: { message: SystemMessage, totalUsers: number }) => {
    const isPoll = message.type === 'poll';
    const totalVotes = isPoll ? Object.values(message.pollResults || {}).reduce((sum, count) => sum + count, 0) : 0;
    const seenCount = message.seenBy?.length || 0;

    return (
        <Card>
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <p className="text-sm text-muted-foreground pr-4 break-words">
                        {isPoll ? <strong>Anket: {message.pollQuestion}</strong> : message.text}
                    </p>
                    <div className="text-xs text-muted-foreground text-right shrink-0">
                        {message.createdAt?.toDate && formatDistanceToNow(message.createdAt.toDate(), { locale: tr, addSuffix: true })}
                    </div>
                </div>

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
                
                <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground pt-2">
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

            </CardContent>
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

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), where('isBot', '!=', true)) : null),
    [firestore]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersCollectionRef);

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
      toast({ title: 'Hata', description: 'Kullanıcılar bulunamadı.', variant: 'destructive' });
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

      // 1. Create the central system message document
      const centralMessageRef = doc(collection(firestore, 'system_messages'));
      const centralMessageData: Partial<SystemMessage> = {
          createdAt: timestamp,
          sentTo: users.map(u => u.uid),
          seenBy: [],
          type: isPoll ? 'poll' : 'text',
          text: isPoll ? null : messageToSend,
          pollQuestion: isPoll ? messageToSend : null,
          pollOptions: isPoll ? pollOptions.map(o => o.trim()) : null,
          pollResults: isPoll ? pollOptions.reduce((acc, opt) => ({...acc, [opt.trim()]: 0 }), {}) : null,
      };
      batch.set(centralMessageRef, centralMessageData);


      // 2. Update the denormalized match object for each user to show the new message
      users.forEach(user => {
        const systemMatchRef = doc(firestore, `users/${user.uid}/matches`, 'system');
        batch.set(systemMatchRef, {
            id: 'system',
            matchedWith: 'system',
            lastMessage: isPoll ? `Anket: ${messageToSend}` : messageToSend,
            timestamp: timestamp,
            fullName: 'BeMatch - Sistem Mesajları',
            profilePicture: '', // Placeholder, client will use icon
            // We add the central message ID here for the client to reference
            lastSystemMessageId: centralMessageRef.id,
            hasUnreadSystemMessage: true,
        }, { merge: true });
      });

      await batch.commit();

      toast({
        title: 'Mesaj Gönderildi',
        description: `${users.length} kullanıcıya ${isPoll ? 'anket' : 'mesaj'} başarıyla gönderildi.`,
      });
      
      // Reset form
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

  const isLoading = isLoadingUsers || isLoadingMessages;

  return (
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
                  disabled={isSending || isPoll}
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
                        <SentMessageCard key={msg.id} message={msg} totalUsers={users?.length || 0} />
                    ))}
                </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Henüz hiç sistem mesajı gönderilmemiş.</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
