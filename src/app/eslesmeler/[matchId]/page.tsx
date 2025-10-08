
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, writeBatch, where, getDocs, deleteDoc, increment, collectionGroup, arrayUnion } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, MoreHorizontal, Check, CheckCheck, UserX, Paperclip, Mic, Trash2, Play, Pause, Square, Pencil, X, History, EyeOff, Gem, FileText } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ChatMessage, UserProfile, DenormalizedMatch, SystemMessage } from '@/lib/types';
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
import { Dialog, DialogContent, DialogClose, DialogFooter, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { langTr } from '@/languages/tr';
import Image from 'next/image';
import { Icons } from '@/components/icons';
import WaveSurfer from 'wavesurfer.js';
import { Progress } from '@/components/ui/progress';


const renderMessageStatus = (message: ChatMessage, isSender: boolean) => {
    if (!isSender || message.type === 'system_superlike_prompt' || message.senderId === 'system') return null;

    if (message.isRead) {
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
    }
    return <Check className="h-4 w-4 text-muted-foreground" />;
};


const AudioPlayer = ({ src }: { src: string }) => {
    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    useEffect(() => {
        if (!waveformRef.current) return;
        
        const wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#A1A1AA', // zinc-400
            progressColor: '#F43F5E', // rose-500
            height: 40,
            cursorWidth: 1,
            cursorColor: 'transparent',
            barWidth: 2,
            barGap: 3,
            url: src,
        });

        wavesurferRef.current = wavesurfer;

        wavesurfer.on('play', () => setIsPlaying(true));
        wavesurfer.on('pause', () => setIsPlaying(false));
        wavesurfer.on('finish', () => setIsPlaying(false));

        return () => {
            wavesurfer.destroy();
        };
    }, [src]);

    const handlePlayPause = () => {
        wavesurferRef.current?.playPause();
    };

    return (
        <div className="flex items-center gap-3 w-full">
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full" onClick={handlePlayPause}>
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <div ref={waveformRef} className="w-full h-[40px]" />
        </div>
    );
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
    const [isLoading, setIsLoading] = useState(true);
    const [isBlocking, setIsBlocking] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isAcceptingSuperLike, setIsAcceptingSuperLike] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [votedPolls, setVotedPolls] = useState<{[key: string]: string}>({});

    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'preview'>('idle');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
    const [deletingMessage, setDeletingMessage] = useState<ChatMessage | null>(null);
    const [newMessage, setNewMessage] = useState('');
    
    const [imagePreview, setImagePreview] = useState<{file: File, url: string} | null>(null);
    const [caption, setCaption] = useState('');
    const [isViewOnce, setIsViewOnce] = useState(false);

    const [viewingOnceImage, setViewingOnceImage] = useState<ChatMessage | null>(null);
    const [viewOnceProgress, setViewOnceProgress] = useState(0);
    
    const isSystemChat = matchId === 'system';
    const otherUserId = user && !isSystemChat ? matchId.replace(user.uid, '').replace('_', '') : null;
    
    const messagesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        const collectionPath = isSystemChat ? `system_messages` : `matches/${matchId}/messages`;
        return query(collection(firestore, collectionPath), orderBy('timestamp', 'asc'));
    }, [isSystemChat, matchId, user, firestore]);
    

    const otherUserDocRef = useMemoFirebase(() => {
        if (!otherUserId || !firestore) return null;
        return doc(firestore, 'users', otherUserId);
    }, [otherUserId, firestore]);

    const matchDataDocRef = useMemoFirebase(() => {
        if (!user || !firestore || isSystemChat) return null;
        return doc(firestore, `users/${user.uid}/matches`, matchId);
    }, [user, firestore, isSystemChat, matchId]);
    

    // Effect for reading chat/system messages and user data
    useEffect(() => {
        const unsubs: (()=>void)[] = [];
        
        // Listen for the other user's profile if it's a normal chat
        if (otherUserDocRef) {
            const unsub = onSnapshot(otherUserDocRef, (doc) => {
                setOtherUser(doc.exists() ? { ...doc.data(), uid: doc.id, id: doc.id } as UserProfile : null);
            });
            unsubs.push(unsub);
        } else if (!isSystemChat) {
            setOtherUser(null);
        }

        // Listen for the denormalized match data for this user
        if (matchDataDocRef) {
            const unsub = onSnapshot(matchDataDocRef, (doc) => {
                const data = doc.exists() ? doc.data() as DenormalizedMatch : null;
                setMatchData(data);
                // Mark message as seen when match data is loaded
                if (data?.lastSystemMessageId && user?.uid && firestore) {
                    const centralMessageRef = doc(firestore, 'system_messages', data.lastSystemMessageId);
                    updateDoc(centralMessageRef, {
                        seenBy: arrayUnion(user.uid)
                    }).catch(err => console.log("Already marked as seen or error:", err)); // Silently fail
                }
            });
            unsubs.push(unsub);
        } else if (!isSystemChat) {
            setMatchData(null);
        }

        // Listen for messages
        if (messagesQuery) {
            setIsLoading(true);
            const unsub = onSnapshot(messagesQuery, (snapshot) => {
                const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
                setMessages(fetchedMessages);
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching messages:", error);
                setIsLoading(false);
            });
            unsubs.push(unsub);
        } else {
            setIsLoading(false);
        }
        
        return () => unsubs.forEach(unsub => unsub());

    }, [otherUserDocRef, matchDataDocRef, messagesQuery, isSystemChat, user, firestore]);


    // Effect to mark messages as read and reset unread count
    useEffect(() => {
        if (!firestore || !user || isSystemChat || !matchId) return;
        
        const markAsRead = () => {
             // 1. Reset unread count on the user's denormalized match document
            const userMatchRef = doc(firestore, `users/${user.uid}/matches`, matchId);
            getDoc(userMatchRef).then(userMatchSnap => {
                if (userMatchSnap.exists() && (userMatchSnap.data().unreadCount > 0 || userMatchSnap.data().hasUnreadSystemMessage)) {
                    const updateData: {unreadCount?: number, hasUnreadSystemMessage?: boolean} = {};
                    if (userMatchSnap.data().unreadCount > 0) updateData.unreadCount = 0;
                    if (userMatchSnap.data().hasUnreadSystemMessage) updateData.hasUnreadSystemMessage = false;
                    updateDoc(userMatchRef, updateData);
                }
            });

            // 2. Mark individual messages as read (for user-to-user chat)
            if (!isSystemChat) {
                const unreadMessagesQuery = query(
                    collection(firestore, `matches/${matchId}/messages`), 
                    where('senderId', '!=', user.uid), 
                    where('isRead', '==', false)
                );
                getDocs(unreadMessagesQuery).then(unreadSnapshot => {
                    if (unreadSnapshot.empty) return;
                    
                    const batch = writeBatch(firestore);
                    unreadSnapshot.forEach(msgDoc => {
                        batch.update(msgDoc.ref, { 
                            isRead: true,
                            readTimestamp: serverTimestamp()
                        });
                    });
                    batch.commit();
                });
            }
        };

        markAsRead();
    }, [messages, firestore, user, matchId, isSystemChat]); 
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleVoteOnPoll = async (messageId: string, option: string) => {
      if (!user || !firestore || votedPolls[messageId]) return;

      const messageRef = doc(firestore, 'system_messages', messageId);

      try {
          // Use dot notation to increment a specific field in a map
          await updateDoc(messageRef, {
              [`pollResults.${option}`]: increment(1),
              // Also record that this user has voted on this poll
              votedBy: arrayUnion(user.uid)
          });
          setVotedPolls(prev => ({...prev, [messageId]: option}));
          toast({ title: 'Oyunuz Kaydedildi', description: `"${option}" seçeneğine oy verdiniz.` });
      } catch (error: any) {
          console.error("Error voting on poll:", error);
          if (error.code === 'permission-denied') {
              toast({ title: 'Hata', description: 'Bu ankete zaten oy vermiş olabilirsiniz.', variant: 'destructive' });
          } else {
              toast({ title: 'Hata', description: 'Oy verilirken bir sorun oluştu.', variant: 'destructive' });
          }
      }
    };


    const handleSendMessage = useCallback(async (
        content: { text?: string; imageUrl?: string; imagePublicId?: string; audioUrl?: string, audioDuration?: number; type?: ChatMessage['type'] } = {}
    ) => {
        if (!user || !firestore || isSystemChat || !otherUserId || !otherUser) return;
        
        if (editingMessage) {
            if (!newMessage.trim()) return;
            const messageRef = doc(firestore, `matches/${matchId}/messages`, editingMessage.id);
            await updateDoc(messageRef, {
                text: newMessage.trim(),
                isEdited: true,
                editedAt: serverTimestamp()
            });
            setEditingMessage(null);
            setNewMessage('');
            return;
        }

        const currentMessage = newMessage.trim();
        if (!currentMessage && !content.imageUrl && !content.audioUrl) return;

        if (currentMessage) setNewMessage('');
    
        const messageData: Partial<ChatMessage> = {
            matchId: matchId,
            senderId: user.uid,
            timestamp: serverTimestamp(),
            isRead: false,
            type: content.type || 'user'
        };
    
        if (content.imageUrl) {
            messageData.text = content.text;
            messageData.imageUrl = content.imageUrl;
            messageData.imagePublicId = content.imagePublicId;
            if(content.type === 'view-once') messageData.viewed = false;
        } else if (currentMessage) {
            messageData.text = currentMessage;
        } else if (content.audioUrl) {
            messageData.audioUrl = content.audioUrl;
            messageData.audioDuration = content.audioDuration;
        }
    
        const messageDocRef = await addDoc(collection(firestore, `matches/${matchId}/messages`), messageData);
    
        let lastMessageText = "Mesaj";
        if (messageData.type === 'view-once') lastMessageText = "📷 Fotoğraf";
        else if (messageData.imageUrl) lastMessageText = "📷 Fotoğraf";
        else if (messageData.text) lastMessageText = messageData.text;
        else if (messageData.audioUrl) lastMessageText = "▶️ Sesli Mesaj";
    
        const batch = writeBatch(firestore);

        const currentUserMatchRef = doc(firestore, `users/${user.uid}/matches`, matchId);
        batch.update(currentUserMatchRef, {
            lastMessage: lastMessageText,
            timestamp: serverTimestamp()
        });

        const otherUserMatchRef = doc(firestore, `users/${otherUserId}/matches`, matchId);
        batch.update(otherUserMatchRef, {
            lastMessage: lastMessageText,
            timestamp: serverTimestamp(),
            unreadCount: increment(1)
        });
        
        await batch.commit();

    }, [user, firestore, isSystemChat, otherUserId, otherUser, matchId, newMessage, editingMessage]);

    const handleFormSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage({ text: newMessage });
    }, [handleSendMessage, newMessage]);


    const handleFileSelect = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setImagePreview({ file, url: event.target?.result as string });
        };
        reader.readAsDataURL(file);
        
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSendImage = async () => {
        if (!imagePreview) return;
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', imagePreview.file);
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Fotoğraf yüklenemedi: ${response.statusText}`);
            }

            const { url, public_id } = await response.json();
            
            handleSendMessage({ 
                text: caption, 
                imageUrl: url, 
                imagePublicId: public_id, 
                type: isViewOnce ? 'view-once' : 'user'
            });

        } catch (error: any) {
            toast({
                title: 'Yükleme Başarısız',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
            setImagePreview(null);
            setCaption('');
            setIsViewOnce(false);
        }
    };
    
    // --- Audio Recording Logic ---

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = recorder;
            const audioChunks: Blob[] = [];

            recorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
                setAudioUrl(URL.createObjectURL(audioBlob));
                setRecordingStatus('preview');
                stream.getTracks().forEach(track => track.stop()); // Stop microphone access
            };

            recorder.start();
            setRecordingStatus('recording');
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Microphone access denied:", err);
            toast({
                title: "Mikrofon Erişimi Reddedildi",
                description: "Sesli mesaj göndermek için lütfen tarayıcı ayarlarından mikrofon izni verin.",
                variant: "destructive"
            });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recordingStatus === 'recording') {
            mediaRecorderRef.current.stop();
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
        }
    };

    const cancelRecording = () => {
        stopRecording();
        setRecordingStatus('idle');
        setAudioBlob(null);
        setAudioUrl(null);
    };
    
    const sendAudioMessage = async () => {
        if (!audioBlob) return;
        setIsUploading(true);
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.mp3`, { type: 'audio/mpeg' });
        
        const formData = new FormData();
        formData.append('file', audioFile);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Sesli mesaj yüklenemedi: ${response.statusText}`);
            }

            const { url } = await response.json();
            handleSendMessage({ audioUrl: url, audioDuration: recordingTime, type: 'audio' });
            
        } catch (error: any) {
             toast({
                title: 'Yükleme Başarısız',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
            setRecordingStatus('idle');
            setAudioBlob(null);
            setAudioUrl(null);
        }
    };

    const handleAcceptSuperLike = async () => {
        if (!user || !firestore || !otherUserId) return;
        setIsAcceptingSuperLike(true);

        try {
            const batch = writeBatch(firestore);

            const matchDocRef = doc(firestore, 'matches', matchId);
            batch.update(matchDocRef, {
                status: 'matched',
                matchDate: serverTimestamp(),
            });
            
            const user1MatchRef = doc(firestore, `users/${user.uid}/matches`, matchId);
            batch.update(user1MatchRef, { status: 'matched', lastMessage: "Super Like'ı kabul ettin!" });
            
            const user2MatchRef = doc(firestore, `users/${otherUserId}/matches`, matchId);
            batch.update(user2MatchRef, { status: 'matched', lastMessage: "Super Like'ın kabul edildi!" });
            
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
            const batch = writeBatch(firestore);
            
            const messagesRef = collection(firestore, `matches/${matchId}/messages`);
            const messagesSnap = await getDocs(messagesRef);
            messagesSnap.forEach(doc => batch.delete(doc.ref));

            const user1MatchRef = doc(firestore, `users/${user.uid}/matches`, matchId);
            batch.delete(user1MatchRef);

            const user2MatchRef = doc(firestore, `users/${otherUserId}/matches`, matchId);
            batch.delete(user2MatchRef);

            const mainMatchDocRef = doc(firestore, 'matches', matchId);
            batch.delete(mainMatchDocRef);

            await batch.commit();

            toast({
                title: 'Kullanıcı Engellendi',
                description: `${otherUser?.fullName} ile olan eşleşmeniz kaldırıldı.`,
            });
            
            router.push('/eslesmeler');

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
    
    const handleStartEditMessage = (message: ChatMessage) => {
        if (message.text) {
            setEditingMessage(message);
            setNewMessage(message.text);
        }
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
        setNewMessage('');
    };

    const handleDeleteMessage = async () => {
        if (!deletingMessage || !firestore) return;
        
        try {
            const messageRef = doc(firestore, `matches/${matchId}/messages`, deletingMessage.id);
            await deleteDoc(messageRef);
            setDeletingMessage(null);
             toast({
                title: 'Mesaj Silindi',
                description: 'Mesaj başarıyla silindi.',
            });
        } catch (error) {
            console.error("Error deleting message:", error);
            toast({
                title: t.common.error,
                description: 'Mesaj silinirken bir hata oluştu.',
                variant: 'destructive',
            });
        }
    };
    
    const renderTimestampLabel = (currentTimestamp: any, prevTimestamp: any) => {
        if (!currentTimestamp) return null;

        const date = currentTimestamp.toDate ? currentTimestamp.toDate() : new Date(currentTimestamp);
        const prevDate = prevTimestamp?.toDate ? prevTimestamp.toDate() : (prevTimestamp ? new Date(prevTimestamp) : null);
        
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
        if (!otherUser) return <span className="text-xs text-muted-foreground">Çevrimdışı</span>;
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

    const handleOpenViewOnce = (message: ChatMessage) => {
        if (!user || !firestore || !otherUserId || message.senderId === user.uid || message.viewed) return;
        
        // This function now IMMEDIATELY marks the photo as viewed and starts deletion process.
        const markAsViewed = async () => {
            const msgRef = doc(firestore, `matches/${matchId}/messages`, message.id);
            const publicId = message.imagePublicId;

            const batch = writeBatch(firestore);

            batch.update(msgRef, { 
                viewed: true,
                type: 'view-once-viewed',
                imageUrl: null, 
                imagePublicId: null,
                text: "📷 Fotoğraf açıldı",
            });
            
            const lastMessageUpdate = { lastMessage: "📷 Fotoğraf açıldı", timestamp: serverTimestamp() };
            const currentUserMatchRef = doc(firestore, `users/${user.uid}/matches`, matchId);
            const otherUserMatchRef = doc(firestore, `users/${otherUserId}/matches`, matchId);
            batch.update(currentUserMatchRef, lastMessageUpdate);
            batch.update(otherUserMatchRef, lastMessageUpdate);
            
            await batch.commit();

            if (publicId) {
                try {
                    await fetch('/api/delete-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ public_id: publicId }),
                    });
                } catch (err) {
                    console.error("Failed to delete 'view once' image from Cloudinary:", err);
                }
            }
        };

        markAsViewed();
        setViewingOnceImage(message);
        setViewOnceProgress(0);

        let animationFrameId: number;
        const timerDuration = 5000; // 5 seconds
        let startTime: number | null = null;
        
        const animateProgress = (timestamp: number) => {
            if (startTime === null) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min((elapsed / timerDuration) * 100, 100);
            setViewOnceProgress(progress);

            if (progress < 100) {
                animationFrameId = requestAnimationFrame(animateProgress);
            } else {
                setViewingOnceImage(null);
            }
        };

        animationFrameId = requestAnimationFrame(animateProgress);
    
        return () => cancelAnimationFrame(animationFrameId);
    };
    
    
    const isSuperLikePendingAndIsRecipient = !isSystemChat && matchData?.status === 'superlike_pending' && matchData?.superLikeInitiator !== user?.uid;
    const canSendMessage = !isSystemChat && matchData?.status === 'matched' && otherUser !== null;
    const showSendButton = newMessage.trim() !== '' && !editingMessage;
    const isOtherUserGold = otherUser?.membershipType === 'gold';
    
    return (
        <div className="flex h-dvh flex-col bg-background">
             <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-2">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                 <div className="flex items-center gap-3">
                    {isSystemChat ? (
                        <>
                           <Avatar className="h-9 w-9">
                               <Icons.bmIcon className="h-full w-full" />
                           </Avatar>
                           <div className="flex flex-col">
                               <span className="font-semibold">BeMatch - Sistem Mesajları</span>
                               <span className="text-xs text-green-500">Her zaman aktif</span>
                           </div>
                        </>
                    ) : (otherUser ? (
                         <>
                             <Avatar className="h-9 w-9">
                                <AvatarImage src={otherUser.profilePicture} />
                                <AvatarFallback>{otherUser.fullName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                   <span className="font-semibold">{otherUser.fullName}</span>
                                   {isOtherUserGold && <Icons.beGold width={20} height={20} />}
                                </div>
                                {renderOnlineStatus()}
                            </div>
                        </>
                    ) : (
                         <>
                           <Avatar className="h-9 w-9">
                               <Icons.bmIcon className="h-full w-full" />
                           </Avatar>
                           <div className="flex flex-col">
                               <span className="font-semibold">Kullanıcı Bulunamadı</span>
                               <span className="text-xs text-muted-foreground">Çevrimdışı</span>
                           </div>
                        </>
                    ))}
                </div>
                 {isSystemChat ? (
                    <div className="w-9 h-9"></div>
                 ) : (
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
                 )}
            </header>

            <main className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                    {messages.map((message, index) => {
                        const isSender = message.senderId === user?.uid;
                        const isSystem = message.senderId === 'system' || message.type === 'poll';
                        const prevMessage = index > 0 ? messages[index - 1] : null;

                        if (message.type === 'system_superlike_prompt' && !message.actionTaken && isSuperLikePendingAndIsRecipient) {
                            return (
                                <div key={message.id} className="text-center my-6 p-4 border rounded-lg bg-muted/50 space-y-4">
                                    <p className="text-sm">{message.text}</p>
                                    <Button onClick={handleAcceptSuperLike} disabled={isAcceptingSuperLike}>
                                        {isAcceptingSuperLike ? <Icons.logo width={24} height={24} className='animate-pulse' /> : <><Check className="mr-2 h-4 w-4" /> Kabul Et</>}
                                    </Button>
                                </div>
                            )
                        }

                        if (isSystem) {
                             const poll = message as SystemMessage;
                             const isVoted = poll.votedBy?.includes(user?.uid || '') || !!votedPolls[poll.id];
                             const myVote = isVoted ? (votedPolls[poll.id] || 'voted') : null;
                             const totalVotes = poll.pollResults ? Object.values(poll.pollResults).reduce((s, c) => s + c, 0) : 0;
                             
                             return (
                                <div key={message.id}>
                                    {renderTimestampLabel(message.timestamp, prevMessage?.timestamp)}
                                     <div className={cn("flex items-end gap-2 group justify-start")}>
                                         <Avatar className="h-8 w-8 self-end mb-1">
                                            <Icons.bmIcon className="h-full w-full" />
                                        </Avatar>
                                        <div className="max-w-[70%] rounded-2xl flex flex-col items-start bg-muted rounded-bl-none p-3 space-y-3">
                                          {poll.type === 'poll' ? (
                                              <>
                                                  <p className='break-words font-semibold text-left w-full'>{poll.pollQuestion}</p>
                                                  <div className='w-full space-y-2'>
                                                      {poll.pollOptions?.map(option => {
                                                        const votes = poll.pollResults?.[option] || 0;
                                                        const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                                                        return (
                                                            <Button 
                                                              key={option}
                                                              variant={myVote === option ? 'default' : 'secondary'}
                                                              className={cn("w-full justify-between h-auto text-wrap py-2", isVoted && "cursor-default")}
                                                              onClick={() => !isVoted && handleVoteOnPoll(poll.id, option)}
                                                              disabled={isVoted}
                                                            >
                                                                <span>{option}</span>
                                                                {isVoted && <span className='font-bold'>{percentage.toFixed(0)}%</span>}
                                                            </Button>
                                                        )
                                                      })}
                                                  </div>
                                              </>
                                          ) : (
                                            <p className='break-words whitespace-pre-wrap text-left w-full'>{message.text}</p>
                                          )}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                         if (message.type === 'view-once-viewed') {
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
                                                "max-w-[70%] rounded-2xl flex items-center gap-2 px-3 py-2 italic text-muted-foreground",
                                                isSender ? "bg-primary text-primary-foreground/80 rounded-br-none" : "bg-muted rounded-bl-none",
                                            )}
                                        >
                                            <EyeOff className="w-4 h-4" />
                                            <span>Açıldı</span>
                                        </div>
                                         <div className="flex items-center gap-1.5 self-end">
                                            <span className="text-xs shrink-0">{message.timestamp?.toDate ? format(message.timestamp.toDate(), 'HH:mm') : ''}</span>
                                            {isSender && renderMessageStatus(message, isSender)}
                                        </div>
                                    </div>
                                </div>
                            );
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
                                    {isSender && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setDeletingMessage(message)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                            {message.text && !message.imageUrl && <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => handleStartEditMessage(message)}><Pencil className="w-4 h-4" /></Button>}
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "max-w-[70%] rounded-2xl flex flex-col items-end",
                                            isSender ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none",
                                            message.type === 'view-once' ? 'p-0' : (message.imageUrl ? 'p-1.5' : 'px-3 py-2'),
                                            message.audioUrl && 'p-2 w-[250px]'
                                        )}
                                    >
                                        {message.type === 'view-once' ? (
                                             <button
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-2xl w-[180px]",
                                                    isSender ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                                                    (isSender) && "cursor-not-allowed"
                                                )}
                                                onClick={() => isSender ? null : handleOpenViewOnce(message)}
                                            >
                                                <History className="w-6 h-6 text-green-400" />
                                                <span className="font-medium text-base">{isSender ? "Fotoğraf Gönderildi" : "Fotoğraf"}</span>
                                            </button>
                                        ) : message.imageUrl ? (
                                            <Image src={message.imageUrl} alt={message.text || "Gönderilen fotoğraf"} width={200} height={200} className="rounded-xl w-full h-auto" />
                                        ) : null }

                                        {message.text && message.type !== 'view-once' && (
                                          <p className={cn('break-words text-left w-full', 
                                            message.imageUrl && 'px-2 pb-1 pt-2'
                                          )}>
                                            {message.text}
                                          </p>
                                        )}
                                        {message.audioUrl && (
                                            <AudioPlayer src={message.audioUrl} />
                                        )}
                                        <div className={cn("flex items-center gap-1.5 self-end", !message.imageUrl && !message.audioUrl && message.type !== 'view-once' && '-mb-1', message.imageUrl && message.type !== 'view-once' && 'pr-1.5 pb-0.5')}>
                                            {message.isEdited && <span className="text-xs opacity-70">(düzenlendi)</span>}
                                            <span className="text-xs shrink-0">{message.timestamp?.toDate ? format(message.timestamp.toDate(), 'HH:mm') : ''}</span>
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
                 {recordingStatus === 'idle' && (
                    <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                        {editingMessage && (
                            <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={handleCancelEdit}>
                                <X className="h-5 w-5" />
                            </Button>
                        )}
                        {!editingMessage && (
                            <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={handleFileSelect} disabled={isUploading}>
                                {isUploading ? <Icons.logo width={24} height={24} className="h-5 w-5 animate-pulse" /> : <Paperclip className="h-5 w-5" />}
                            </Button>
                        )}
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={editingMessage ? "Mesajı düzenle..." : "Mesajını yaz..."}
                            className="flex-1 rounded-full bg-muted"
                            disabled={isUploading}
                        />
                        {editingMessage ? (
                             <Button type="submit" size="icon" className="rounded-full bg-green-500 hover:bg-green-600" disabled={isUploading}>
                                <Check className="h-5 w-5" />
                             </Button>
                        ) : showSendButton ? (
                             <Button type="submit" size="icon" className="rounded-full" disabled={isUploading}>
                                <Send className="h-5 w-5" />
                             </Button>
                        ) : (
                             <Button type="button" size="icon" className="rounded-full" onClick={startRecording} disabled={isUploading}>
                                <Mic className="h-5 w-5" />
                             </Button>
                        )}
                    </form>
                 )}

                 {recordingStatus === 'recording' && (
                    <div className="flex items-center justify-between gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full text-red-500" onClick={cancelRecording}>
                            <Trash2 className="h-5 w-5" />
                        </Button>
                        <div className='flex items-center gap-2 font-mono text-sm'>
                            <div className='w-2 h-2 rounded-full bg-red-500 animate-pulse'></div>
                            <span>{new Date(recordingTime * 1000).toISOString().substr(14, 5)}</span>
                        </div>
                        <Button size="icon" className="rounded-full" onClick={stopRecording}>
                            <Square className="h-5 w-5 fill-white" />
                        </Button>
                    </div>
                 )}

                {recordingStatus === 'preview' && audioUrl && (
                     <div className="flex items-center justify-between gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={cancelRecording}>
                            <Trash2 className="h-5 w-5 text-red-500" />
                        </Button>
                        <div className="flex-1">
                            <AudioPlayer src={audioUrl} />
                        </div>
                        <Button size="icon" className="rounded-full" onClick={sendAudioMessage} disabled={isUploading}>
                           {isUploading ? <Icons.logo width={24} height={24} className="animate-pulse" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </div>
                )}
                 
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </footer>
            ) : matchData?.status === 'superlike_pending' && matchData?.superLikeInitiator === user?.uid ? (
                <div className="text-center text-sm text-muted-foreground p-4 border-t">
                    Yanıt bekleniyor...
                </div>
            ) : isSystemChat ? (
                 <div className="text-center text-sm text-muted-foreground p-4 border-t">
                    Sistem mesajlarına yanıt veremezsiniz.
                </div>
            ) : (
                <div className="text-center text-sm text-muted-foreground p-4 border-t bg-muted">
                    Bu kullanıcı artık mevcut değil.
                </div>
            )}
            
            <AlertDialog open={!!deletingMessage} onOpenChange={(open) => !open && setDeletingMessage(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mesajı Sil</AlertDialogTitle>
                        <AlertDialogDescription>Bu mesajı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteMessage} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>Sil</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
             <Dialog open={!!imagePreview} onOpenChange={(open) => !open && setImagePreview(null)}>
                <DialogContent className="p-0 border-0 bg-black/90 text-white max-w-full h-full max-h-full sm:rounded-none flex flex-col">
                    <DialogTitle className="sr-only">Fotoğraf Önizleme ve Gönderme</DialogTitle>
                    <DialogDescription className="sr-only">Göndermeden önce fotoğrafı önizleyin, başlık ekleyin ve tek seferlik görüntüleme olarak ayarlayın.</DialogDescription>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-20 rounded-full bg-black/50 hover:bg-black/70">
                            <X className="h-6 w-6" />
                        </Button>
                    </DialogClose>
                    <div className="flex-1 flex items-center justify-center relative p-8">
                        {imagePreview && <Image src={imagePreview.url} alt="Önizleme" fill style={{objectFit: 'contain'}}/>}
                    </div>
                    <DialogFooter className="p-4 bg-black/50 border-t border-white/20 sm:justify-between">
                        <div className='flex items-center gap-2 w-full'>
                            <Input
                                placeholder="Başlık ekle..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-gray-400"
                            />
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className={cn(
                                    "rounded-full border-2 w-10 h-10 font-bold", 
                                    isViewOnce ? "bg-primary border-primary text-primary-foreground" : "border-white text-white"
                                )}
                                onClick={() => {
                                    setIsViewOnce(!isViewOnce);
                                    toast({ title: isViewOnce ? "Tek seferlik mod kapatıldı." : "Fotoğraf tek seferlik olarak ayarlandı."});
                                }}
                            >
                                <History className='w-4 h-4'/>
                            </Button>
                            <Button type="button" size="icon" className="rounded-full h-12 w-12 shrink-0" onClick={handleSendImage} disabled={isUploading}>
                                {isUploading ? <Icons.logo width={24} height={24} className="animate-pulse" /> : <Send />}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Once Image Dialog */}
             <Dialog open={!!viewingOnceImage} onOpenChange={(open) => !open && setViewingOnceImage(null)}>
                <DialogContent className="p-0 border-0 bg-black max-w-full h-full max-h-full sm:rounded-none flex flex-col [--protect-layer]">
                     <DialogTitle className="sr-only">Tek Seferlik Fotoğraf</DialogTitle>
                     <DialogDescription className="sr-only">{otherUser?.fullName} tarafından gönderilen tek seferlik fotoğraf. Bu fotoğraf belirli bir süre sonra kaybolacak.</DialogDescription>
                     <DialogHeader className="p-4 flex flex-row items-center justify-between z-20 absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent">
                        <div className="flex items-center gap-3 text-white">
                           <Avatar className="h-8 w-8">
                               <AvatarImage src={isSender(viewingOnceImage?.senderId) ? userProfile?.profilePicture : otherUser?.profilePicture} />
                               <AvatarFallback>{isSender(viewingOnceImage?.senderId) ? userProfile?.fullName?.charAt(0) : otherUser?.fullName?.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <span className="font-semibold text-sm">{isSender(viewingOnceImage?.senderId) ? userProfile?.fullName : otherUser?.fullName}</span>
                       </div>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/20 hover:text-white" onClick={() => setViewingOnceImage(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </DialogClose>
                     </DialogHeader>
                     <div className="absolute top-2 left-2 right-2 z-10">
                        <Progress value={viewOnceProgress} className="h-1 bg-white/30" indicatorClassName="bg-white" />
                     </div>
                     <div className="flex-1 flex items-center justify-center relative">
                        {viewingOnceImage?.imageUrl && <Image src={viewingOnceImage.imageUrl} alt="Tek seferlik fotoğraf" fill style={{objectFit: 'contain'}}/>}
                     </div>
                     {viewingOnceImage?.text && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/70 to-transparent">
                            <p className="text-white text-center">{viewingOnceImage.text}</p>
                        </div>
                     )}
                </DialogContent>
            </Dialog>
        </div>
    );
    
    function isSender(senderId: string | undefined): boolean {
        return senderId === user?.uid;
    }
}
