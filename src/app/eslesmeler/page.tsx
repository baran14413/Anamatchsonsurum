
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase/provider';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, writeBatch, serverTimestamp, getDocs, where, addDoc, limit, setDoc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Trash2, Check, Star, Info } from 'lucide-react';
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

export default function EslesmelerPage() {
  const t = langTr.eslesmeler;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [matches, setMatches] = useState<(DenormalizedMatch & { userProfile?: UserProfile })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatToInteract, setChatToInteract] = useState<DenormalizedMatch | null>(null);

  const matchesQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
        collection(firestore, `users/${user.uid}/matches`),
        orderBy('timestamp', 'desc')
    );
  }, [user, firestore]);

  useEffect(() => {
    if (!matchesQuery || !firestore) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    const unsubMatches = onSnapshot(matchesQuery, async (snapshot) => {
      const matchesDataPromises = snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data() as DenormalizedMatch;
          
          if(data.id !== 'system' && data.matchedWith) {
             const userDoc = await getDoc(doc(firestore, `users/${data.matchedWith}`));
             if (userDoc.exists()) {
                (data as any).userProfile = { id: userDoc.id, ...userDoc.data() } as UserProfile;
             }
          }
          return data;
      });
      
      const resolvedMatches = await Promise.all(matchesDataPromises);

      let systemMatchExists = false;
      resolvedMatches.forEach(match => {
          if (match.id === 'system') systemMatchExists = true;
      });

      // Ensure system match exists for the user
      if (resolvedMatches.length > 0 && !systemMatchExists && user) {
          const systemMatchRef = doc(firestore, `users/${user.uid}/matches`, 'system');
          await setDoc(systemMatchRef, {
              id: 'system',
              matchedWith: 'system',
              lastMessage: "BeMatch'e hoş geldin!",
              timestamp: serverTimestamp(),
              fullName: 'BeMatch - Sistem Mesajları',
              profilePicture: '',
              hasUnreadSystemMessage: false,
          }, { merge: true });
      }

      setMatches(resolvedMatches);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching matches:", error);
        setIsLoading(false);
    });

    return () => {
      unsubMatches();
    };

  }, [matchesQuery, user, firestore]);


  const filteredMatches = useMemo(() => {
    const systemMatch = matches.find(m => m.id === 'system');
    const otherMatches = matches.filter(m => m.id !== 'system' && (!searchTerm || (m.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())));

    return systemMatch ? [systemMatch, ...otherMatches] : otherMatches;
  }, [matches, searchTerm]);

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

        // This part is optional but good for cleanup: delete all messages in the subcollection
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
        batch.update(matchDocRef, { status: 'matched', matchDate: serverTimestamp() });

        const currentUserMatchRef = doc(firestore, `users/${user.uid}/matches`, match.id);
        batch.update(currentUserMatchRef, { status: 'matched', lastMessage: "Super Like'ı kabul ettin!" });
        
        const otherUserMatchRef = doc(firestore, `users/${match.matchedWith}/matches`, match.id);
        batch.update(otherUserMatchRef, { status: 'matched', lastMessage: "Super Like'ın kabul edildi!" });

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


  if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <Icons.logo width={48} height={48} className="animate-pulse text-primary" />
        </div>
      )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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
                            {filteredMatches.map(match => {
                                const isSuperLikePending = match.status === 'superlike_pending';
                                const isSuperLikeInitiator = match.superLikeInitiator === user?.uid;
                                const showAcceptButton = isSuperLikePending && !isSuperLikeInitiator;
                                const isSystemChat = match.id === 'system';
                                const hasUnread = (match.unreadCount && match.unreadCount > 0) || match.hasUnreadSystemMessage;
                                const isUserDeleted = !match.fullName;
                                const profilePictureUrl = match.profilePicture;


                                const MatchItemContent = () => (
                                    <div className="flex items-center p-4 hover:bg-muted/50">
                                        <div className='relative'>
                                            <Avatar className="h-12 w-12">
                                                {isSystemChat ? <Icons.bmIcon className='h-full w-full' /> : (isUserDeleted ? <Icons.bmIcon className='h-full w-full' /> : <AvatarImage src={profilePictureUrl} />)}
                                                <AvatarFallback>{isSystemChat ? 'BM' : (isUserDeleted ? 'X' : (match.fullName || '').charAt(0))}</AvatarFallback>
                                            </Avatar>
                                            {hasUnread && (
                                                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-background" />
                                            )}
                                        </div>
                                        <div className="ml-4 flex-1 overflow-hidden">
                                            <div className="flex justify-between items-center">
                                                <h3 className={cn("font-semibold flex items-center gap-1.5 truncate", hasUnread && "text-foreground")}>
                                                  {isUserDeleted ? 'Kullanıcı Bulunamadı' : match.fullName}
                                                  {!isSystemChat && match.isSuperLike && <Star className="h-4 w-4 text-blue-500 fill-blue-500" />}
                                                </h3>
                                                {match.timestamp && (
                                                    <p className="text-xs text-muted-foreground shrink-0 pl-2">
                                                        {formatDistanceToNow(match.timestamp.toDate(), { addSuffix: true, locale: tr })}
                                                    </p>
                                                )}
                                            </div>
                                            <p className={cn(
                                                "text-sm truncate", 
                                                isSuperLikeInitiator && isSuperLikePending ? "text-blue-500 font-medium" : "text-muted-foreground",
                                                hasUnread && "text-foreground font-medium"
                                                )}>{match.lastMessage}</p>
                                        </div>
                                        {showAcceptButton && (
                                            <Button variant="ghost" size="icon" className="ml-2 h-10 w-10 rounded-full bg-green-100 text-green-600 hover:bg-green-200" onClick={(e) => handleAcceptSuperLike(e, match)}>
                                                <Check className="h-6 w-6" />
                                            </Button>
                                        )}
                                    </div>
                                );
                                
                                const isClickable = !isUserDeleted && (!(isSuperLikePending && isSuperLikeInitiator) || isSystemChat);

                                return (
                                    <motion.div
                                        key={match.id}
                                        className="transform-gpu"
                                        onContextMenu={(e) => { 
                                            e.preventDefault(); 
                                            if (match.id === 'system') {
                                                toast({
                                                    title: 'Sistem mesajları silinemez.',
                                                    description: 'Bu sohbet, yöneticilerden gelen duyurular için kullanılır.',
                                                });
                                            } else {
                                                setChatToInteract(match);
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
