
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Trash2 } from 'lucide-react';
import { langTr } from '@/languages/tr';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';

interface MatchData {
  id: string;
  matchedWith: string;
  lastMessage: string;
  timestamp: any;
  fullName: string;
  profilePicture: string;
}

export default function EslesmelerPage() {
  const t = langTr.eslesmeler;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatToDelete, setChatToDelete] = useState<MatchData | null>(null);

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
      const matchesData = snapshot.docs.map(doc => doc.data() as MatchData);
      setMatches(matchesData);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching matches:", error);
        setIsLoading(false);
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


  if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <Icons.logo width={48} height={48} className="animate-spin text-primary" />
        </div>
      )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
        {matches.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">{t.noChatsTitle}</h2>
                <p>{t.noChatsDescription}</p>
            </div>
        ) : (
            <>
                <div className="p-4 border-b shrink-0 bg-background">
                    <h1 className="text-xl font-bold text-center">{t.title}</h1>
                </div>

                <div className="p-4 border-b shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Sohbetlerde Ara" className="pl-10 bg-background" onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                
                <div className='flex-1 overflow-y-auto'>
                    {filteredMatches.length > 0 ? (
                        <div className="divide-y">
                            {filteredMatches.map(match => (
                                <motion.div
                                    key={match.id}
                                    onContextMenu={(e) => { e.preventDefault(); setChatToDelete(match); }}
                                >
                                    <Link href={`/eslesmeler/${match.id}`}>
                                        <div className="flex items-center p-4 hover:bg-muted/50 cursor-pointer">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={match.profilePicture} />
                                                <AvatarFallback>{match.fullName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="ml-4 flex-1">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-semibold">{match.fullName}</h3>
                                                    {match.timestamp && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(match.timestamp.toDate(), { addSuffix: true, locale: tr })}
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">{match.lastMessage}</p>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                     ) : (
                        <div className="text-center p-8 text-muted-foreground">
                            <p>Aramanızla eşleşen sohbet bulunamadı.</p>
                        </div>
                    )}
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
                         {isDeleting ? <><Icons.logo width={16} height={16} className="mr-2 animate-spin" /> Siliniyor...</> : <><Trash2 className='mr-2 h-4 w-4' />Sil</>}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

    