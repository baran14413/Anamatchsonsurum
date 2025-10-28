
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, writeBatch, where, getDocs, deleteDoc, increment, collectionGroup, arrayUnion } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, MoreHorizontal, Check, CheckCheck, UserX, Paperclip, Mic, Trash2, Play, Pause, Square, Pencil, X, History, EyeOff, Gem, FileText, MapPin, Heart, Star, ChevronUp, Shield, File, BookOpen, Crown, Flag } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow, differenceInHours, differenceInMinutes } from 'date-fns';
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
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogClose, DialogFooter, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { langTr } from '@/languages/tr';
import Image from 'next/image';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import WaveSurfer from 'wavesurfer.js';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import ProfileCard from '@/components/profile-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import AppShell from '@/components/app-shell';
import lamejs from 'lamejs';

type IconName = keyof Omit<typeof LucideIcons, 'createLucideIcon' | 'LucideIcon'>;


const renderMessageStatus = (message: ChatMessage, isSender: boolean) => {
    // Since individual read receipts are removed, this is simplified.
    // You might want a different logic, e.g., showing check only for sent messages.
    if (!isSender || message.type === 'system_superlike_prompt' || message.senderId === 'system') return null;

    // For simplicity, we show a single check for sent messages.
    // A double check logic would require knowing if the other user has opened the chat,
    // which is now managed by unreadCount, not individual message status.
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


function ChatPageContent() {
    const params = useParams();
    const matchId = Array.isArray(params.matchId) ? params.matchId[0] : params.matchId;
    const router = useRouter();
    const { user, userProfile, firebaseApp } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const t = langTr;
    const storage = firebaseApp ? getStorage(firebaseApp) : null;

    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const [matchData, setMatchData] = useState<DenormalizedMatch | null>(null);
    const [messages, setMessages] = useState<(ChatMessage | SystemMessage)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBlocking, setIsBlocking] = useState(false);
    const [showBlockDialog, setShowBlockDialog] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isAcceptingSuperLike, setIsAcceptingSuperLike] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    const otherUserId = useMemo(() => {
        if (!user || isSystemChat || !matchId) return null;
        return matchId.replace(user.uid, '').replace('_', '');
    }, [user, isSystemChat, matchId]);
    
    const messagesQuery = useMemoFirebase(() => {
        if (!user || !firestore || !matchId) return null;
        const collectionPath = isSystemChat ? 'system_messages' : `matches/${matchId}/messages`;
        return query(collection(firestore, collectionPath), orderBy('timestamp', 'asc'));
    }, [isSystemChat, matchId, user, firestore]);
    

    const otherUserDocRef = useMemoFirebase(() => {
        if (!otherUserId || !firestore) return null;
        return doc(firestore, 'users', otherUserId);
    }, [otherUserId, firestore]);

    const matchDataDocRef = useMemoFirebase(() => {
        if (!user || !firestore || isSystemChat || !matchId) return null;
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
            });
            unsubs.push(unsub);
        } else if (!isSystemChat) {
            setMatchData(null);
        }

        // Listen for messages
        if (messagesQuery) {
            setIsLoading(true);
            const unsub = onSnapshot(messagesQuery, (snapshot) => {
                const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage | SystemMessage));
                
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

    }, [otherUserDocRef, matchDataDocRef, messagesQuery, isSystemChat]);


    // Effect to mark messages as read by resetting the unread count.
    useEffect(() => {
        if (!firestore || !user || !matchId) return;

        const markAsRead = async () => {
            const userMatchRef = doc(firestore, `users/${user.uid}/matches`, matchId);
            try {
                const docSnap = await getDoc(userMatchRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    let updatePayload: { [key: string]: any } = {};

                    if (isSystemChat) {
                        if (data.hasUnreadSystemMessage) {
                            updatePayload.hasUnreadSystemMessage = false;
                            
                            const systemMessageIds = messages.map(m => m.id);
                            if (systemMessageIds.length > 0) {
                                const batch = writeBatch(firestore);
                                systemMessageIds.forEach(msgId => {
                                    const centralMessageRef = doc(firestore, 'system_messages', msgId);
                                    batch.update(centralMessageRef, { seenBy: arrayUnion(user.uid) });
                                });
                                await batch.commit().catch(err => console.log("System message seen update error:", err));
                            }
                        }
                    } else {
                        if (data.unreadCount && data.unreadCount > 0) {
                            updatePayload.unreadCount = 0;
                        }
                    }
                    
                    if (Object.keys(updatePayload).length > 0) {
                        await updateDoc(userMatchRef, updatePayload);
                    }
                }
            } catch (error) {
                console.error("Error resetting unread count:", error);
            }
        };

        markAsRead();
    }, [firestore, user, matchId, messages, isSystemChat]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    const handleSendMessage = useCallback(async (
        content: { text?: string; imageUrl?: string; imagePublicId?: string; audioUrl?: string, audioDuration?: number; type?: ChatMessage['type'] } = {}
    ) => {
        if (!user || !firestore || isSystemChat || !otherUserId || !otherUser || !matchId) return;
        
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
        if (!imagePreview || !storage || !user) return;
        setIsUploading(true);
        
        const uniqueFileName = `bematch_chats/${matchId}/${Date.now()}-${imagePreview.file.name.replace(/\s+/g, '_')}`;
        const imageRef = storageRef(storage, uniqueFileName);

        try {
            const snapshot = await uploadBytes(imageRef, imagePreview.file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            handleSendMessage({ 
                text: caption, 
                imageUrl: downloadURL, 
                imagePublicId: uniqueFileName, 
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
            // Use a more compatible MIME type, or let the browser decide
            const options = { mimeType: MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm' };
            const recorder = new MediaRecorder(stream, options);

            mediaRecorderRef.current = recorder;
            const audioChunks: Blob[] = [];

            recorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: recorder.mimeType });
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

    const audioBufferToMp3 = async (audioBlob: Blob): Promise<Blob> => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const mp3encoder = new lamejs.Mp3Encoder(1, audioBuffer.sampleRate, 128);
        const pcm = audioBuffer.getChannelData(0);
        const mp3Data = [];

        const samples = new Int16Array(pcm.length);
        for (let i = 0; i < pcm.length; i++) {
            samples[i] = pcm[i] * 32767.5;
        }

        const buffer = mp3encoder.encodeBuffer(samples);
        if (buffer.length > 0) {
            mp3Data.push(buffer);
        }

        const flushed = mp3encoder.flush();
        if (flushed.length > 0) {
            mp3Data.push(flushed);
        }

        return new Blob(mp3Data, { type: 'audio/mp3' });
    };
    
    const sendAudioMessage = async () => {
        if (!audioBlob || !matchId || !storage || !user) return;
        setIsUploading(true);
        
        try {
            const mp3Blob = await audioBufferToMp3(audioBlob);
            const audioFile = new File([mp3Blob], `voice-message-${Date.now()}.mp3`, { type: 'audio/mpeg' });
            
            const uniqueFileName = `bematch_chats/${matchId}/audio/${Date.now()}.mp3`;
            const audioRef = storageRef(storage, uniqueFileName);

            const snapshot = await uploadBytes(audioRef, audioFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            handleSendMessage({ audioUrl: downloadURL, audioDuration: recordingTime, type: 'audio' });
            
        } catch (error: any) {
             toast({
                title: 'Ses Yükleme Başarısız',
                description: error.message || 'Sesli mesaj gönderilirken bir hata oluştu.',
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
        if (!user || !firestore || !otherUserId || !matchId) return;
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

    const handleUnmatchAndBlock = async () => {
        if (!user || !firestore || !otherUserId || !matchId) return;
        
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
                title: 'Eşleşme Kaldırıldı',
                description: `${otherUser?.fullName} ile olan eşleşmeniz kaldırıldı.`,
            });
            
            router.push('/eslesmeler');

        } catch (error: any) {
            console.error("Error unmatching user:", error);
            toast({
                title: t.common.error,
                description: 'Eşleşme kaldırılırken bir hata oluştu.',
                variant: 'destructive',
            });
        } finally {
            setIsBlocking(false);
            setShowBlockDialog(false);
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
        if (!deletingMessage || !firestore || !matchId) return;
        
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
        
        if (otherUser.isBot) {
            return <span className="text-xs text-green-500">Şu an aktif</span>;
        }

        if (otherUser.isOnline) {
            return <span className="text-xs text-green-500">Şu an aktif</span>;
        }
        
        if (otherUser.lastSeen) {
            const lastSeenDate = typeof otherUser.lastSeen === 'number' ? new Date(otherUser.lastSeen) : otherUser.lastSeen?.toDate();
            if (lastSeenDate && !isNaN(lastSeenDate.getTime())) {
                const minutesAgo = differenceInMinutes(new Date(), lastSeenDate);
                if (minutesAgo < 10) {
                   return <span className="text-xs text-yellow-500">Az önce aktifti</span>;
                }
                return <span className="text-xs text-muted-foreground">Yakınlarda aktifti</span>;
            }
        }
        return <span className="text-xs text-muted-foreground">Çevrimdışı</span>;
    }

    const handleOpenViewOnce = (message: ChatMessage) => {
        if (!user || !firestore || !otherUserId || message.senderId === user.uid || message.viewed || !matchId || !storage) return;
        
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
                    const imageRef = storageRef(storage, publicId);
                    await deleteObject(imageRef);
                } catch (err: any) {
                    if (err.code !== 'storage/object-not-found') {
                        console.error("Failed to delete 'view once' image from Firebase Storage:", err);
                    }
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
    
    const calculateAge = (dateOfBirth: string | undefined): number | null => {
        if (!dateOfBirth) return null;
        const birthday = new Date(dateOfBirth);
        if (isNaN(birthday.getTime())) return null;
        const ageDate = new Date(Date.now() - birthday.getTime());
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };
    
    const isSuperLikePendingAndIsRecipient = !isSystemChat && matchData?.status === 'superlike_pending' && matchData?.superLikeInitiator !== user?.uid;
    const canSendMessage = !isSystemChat && matchData?.status === 'matched' && otherUser !== null;
    const showSendButton = newMessage.trim() !== '' && !editingMessage;
    const isOtherUserGold = otherUser?.membershipType === 'gold';
    const age = otherUser ? calculateAge(otherUser.dateOfBirth) : null;
    const isNewUser = otherUser?.createdAt && (Date.now() - new Date(otherUser.createdAt.seconds * 1000).getTime()) < 7 * 24 * 60 * 60 * 1000;
    
    const groupedInterests = useMemo(() => {
        if (!otherUser?.interests) return {};

        const interestCategories = langTr.signup.step11.categories;
        const categoryMap: { [key: string]: { title: string; icon: IconName } } = {};
        interestCategories.forEach(cat => {
            cat.options.forEach(opt => {
                categoryMap[opt] = { title: cat.title, icon: cat.icon as IconName };
            });
        });

        const grouped: { [key: string]: { icon: IconName, interests: string[] } } = {};
        otherUser.interests.forEach(interest => {
            const categoryInfo = categoryMap[interest] || { title: 'Diğer', icon: 'Sparkles' };
            if (!grouped[categoryInfo.title]) {
                grouped[categoryInfo.title] = { icon: categoryInfo.icon, interests: [] };
            }
            grouped[categoryInfo.title].interests.push(interest);
        });
        return grouped;
    }, [otherUser?.interests]);
    
    const interestEntries = useMemo(() => Object.entries(groupedInterests), [groupedInterests]);
    const likeRatio = useMemo(() => otherUser ? Math.floor(Math.random() * (98 - 70 + 1)) + 70 : 0, [otherUser?.uid]);

    return (
        <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 bg-background px-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/eslesmeler')}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                 <div className="flex flex-1 items-center gap-3">
                    {isSystemChat ? (
                        <>
                            <Avatar className="h-10 w-10">
                                <Icons.bmIcon className='h-full w-full' />
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold">BeMatch Sistem</span>
                                <span className="text-xs text-muted-foreground">Resmi Duyurular</span>
                            </div>
                        </>
                    ) : otherUser ? (
                       <Sheet>
                           <SheetTrigger asChild>
                                <div className="flex items-center gap-3 cursor-pointer">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={otherUser.profilePicture} />
                                        <AvatarFallback>{otherUser.fullName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{otherUser.fullName}</span>
                                        {renderOnlineStatus()}
                                    </div>
                                </div>
                            </SheetTrigger>
                             <SheetContent side="bottom" className='h-[90vh] rounded-t-2xl bg-card text-card-foreground border-none p-0 flex flex-col'>
                                <SheetHeader className='p-2 flex-row items-center justify-between'>
                                        <SheetTitle className="text-xl">{otherUser.fullName}</SheetTitle>
                                        <SheetClose asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full" type="button">
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </SheetClose>
                                </SheetHeader>
                                <ScrollArea className='flex-1'>
                                    <div className="space-y-6">
                                        {otherUser.images && otherUser.images.length > 0 && (
                                                <Carousel className="w-full">
                                                <CarouselContent>
                                                    {otherUser.images
                                                        .map((image, index) => (
                                                        <CarouselItem key={index}>
                                                            <div className="relative w-full aspect-[4/3]">
                                                                <Image
                                                                    src={image.url}
                                                                    alt={`${otherUser.fullName} profil medyası ${index + 1}`}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        </CarouselItem>
                                                    ))}
                                                </CarouselContent>
                                                <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1:2 z-10 bg-black/30 text-white border-none hover:bg-black/50" />
                                                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1:2 z-10 bg-black/30 text-white border-none hover:bg-black/50" />
                                            </Carousel>
                                        )}
                                        
                                        <div className="p-6 space-y-6 !pt-2">
                                            <div className="text-left space-y-2">
                                                    <div className='flex flex-col items-start'>
                                                    {otherUser.membershipType === 'gold' && (
                                                        <div className='flex items-center gap-2'>
                                                        <Icons.beGold width={24} height={24} />
                                                        <p className="font-semibold text-yellow-500">Gold Üye</p>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-3xl font-bold">
                                                            {otherUser.fullName}
                                                        </h3>
                                                        <span className="font-semibold text-foreground/80 text-3xl">{age}</span>
                                                    </div>
                                                </div>
                                                {isNewUser && <Badge className="bg-blue-500 text-white border-blue-500 shrink-0 !mt-3">Yeni Üye</Badge>}
                                                
                                                {otherUser.location && (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>
                                                            Konum bilgisi mevcut
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {likeRatio && (
                                                <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 p-3">
                                                <Heart className="w-6 h-6 text-red-400 fill-red-400 shrink-0" />
                                                <div className='flex-1'>
                                                    <p className="font-bold text-base">Beğenilme Oranı: %{likeRatio}</p>
                                                    <p className='text-sm text-muted-foreground'>Kullanıcıların %{likeRatio}'si bu profili beğendi.</p>
                                                </div>
                                            </div>
                                            )}
                                            
                                            {otherUser.bio && (
                                                <div>
                                                    <h4 className='text-lg font-semibold mb-2'>Hakkında</h4>
                                                    <p className='text-muted-foreground'>{otherUser.bio}</p>
                                                </div>
                                            )}
                                            
                                            {interestEntries.length > 0 && (
                                                <div>
                                                    <h4 className='text-lg font-semibold mb-4'>İlgi Alanları</h4>
                                                    <div className="space-y-4">
                                                        {interestEntries.map(([category, { icon, interests }]) => {
                                                            const IconComponent = LucideIcons[icon] as React.ElementType || LucideIcons.Sparkles;
                                                            return (
                                                                <div key={category} className="flex items-start gap-3">
                                                                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                                                        <IconComponent className="w-6 h-6 text-primary" />
                                                                    </div>
                                                                    <div className='flex flex-col'>
                                                                            <span className="font-medium text-sm">{category}</span>
                                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                                            {interests.map(interest => (
                                                                                <Badge key={interest} variant="secondary" className='text-base py-1 px-3'>{interest}</Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
                            <div className="flex flex-col gap-2">
                                <div className="h-4 w-24 bg-muted rounded-md animate-pulse"></div>
                                <div className="h-3 w-16 bg-muted rounded-md animate-pulse"></div>
                            </div>
                        </div>
                    )}
                </div>
                
                 {!isSystemChat && otherUser && (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <MoreHorizontal className="h-6 w-6" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/rapor-et?userId=${otherUser.uid}&matchId=${matchId}`)}>
                                <Flag className="mr-2 h-4 w-4" />
                                <span>Rapor Et</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => setShowBlockDialog(true)} className='text-red-500 focus:text-red-500'>
                                <UserX className="mr-2 h-4 w-4" />
                                <span>Engelle & Eşleşmeyi Kaldır</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                 {isSystemChat && (
                    <div className="w-9 h-9" /> // Placeholder for alignment
                 )}
            </header>
            <main className="flex-1 overflow-y-auto p-4">
                 {isSuperLikePendingAndIsRecipient && (
                    <div className="text-center my-6 p-4 border rounded-lg bg-blue-500/10 border-blue-500/30 space-y-4">
                        <div className='flex items-center justify-center gap-2'>
                            <Star className='w-6 h-6 text-blue-400 fill-blue-400'/>
                            <p className="font-semibold text-base">{otherUser?.fullName} sana bir Super Like gönderdi!</p>
                        </div>
                        <Button onClick={handleAcceptSuperLike} disabled={isAcceptingSuperLike}>
                            {isAcceptingSuperLike ? <Icons.logo width={24} height={24} className='animate-pulse' /> : <><Heart className="mr-2 h-4 w-4" /> Eşleş</>}
                        </Button>
                    </div>
                )}
                 {isSystemChat && (
                    <div className="p-4 mb-4 text-center rounded-lg bg-muted">
                        <p className="text-sm text-muted-foreground">
                            Burası BeMatch ekibinden gelen resmi duyuruları bulabileceğin yerdir.
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                             <Button asChild variant="link">
                                <Link href="/tos"><BookOpen className="mr-2 h-4 w-4" />Kullanım Koşulları</Link>
                            </Button>
                            <Button asChild variant="link">
                                <Link href="/privacy"><Shield className="mr-2 h-4 w-4" />Gizlilik Politikası</Link>
                            </Button>
                        </div>
                    </div>
                )}
                <div className="space-y-1">
                    {messages.map((message, index) => {
                        const isSender = 'senderId' in message && message.senderId === user?.uid;
                        const isSystemGenerated = 'senderId' in message && message.senderId === 'system';
                        const prevMessage = index > 0 ? messages[index - 1] : null;

                        if (isSystemChat && 'text' in message) {
                             return (
                                <div key={message.id}>
                                    {renderTimestampLabel(message.timestamp, prevMessage?.timestamp)}
                                    <div className={cn("flex items-end gap-2 group justify-start")}>
                                        <Avatar className="h-8 w-8 self-end mb-1">
                                            <Icons.bmIcon className="h-full w-full" />
                                        </Avatar>
                                        <div className="max-w-[70%] rounded-2xl flex flex-col items-start bg-muted rounded-bl-none p-3 space-y-3">
                                            <p className='break-words whitespace-pre-wrap text-left w-full'>{message.text}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        
                        const chatMessage = message as ChatMessage;

                        if (chatMessage.type === 'view-once-viewed') {
                            return (
                                <div key={chatMessage.id}>
                                    {renderTimestampLabel(chatMessage.timestamp, prevMessage?.timestamp)}
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
                                            <span className="text-xs shrink-0">{chatMessage.timestamp?.toDate ? format(chatMessage.timestamp.toDate(), 'HH:mm') : ''}</span>
                                            {isSender && renderMessageStatus(chatMessage, isSender)}
                                        </div>
                                    </div>
                                </div>
                            );
                        }


                        return (
                            <div key={chatMessage.id}>
                                {renderTimestampLabel(chatMessage.timestamp, prevMessage?.timestamp)}
                                <div className={cn("flex items-end gap-2 group", isSender ? "justify-end" : "justify-start")}>
                                    {!isSender && (
                                        <Avatar className="h-8 w-8 self-end mb-1">
                                            <AvatarImage src={otherUser?.profilePicture} />
                                            <AvatarFallback>{otherUser?.fullName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    {isSender && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setDeletingMessage(chatMessage)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                            {chatMessage.text && !chatMessage.imageUrl && <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => handleStartEditMessage(chatMessage)}><Pencil className="w-4 h-4" /></Button>}
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "max-w-[70%] rounded-2xl flex flex-col items-end",
                                            isSender ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none",
                                            chatMessage.type === 'view-once' ? 'p-0' : (chatMessage.imageUrl ? 'p-1.5' : 'px-3 py-2'),
                                            chatMessage.audioUrl && 'p-2 w-[250px]'
                                        )}
                                    >
                                        {chatMessage.type === 'view-once' ? (
                                            <button
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-2xl w-[180px]",
                                                    isSender ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                                                    (isSender) && "cursor-not-allowed"
                                                )}
                                                onClick={() => isSender ? null : handleOpenViewOnce(chatMessage)}
                                            >
                                                <History className="w-6 h-6 text-green-400" />
                                                <span className="font-medium text-base">{isSender ? "Fotoğraf Gönderildi" : "Fotoğraf"}</span>
                                            </button>
                                        ) : chatMessage.imageUrl ? (
                                            <Image src={chatMessage.imageUrl} alt={chatMessage.text || "Gönderilen fotoğraf"} width={200} height={200} className="rounded-xl w-full h-auto" />
                                        ) : null }

                                        {chatMessage.text && chatMessage.type !== 'view-once' && (
                                        <p className={cn('break-words text-left w-full', 
                                            chatMessage.imageUrl && 'px-2 pb-1 pt-2'
                                        )}>
                                            {chatMessage.text}
                                        </p>
                                        )}
                                        {chatMessage.audioUrl && (
                                            <AudioPlayer src={chatMessage.audioUrl} />
                                        )}
                                        <div className={cn("flex items-center gap-1.5 self-end", !chatMessage.imageUrl && !chatMessage.audioUrl && chatMessage.type !== 'view-once' && '-mb-1', chatMessage.imageUrl && chatMessage.type !== 'view-once' && 'pr-1.5 pb-0.5')}>
                                            {chatMessage.isEdited && <span className="text-xs opacity-70">(düzenlendi)</span>}
                                            <span className="text-xs shrink-0">{chatMessage.timestamp?.toDate ? format(chatMessage.timestamp.toDate(), 'HH:mm') : ''}</span>
                                            {isSender && renderMessageStatus(chatMessage, isSender)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div ref={messagesEndRef} />
            </main>
            
            {isSystemChat ? null : canSendMessage ? (
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
                                <X className="h-6 w-6" />
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
             <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Engelle & Eşleşmeyi Kaldır</AlertDialogTitle>
                    <AlertDialogDescription>
                    Bu işlem geri alınamaz. {otherUser?.fullName} ile olan eşleşmeniz ve tüm sohbet geçmişiniz kalıcı olarak silinecektir. Bu kullanıcıyı bir daha görmeyeceksiniz.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUnmatchAndBlock} disabled={isBlocking} className='bg-destructive hover:bg-destructive/90'>
                        {isBlocking ? <Icons.logo width={16} height={16} className='animate-pulse mr-2' /> : <UserX className='mr-2 h-4 w-4'/>}
                        Engelle
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
    
    function isSender(senderId: string | undefined): boolean {
        return senderId === user?.uid;
    }
}


export default function ChatPage() {
    return (
        <AppShell>
            <ChatPageContent/>
        </AppShell>
    )
}
