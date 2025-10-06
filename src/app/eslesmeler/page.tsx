
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, writeBatch, serverTimestamp, getDocs, where, addDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Trash2, Check, Star } from 'lucide-react';
import { langTr } from '@/languages/tr';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { DenormalizedMatch } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function EslesmelerPage() {
  const t = langTr.eslesmeler;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [matches, setMatches] = useState<DenormalizedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatToDelete, setChatToDelete] = useState<DenormalizedMatch | null>(null);

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    const matchesQuery = query(
      collection(firestore, `users/${user.uid}/matches`),
      orderBy('timestamp', 'desc')
    );
    
    const unsubMatches = onSnapshot(matchesQuery, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => doc.data() as DenormalizedMatch);
      setMatches(matchesData);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching matches:", error);
        setIsLoading(false);
    });

    // Ensure default system message exists
     const systemMessageRef = collection(firestore, `users/${user.uid}/system_messages`);
     getDocs(query(systemMessageRef, where('senderId', '==', 'system'))).then(snapshot => {
         if (snapshot.empty) {
             addDoc(systemMessageRef, {
                 senderId: 'system',
                 text: 'Yeni gelenlere hoşgeldiniz ve kisa bir uygulama tanitimimiz',
                 timestamp: serverTimestamp(),
                 isRead: true,
             });
         }
     });

    return () => {
      unsubMatches();
    };

  }, [user, firestore]);

  const filteredMatches = useMemo(() => {
    if (!searchTerm) {
      return matches;
    }
    return matches.filter(match =>
        match.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matches, searchTerm]);

  const handleDeleteChat = async () => {
    if (!chatToDelete) return;
    setIsDeleting(true);

    try {
        const response = await fetch('/api/delete-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId: chatToDelete.id }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Sohbet silinemedi.');
        }
        
        setChatToDelete(null);
        toast({
            title: 'Sohbet Silindi',
            description: `${chatToDelete.fullName} ile olan sohbetiniz kalıcı olarak silindi.`,
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

        // Update the main match document
        const matchDocRef = doc(firestore, 'matches', match.id);
        batch.update(matchDocRef, { status: 'matched', matchDate: serverTimestamp() });

        // Update denormalized documents
        const currentUserMatchRef = doc(firestore, `users/${user.uid}/matches`, match.id);
        batch.update(currentUserMatchRef, { status: 'matched', lastMessage: "Super Like'ı kabul ettin!" });
        
        const otherUserMatchRef = doc(firestore, `users/${match.matchedWith}/matches`, match.id);
        batch.update(otherUserMatchRef, { status: 'matched', lastMessage: "Super Like'ın kabul edildi!" });

        // Update the system message
        const messagesColRef = collection(firestore, `matches/${match.id}/messages`);
        const q = query(messagesColRef, where('type', '==', 'system_superlike_prompt'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { action: 'accepted', actionTaken: true });
        });
        
        await batch.commit();
        
        toast({
            title: 'Super Like Kabul Edildi!',
            description: `${match.fullName} ile artık eşleştiniz.`,
        });

    } catch (error) {
        console.error("Error accepting super like:", error);
        toast({
            title: 'Hata',
            description: 'Super Like kabul edilirken bir hata oluştu.',
            variant: 'destructive',
        });
    }
  };

   const systemMatch: DenormalizedMatch = {
        id: 'system',
        matchedWith: 'system',
        lastMessage: 'Yeni gelenlere hoşgeldiniz ve kisa bir uygulama tanitimimiz',
        timestamp: null, 
        fullName: 'BeMatch - Sistem Mesajları',
        profilePicture: '', // Use app logo
    };

  if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
        </div>
      )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
        {(matches.length === 0 && !isLoading) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">{t.noChatsTitle}</h2>
                <p>{t.noChatsDescription}</p>
            </div>
        ) : (
            <>
                <div className="p-4 border-b shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Sohbetlerde Ara" className="pl-10 bg-background" onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                
                <div className='flex-1 overflow-y-auto'>
                        <div className="divide-y">
                            {[systemMatch, ...filteredMatches].map(match => {
                                const isSuperLikePending = match.status === 'superlike_pending';
                                const isSuperLikeInitiator = match.superLikeInitiator === user?.uid;
                                const showAcceptButton = isSuperLikePending && !isSuperLikeInitiator;
                                const isSystemChat = match.id === 'system';

                                const MatchItemContent = () => (
                                    <div className="flex items-center p-4 hover:bg-muted/50">
                                        <Avatar className="h-12 w-12">
                                            {isSystemChat ? <Icons.logo className='h-full w-full' /> : <AvatarImage src={match.profilePicture} />}
                                            <AvatarFallback>{match.fullName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="ml-4 flex-1">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-semibold flex items-center gap-1.5">
                                                  {match.fullName}
                                                  {!isSystemChat && match.isSuperLike && <Star className="h-4 w-4 text-blue-500 fill-blue-500" />}
                                                </h3>
                                                {match.timestamp && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(match.timestamp.toDate(), { addSuffix: true, locale: tr })}
                                                    </p>
                                                )}
                                            </div>
                                            <p className={cn("text-sm truncate", isSuperLikeInitiator && isSuperLikePending ? "text-blue-500 font-medium" : "text-muted-foreground")}>{match.lastMessage}</p>
                                        </div>
                                        {showAcceptButton && (
                                            <Button variant="ghost" size="icon" className="ml-2 h-10 w-10 rounded-full bg-green-100 text-green-600 hover:bg-green-200" onClick={(e) => handleAcceptSuperLike(e, match)}>
                                                <Check className="h-6 w-6" />
                                            </Button>
                                        )}
                                    </div>
                                );
                                
                                const isClickable = !(isSuperLikePending && isSuperLikeInitiator) || isSystemChat;

                                return (
                                    <motion.div
                                        key={match.id}
                                        onContextMenu={(e) => { 
                                            if(!isSystemChat) {
                                                e.preventDefault(); 
                                                setChatToDelete(match);
                                            }
                                        }}
                                    >
                                        {isClickable ? (
                                            <Link href={`/eslesmeler/${match.id}`}>
                                                <MatchItemContent />
                                            </Link>
                                        ) : (
                                            <div className="cursor-not-allowed opacity-70">
                                                <MatchItemContent />
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                </div>
            </>
        )}

        <AlertDialog open={!!chatToDelete} onOpenChange={(isOpen) => !isOpen && setChatToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sohbeti Silmek İstediğinizden Emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu işlem geri alınamaz. {chatToDelete?.fullName} ile olan tüm sohbet geçmişiniz, gönderilen fotoğraflar dahil kalıcı olarak silinecektir.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteChat} disabled={isDeleting} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                         {isDeleting ? <><Icons.logo width={16} height={16} className="mr-2 animate-pulse" /> Siliniyor...</> : <><Trash2 className='mr-2 h-4 w-4' />Sil</>}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

    
