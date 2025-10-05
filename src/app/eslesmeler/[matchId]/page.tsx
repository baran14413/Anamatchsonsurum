
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, MoreHorizontal, Check, ShieldCheck } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ChatMessage, UserProfile } from '@/lib/types';

export default function ChatPage() {
    const { matchId } = useParams() as { matchId: string };
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();

    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user || !firestore || !matchId) return;

        const otherUserId = matchId.replace(user.uid, '').replace('_', '');

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
    }, [matchId, user, firestore]);
    
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
        };

        setNewMessage('');
        
        // Add the new message to the subcollection
        await addDoc(collection(firestore, `matches/${matchId}/messages`), messageData);

        // Update the last message in the denormalized match data for both users
        const lastMessageUpdate = {
            lastMessage: newMessage.trim(),
            timestamp: serverTimestamp(),
        };
        const user1Id = matchId.split('_')[0];
        const user2Id = matchId.split('_')[1];

        await updateDoc(doc(firestore, `users/${user1Id}/matches`, matchId), lastMessageUpdate);
        await updateDoc(doc(firestore, `users/${user2Id}/matches`, matchId), lastMessageUpdate);
    };
    
    const renderTimestampLabel = (timestamp: any, prevTimestamp: any) => {
        if (!timestamp) return null;

        const date = timestamp.toDate();
        const prevDate = prevTimestamp?.toDate();
        
        // If it's the first message or the day is different from the previous one
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
                    <div className="flex items-center gap-1">
                        <span className="font-semibold">{otherUser?.fullName}</span>
                         <ShieldCheck className="h-5 w-5 text-primary" fill="currentColor" />
                    </div>
                </div>
                <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-6 w-6" />
                </Button>
            </header>

            <main className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                    {messages.map((message, index) => {
                        const isSender = message.senderId === user?.uid;
                        const prevMessage = index > 0 ? messages[index - 1] : null;

                        return (
                            <div key={message.id}>
                                {renderTimestampLabel(message.timestamp, prevMessage?.timestamp)}
                                <div className={cn("flex items-end gap-2", isSender ? "justify-end" : "justify-start")}>
                                     {!isSender && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={otherUser?.profilePicture} />
                                            <AvatarFallback>{otherUser?.fullName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div
                                        className={cn(
                                            "max-w-[70%] rounded-2xl px-4 py-2",
                                            isSender ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                                        )}
                                    >
                                        <p>{message.text}</p>
                                    </div>
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
