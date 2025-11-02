
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase/provider';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, writeBatch, serverTimestamp, getDocs, where, addDoc, limit, setDoc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Trash2, Check, Star, Info, ArrowLeft, Heart } from 'lucide-react';
import { langTr } from '@/languages/tr';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { DenormalizedMatch, ChatMessage, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/app-shell';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

function EslesmelerPageContent() {
  const t = langTr.eslesmeler;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [matches, setMatches] = useState<DenormalizedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatToInteract, setChatToInteract] = useState<DenormalizedMatch | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const matchesQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
        collection(firestore, `users/${user.uid}/matches`),
        orderBy('timestamp', 'desc')
    );
  }, [user, firestore]);
  
  useEffect(() => {
    if (!matchesQuery) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
        const matchesData = snapshot.docs.map(doc => doc.data() as DenormalizedMatch);
        setMatches(matchesData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching matches:", error);
        setIsLoading(false);
        toast({
            title: "Hata",
            description: "Eşleşmeler getirilirken bir hata oluştu.",
            variant: "destructive"
        })
    });
    
    return () => unsubscribe();
  }, [matchesQuery, toast]);


  const { realMatches, pendingSuperLikes, systemMatch } = useMemo(() => {
    if (!matches) return { realMatches: [], pendingSuperLikes: [], systemMatch: null };
    
    const allMatches = matches.filter(m => m.id !== 'system');
    const filteredMatches = allMatches.filter(m => !searchTerm || (m.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const realMatches = filteredMatches.filter(m => m.status === 'matched');
    const pendingSuperLikes = filteredMatches.filter(m => m.status === 'superlike_pending' && m.superLikeInitiator !== user?.uid);
    const systemMatch = matches.find(m => m.id === 'system');
    
    return { realMatches, pendingSuperLikes, systemMatch };
  }, [matches, searchTerm, user?.uid]);

  const handleDeleteChat = async () => {
    if (!chatToInteract || !user || !firestore) return;
    setIsDeleting(true);

    try {
        const otherUserId = chatToInteract.matchedWith;
        const matchId = chatToInteract.id;

        const batch = writeBatch(firestore);

        const userMatchRef = doc(firestore, `users/${user.uid}/matches`, matchId);
        batch.delete(userMatchRef);

        const otherUserMatchRef = doc(firestore, `users/${otherUserId}/matches`, matchId);
        batch.delete(otherUserMatchRef);

        const mainMatchRef = doc(firestore, 'matches', matchId);
        batch.delete(mainMatchRef);

        const messagesRef = collection(firestore, `matches/${matchId}/messages`);
        const messagesSnap = await getDocs(messagesRef);
        messagesSnap.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        
        setChatToInteract(null);
        toast({
            title: 'Sohbet Silindi',
            description: `${chatToInteract.fullName} ile olan sohbetiniz kalıcı olarak silindi.`,
        });

    } catch (error: any) {
        console.error("Error deleting chat:", error);
        toast({
            title: 'Hata',
            description: error.message || 'Sohbet silinirken bir hata oluştu.',
            variant: 'destructive',
        });
    } finally {
        setIsDeleting(false);
    }
  };

  const handleAcceptSuperLike = async (e: React.MouseEvent, match: DenormalizedMatch) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !firestore) return;

    try {
        const batch = writeBatch(firestore);

        const matchDocRef = doc(firestore, 'matches', match.id);
        batch.set(matchDocRef, { status: 'matched', matchDate: serverTimestamp() }, { merge: true });

        const currentUserMatchRef = doc(firestore, `users/${user.uid}/matches`, match.id);
        batch.set(currentUserMatchRef, { status: 'matched', lastMessage: "Super Like'ı kabul ettin!" }, { merge: true });
        
        const otherUserMatchRef = doc(firestore, `users/${match.matchedWith}/matches`, match.id);
        batch.set(otherUserMatchRef, { status: 'matched', lastMessage: "Super Like'ın kabul edildi!" }, { merge: true });
        
        await batch.commit();
        
        toast({
            title: 'Super Like Kabul Edildi!',
            description: `${match.fullName} ile artık eşleştiniz.`,
        });
        
        router.push(`/eslesmeler/${match.id}`);

    } catch (error) {
        console.error("Error accepting super like:", error);
        toast({
            title: 'Hata',
            description: 'Super Like kabul edilirken bir hata oluştu.',
            variant: 'destructive',
        });
    }
  };
  
  const MatchItem = ({ match, onClick, onAcceptSuperLike, onDelete }: { match: DenormalizedMatch, onClick: () => void, onAcceptSuperLike?: (e: React.MouseEvent) => void, onDelete?: () => void }) => {
    const isSystemChat = match.id === 'system';
    const hasUnread = isSystemChat ? match.hasUnreadSystemMessage : (match.unreadCount && match.unreadCount > 0);
    const isUserDeleted = !match.fullName && !isSystemChat;
    const isPendingSuperlike = match.status === 'superlike_pending';

    const content = (
      <div className="flex items-center p-4 hover:bg-muted/50" onContextMenu={(e) => { if (onDelete) { e.preventDefault(); onDelete(); }}}>
        <div className='relative'>
          <Avatar className="h-12 w-12">
            {isSystemChat ? <Icons.bmIcon className='h-full w-full' /> : (isUserDeleted ? <Icons.bmIcon className='h-full w-full' /> : <AvatarImage src={match.profilePicture} />)}
            <AvatarFallback>{isSystemChat ? 'BM' : (isUserDeleted ? 'X' : (match.fullName || '').charAt(0))}</AvatarFallback>
          </Avatar>
          {hasUnread && !isPendingSuperlike && <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-primary ring-2 ring-background" />}
          {isPendingSuperlike && (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 ring-2 ring-background">
              <Star className='h-3 w-3 text-white fill-white' />
            </span>
          )}
        </div>
        <div className="ml-4 flex-1 overflow-hidden">
          <div className="flex justify-between items-center">
            <h3 className={cn("font-semibold flex items-center gap-1.5 truncate", hasUnread && "text-foreground")}>
              {isUserDeleted ? 'Kullanıcı Bulunamadı' : match.fullName}
              {match.isSuperLike && !isPendingSuperlike && <Star className="h-4 w-4 text-blue-500 fill-blue-500" />}
            </h3>
            {match.timestamp?.toDate && (
              <p className="text-xs text-muted-foreground shrink-0 pl-2">
                {formatDistanceToNow(match.timestamp.toDate(), { addSuffix: true, locale: tr })}
              </p>
            )}
          </div>
          <p className={cn("text-sm truncate", hasUnread && "text-foreground font-medium", "text-muted-foreground")}>
            {isPendingSuperlike ? <span className='font-bold text-blue-600 dark:text-blue-400'>Sana Super Like gönderdi!</span> : match.lastMessage}
          </p>
        </div>
        {isPendingSuperlike && onAcceptSuperLike && (
          <Button size="sm" onClick={onAcceptSuperLike} className='ml-2 shrink-0 bg-green-500 hover:bg-green-600'>
            <Check className='mr-1 h-4 w-4'/> Eşleş
          </Button>
        )}
      </div>
    );
    
    if (isUserDeleted && !isSystemChat) {
      return <div className="relative cursor-not-allowed opacity-70">{content}</div>
    }

    return (
        <motion.div
            key={match.id}
            className="transform-gpu"
            onClick={onClick}
        >
          {content}
        </motion.div>
    );
  };


  if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-background">
            <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
        </div>
      )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-semibold">{t.title}</h1>
            <div className="w-9"></div>
        </header>

        {(!matches || matches.length === 0) && !isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                <MessageSquare className="h-20 w-20 text-muted-foreground/30" strokeWidth={1} />
                <div className='space-y-1'>
                    <h2 className="text-2xl font-bold text-foreground">{t.noChatsTitle}</h2>
                    <p className='text-muted-foreground'>{t.noChatsDescription}</p>
                </div>
            </div>
        ) : (
            <>
                <div className="p-4 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Sohbetlerde Ara" className="pl-10 bg-secondary" onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                
                <div className='flex-1 overflow-y-auto'>
                        <div className="divide-y">
                           {systemMatch && (
                              <MatchItem match={systemMatch} onClick={() => router.push(`/eslesmeler/system`)} />
                           )}
                           {pendingSuperLikes.map(match => (
                               <MatchItem key={match.id} match={match} onClick={() => {}} onAcceptSuperLike={(e) => handleAcceptSuperLike(e, match)} />
                           ))}
                           {realMatches.map(match => (
                                <MatchItem key={match.id} match={match} onClick={() => router.push(`/eslesmeler/${match.id}`)} onDelete={() => setChatToInteract(match)} />
                           ))}
                        </div>
                </div>
            </>
        )}

        <AlertDialog open={!!chatToInteract} onOpenChange={(isOpen) => !isOpen && setChatToInteract(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Sohbeti Silmek İstediğinizden Emin misiniz?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu işlem geri alınamaz. {chatToInteract?.fullName} ile olan tüm sohbet geçmişiniz, gönderilen fotoğraflar dahil kalıcı olarak silinecektir.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Kapat</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteChat} disabled={isDeleting} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                        {isDeleting ? <><Icons.logo width={16} height={16} className="mr-2 animate-pulse" /> Siliniyor...</> : <><Trash2 className='mr-2 h-4 w-4' />Sil</>}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

export default function EslesmelerPage() {
    return (
        <AppShell>
            <EslesmelerPageContent />
        </AppShell>
    );
}
