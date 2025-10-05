
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, writeBatch, where, getDocs } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, MoreHorizontal, Check, CheckCheck, UserX, Paperclip } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ChatMessage, UserProfile, DenormalizedMatch } from '@/lib/types';
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
import { useToast } from '@/hooks/use-toast';
import { langTr } from '@/languages/tr';
import Image from 'next/image';
import { Icons } from '@/components/icons';

const renderMessageStatus = (message: ChatMessage, isSender: boolean) => {
    if (!isSender || message.type === 'system_superlike_prompt') return null;

    if (message.isRead) {
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
    }
    return <Check className="h-4 w-4 text-muted-foreground" />;
};


export default function ChatPage() {
    const { matchId } = useParams() as { matchId: string };
    const router = useRouter();
    const { user, userProfile } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const t = langTr;

    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const [matchData, setMatchData] = useState<DenormalizedMatch | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isBlocking, setIsBlocking] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isAcceptingSuperLike, setIsAcceptingSuperLike] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const otherUserId = user ? matchId.replace(user.uid, '').replace('_', '') : null;

    useEffect(() => {
        if (!user || !firestore || !otherUserId) return;

        const unsubOtherUser = onSnapshot(doc(firestore, 'users', otherUserId), (doc) => {
            if (doc.exists()) {
                setOtherUser({ ...doc.data(), uid: doc.id } as UserProfile);
            }
        });
        
        const unsubMatchData = onSnapshot(doc(firestore, `users/${user.uid}/matches`, matchId), (doc) => {
            if (doc.exists()) {
                setMatchData(doc.data() as DenormalizedMatch);
            }
        });

        const messagesQuery = query(
            collection(firestore, `matches/${matchId}/messages`),
            orderBy('timestamp', 'asc')
        );

        const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ChatMessage));
            setMessages(fetchedMessages);
            setIsLoading(false);
        });

        return () => {
            unsubOtherUser();
            unsubMessages();
            unsubMatchData();
        };
    }, [matchId, user, firestore, otherUserId]);

    // Effect to mark messages as read
    useEffect(() => {
        if (!firestore || !user || messages.length === 0) return;
        
        const markMessagesAsRead = async () => {
            const unreadMessages = messages.filter(msg => msg.senderId !== user.uid && !msg.isRead);
            if (unreadMessages.length === 0) return;

            const batch = writeBatch(firestore);
            unreadMessages.forEach(msg => {
                const msgRef = doc(firestore, `matches/${matchId}/messages`, msg.id);
                batch.update(msgRef, { 
                    isRead: true,
                    readTimestamp: serverTimestamp()
                });
            });
            await batch.commit();
        };

        markMessagesAsRead();
    }, [messages, firestore, user, matchId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent, imageUrl: string | null = null, imagePublicId: string | null = null) => {
        e?.preventDefault();
        if ((!newMessage.trim() && !imageUrl) || !user || !firestore) return;

        const textContent = newMessage.trim();
        setNewMessage('');
        
        const messageData: Partial<ChatMessage> = {
            matchId: matchId,
            senderId: user.uid,
            timestamp: serverTimestamp(),
            isRead: false,
            type: 'user',
        };
        
        if (textContent) messageData.text = textContent;
        if (imageUrl) messageData.imageUrl = imageUrl;
        if (imagePublicId) messageData.imagePublicId = imagePublicId;
        
        await addDoc(collection(firestore, `matches/${matchId}/messages`), messageData);

        const lastMessageText = textContent ? textContent : '📷 Fotoğraf';
        const lastMessageUpdate = {
            lastMessage: lastMessageText,
            timestamp: serverTimestamp(),
        };
        const user1Id = matchId.split('_')[0];
        const user2Id = matchId.split('_')[1];

        await updateDoc(doc(firestore, `users/${user1Id}/matches`, matchId), lastMessageUpdate);
        await updateDoc(doc(firestore, `users/${user2Id}/matches`, matchId), lastMessageUpdate);
    };

    const handleFileSelect = () => fileInputRef.current?.click();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fotoğraf yüklenemedi.');
            }

            const { url, public_id } = await response.json();
            await handleSendMessage(undefined, url, public_id);

        } catch (error: any) {
            toast({
                title: 'Yükleme Başarısız',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleAcceptSuperLike = async () => {
        if (!user || !firestore || !otherUserId) return;
        setIsAcceptingSuperLike(true);

        try {
            const batch = writeBatch(firestore);

            // 1. Update the main match document
            const matchDocRef = doc(firestore, 'matches', matchId);
            batch.update(matchDocRef, {
                status: 'matched',
                matchDate: serverTimestamp(),
            });
            
            // 2. Update both denormalized match documents
            const user1MatchRef = doc(firestore, `users/${user.uid}/matches`, matchId);
            batch.update(user1MatchRef, { status: 'matched', lastMessage: "Super Like'ı kabul ettin!" });
            
            const user2MatchRef = doc(firestore, `users/${otherUserId}/matches`, matchId);
            batch.update(user2MatchRef, { status: 'matched', lastMessage: "Super Like'ın kabul edildi!" });
            
            // 3. Mark the system message as action taken
            const systemMessage = messages.find(m => m.type === 'system_superlike_prompt');
            if (systemMessage) {
                const systemMessageRef = doc(firestore, `matches/${matchId}/messages`, systemMessage.id);
                batch.update(systemMessageRef, { action: 'accepted', actionTaken: true });
            }
            
            await batch.commit();

            toast({
                title: 'Super Like Kabul Edildi!',
                description: `${otherUser?.fullName} ile artık eşleştiniz.`,
            });
        } catch(error) {
            console.error("Error accepting super like:", error);
             toast({
                title: 'Hata',
                description: 'Super Like kabul edilirken bir hata oluştu.',
                variant: 'destructive',
            });
        } finally {
             setIsAcceptingSuperLike(false);
        }
    };


    const handleBlockUser = async () => {
        if (!user || !firestore || !otherUserId) return;
        
        setIsBlocking(true);
        try {
            const response = await fetch('/api/delete-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Kullanıcı engellenemedi.');
            }

            toast({
                title: 'Kullanıcı Engellendi',
                description: `${otherUser?.fullName} ile olan eşleşmeniz kaldırıldı.`,
            });
            
            router.back();

        } catch (error: any) {
            console.error("Error blocking user:", error);
            toast({
                title: t.common.error,
                description: 'Kullanıcı engellenirken bir hata oluştu.',
                variant: 'destructive',
            });
        } finally {
            setIsBlocking(false);
        }
    }
    
    const renderTimestampLabel = (timestamp: any, prevTimestamp: any) => {
        if (!timestamp) return null;

        const date = timestamp.toDate();
        const prevDate = prevTimestamp?.toDate();
        
        if (!prevDate || date.toDateString() !== prevDate.toDateString()) {
             let label;
             if (isToday(date)) {
                label = `Bugün ${format(date, 'HH:mm')}`;
             } else if (isYesterday(date)) {
                label = `Dün ${format(date, 'HH:mm')}`;
             } else {
                label = format(date, 'd MMMM yyyy, HH:mm', { locale: tr });
             }
             return (
                <div className="text-center text-xs text-muted-foreground my-4">
                    {label}
                </div>
            );
        }

        return null;
    };
    
    const renderOnlineStatus = () => {
        if (!otherUser) return null;
        if (otherUser.isOnline) {
            return <span className="text-xs text-green-500">Çevrimiçi</span>
        }
        if (otherUser.lastSeen) {
            const lastSeenDate = new Date(otherUser.lastSeen.seconds * 1000);
            if (!isNaN(lastSeenDate.getTime())) {
                return <span className="text-xs text-muted-foreground">Son görülme {formatDistanceToNow(lastSeenDate, { locale: tr, addSuffix: true })}</span>
            }
        }
        return <span className="text-xs text-muted-foreground">Çevrimdışı</span>
    }
    
    const isSuperLikePending = matchData?.status === 'superlike_pending' && matchData?.superLikeInitiator !== user?.uid;
    const canSendMessage = matchData?.status === 'matched';

    return (
        <div className="flex h-dvh flex-col bg-background">
             <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-2">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div className="flex items-center gap-3">
                     <Avatar className="h-9 w-9">
                        <AvatarImage src={otherUser?.profilePicture} />
                        <AvatarFallback>{otherUser?.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                           <span className="font-semibold">{otherUser?.fullName}</span>
                        </div>
                        {renderOnlineStatus()}
                    </div>
                </div>
                <AlertDialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-6 w-6" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                             <AlertDialogTrigger asChild>
                                <DropdownMenuItem className='text-red-600 focus:text-red-600'>
                                    <UserX className="mr-2 h-4 w-4" />
                                    <span>Kullanıcıyı Engelle</span>
                                </DropdownMenuItem>
                             </AlertDialogTrigger>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Kullanıcıyı Engellemek İstediğinizden Emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu işlem geri alınamaz. {otherUser?.fullName} ile olan eşleşmeniz ve tüm sohbet geçmişiniz kalıcı olarak silinecek. Bu kullanıcı bir daha karşınıza çıkmayacak.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBlockUser} disabled={isBlocking} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                             {isBlocking ? t.common.loading : 'Engelle'}
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </header>

            <main className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                    {messages.map((message, index) => {
                        const isSender = message.senderId === user?.uid;
                        const prevMessage = index > 0 ? messages[index - 1] : null;

                        if (message.type === 'system_superlike_prompt' && !message.actionTaken) {
                            return (
                                <div key={message.id} className="text-center my-6 p-4 border rounded-lg bg-muted/50 space-y-4">
                                    <p className="text-sm">{message.text}</p>
                                    <Button onClick={handleAcceptSuperLike} disabled={isAcceptingSuperLike}>
                                        {isAcceptingSuperLike ? <Icons.logo width={24} height={24} className='animate-pulse' /> : <><Check className="mr-2 h-4 w-4" /> Kabul Et</>}
                                    </Button>
                                </div>
                            )
                        }

                        return (
                            <div key={message.id}>
                                {renderTimestampLabel(message.timestamp, prevMessage?.timestamp)}
                                <div className={cn("flex items-end gap-2 group", isSender ? "justify-end" : "justify-start")}>
                                     {!isSender && (
                                        <Avatar className="h-8 w-8 self-end mb-1">
                                            <AvatarImage src={otherUser?.profilePicture} />
                                            <AvatarFallback>{otherUser?.fullName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div
                                        className={cn(
                                            "max-w-[70%] rounded-2xl flex flex-col items-end gap-2",
                                            isSender ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none",
                                             message.imageUrl ? 'p-1.5' : 'px-4 py-2'
                                        )}
                                    >
                                        {message.imageUrl && (
                                            <Image src={message.imageUrl} alt="Gönderilen fotoğraf" width={200} height={200} className="rounded-xl w-full h-auto" />
                                        )}
                                        {message.text && <p className={cn('break-words', message.imageUrl && 'px-2 pb-1 pt-2')}>{message.text}</p>}
                                        <div className={cn("flex items-center gap-1 self-end", !message.imageUrl && '-mb-1')}>
                                            <span className="text-xs shrink-0">{message.timestamp ? format(message.timestamp.toDate(), 'HH:mm') : ''}</span>
                                            {isSender && renderMessageStatus(message, isSender)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div ref={messagesEndRef} />
            </main>
            
            {canSendMessage ? (
              <footer className="sticky bottom-0 z-10 border-t bg-background p-2">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                       <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={handleFileSelect} disabled={isUploading}>
                          {isUploading ? <Icons.logo width={24} height={24} className="h-5 w-5 animate-pulse" /> : <Paperclip className="h-5 w-5" />}
                      </Button>
                      <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Mesajını yaz..."
                          className="flex-1 rounded-full bg-muted"
                          disabled={isUploading}
                      />
                      <Button type="submit" size="icon" className="rounded-full" disabled={!newMessage.trim() || isUploading}>
                          <Send className="h-5 w-5" />
                      </Button>
                  </form>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              </footer>
            ) : matchData?.status === 'superlike_pending' && matchData?.superLikeInitiator === user?.uid && (
                <div className="text-center text-sm text-muted-foreground p-4 border-t">
                    Yanıt bekleniyor...
                </div>
            )}
        </div>
    );
}
