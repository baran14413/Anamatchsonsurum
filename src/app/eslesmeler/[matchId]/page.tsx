
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, writeBatch, where, getDocs } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, MoreHorizontal, Check, CheckCheck, UserX } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ChatMessage, UserProfile } from '@/lib/types';
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

const renderMessageStatus = (message: ChatMessage, isSender: boolean) => {
    if (!isSender) return null;

    if (message.isRead) {
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
    }
    // For simplicity, we'll assume if it's sent, it's delivered.
    // A more complex system could track delivery status separately.
    return <Check className="h-4 w-4 text-muted-foreground" />;
};


export default function ChatPage() {
    const { matchId } = useParams() as { matchId: string };
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const t = langTr;

    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isBlocking, setIsBlocking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const otherUserId = user ? matchId.replace(user.uid, '').replace('_', '') : null;

    useEffect(() => {
        if (!user || !firestore || !otherUserId) return;

        const unsubOtherUser = onSnapshot(doc(firestore, 'users', otherUserId), (doc) => {
            if (doc.exists()) {
                setOtherUser({ ...doc.data(), uid: doc.id } as UserProfile);
            }
            setIsLoading(false);
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
        });

        return () => {
            unsubOtherUser();
            unsubMessages();
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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !firestore) return;

        const messageData = {
            matchId: matchId,
            senderId: user.uid,
            text: newMessage.trim(),
            timestamp: serverTimestamp(),
            isRead: false,
        };

        setNewMessage('');
        
        await addDoc(collection(firestore, `matches/${matchId}/messages`), messageData);

        const lastMessageUpdate = {
            lastMessage: newMessage.trim(),
            timestamp: serverTimestamp(),
        };
        const user1Id = matchId.split('_')[0];
        const user2Id = matchId.split('_')[1];

        await updateDoc(doc(firestore, `users/${user1Id}/matches`, matchId), lastMessageUpdate);
        await updateDoc(doc(firestore, `users/${user2Id}/matches`, matchId), lastMessageUpdate);
    };

    const handleBlockUser = async () => {
        if (!user || !firestore || !otherUserId) return;
        
        setIsBlocking(true);
        try {
            const batch = writeBatch(firestore);
            
            // 1. Delete the main match document
            const matchDocRef = doc(firestore, 'matches', matchId);
            batch.delete(matchDocRef);
            
            // 2. Delete the denormalized match from the current user's subcollection
            const currentUserMatchRef = doc(firestore, `users/${user.uid}/matches`, matchId);
            batch.delete(currentUserMatchRef);

            // 3. Delete the denormalized match from the other user's subcollection
            const otherUserMatchRef = doc(firestore, `users/${otherUserId}/matches`, matchId);
            batch.delete(otherUserMatchRef);

            // TODO: In a real app, you might add a `blockedUsers` subcollection
            // to prevent them from ever seeing each other again.
            
            await batch.commit();

            toast({
                title: 'Kullanıcı Engellendi',
                description: `${otherUser?.fullName} ile olan eşleşmeniz kaldırıldı.`,
            });
            
            router.back();

        } catch (error) {
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
            const lastSeenDate = otherUser.lastSeen.toDate();
            // Check if lastSeenDate is a valid date
            if (!isNaN(lastSeenDate.getTime())) {
                return <span className="text-xs text-muted-foreground">Son görülme {formatDistanceToNow(lastSeenDate, { locale: tr, addSuffix: true })}</span>
            }
        }
        return <span className="text-xs text-muted-foreground">Çevrimdışı</span>
    }


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
                                            "max-w-[70%] rounded-2xl px-4 py-2 flex items-end gap-2",
                                            isSender ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                                        )}
                                    >
                                        <p className='break-words'>{message.text}</p>
                                        <span className="text-xs text-end -mb-1 shrink-0">{message.timestamp ? format(message.timestamp.toDate(), 'HH:mm') : ''}</span>
                                    </div>
                                    {isSender && (
                                        <div className='self-end mb-1'>
                                            {renderMessageStatus(message, isSender)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div ref={messagesEndRef} />
            </main>
            
            <footer className="sticky bottom-0 z-10 border-t bg-background p-2">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Mesajını yaz..."
                        className="flex-1 rounded-full bg-muted"
                    />
                    <Button type="submit" size="icon" className="rounded-full" disabled={!newMessage.trim()}>
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </footer>
        </div>
    );
}
