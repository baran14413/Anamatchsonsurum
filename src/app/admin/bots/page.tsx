
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { UserProfile } from '@/lib/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Bot, Shield, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function AdminBotsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [botToDelete, setBotToDelete] = useState<UserProfile | null>(null);

  const botsCollectionRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), where('isBot', '==', true)) : null),
    [firestore]
  );
  const { data: bots, isLoading } = useCollection<UserProfile>(botsCollectionRef);

  const handleDeleteBot = async () => {
    if (!firestore || !botToDelete) return;
    try {
        // Here you would typically call a serverless function to delete the user from Firebase Auth
        // For now, we just delete their Firestore document.
        await deleteDoc(doc(firestore, 'users', botToDelete.id));
        toast({
            title: 'Bot Silindi',
            description: `${botToDelete.fullName} adlı bot başarıyla sistemden silindi.`
        });
    } catch(error: any) {
         toast({
            title: 'Hata',
            description: `Bot silinirken bir hata oluştu: ${error.message}`,
            variant: 'destructive',
        });
    } finally {
        setBotToDelete(null);
    }
  }


  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Icons.logo className="h-12 w-12 animate-pulse" /></div>;
  }

  return (
     <AlertDialog>
        <div className="space-y-6">
        <h1 className="text-2xl font-bold">Botlar</h1>
        <div className="rounded-lg border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>İsim</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Oluşturulma Tarihi</TableHead>
                <TableHead className='text-right'>Eylemler</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {bots && bots.map((bot) => (
                <TableRow key={bot.id}>
                    <TableCell>
                    <Avatar>
                        <AvatarImage src={bot.profilePicture} />
                        <AvatarFallback>{bot.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{bot.fullName}</TableCell>
                    <TableCell>{bot.email}</TableCell>
                    <TableCell>
                    <div className='flex items-center gap-2'>
                        <Badge variant={'default'}>
                        Çevrimiçi
                        </Badge>
                        <Badge variant='outline' className='gap-1'><Bot className='h-3 w-3'/> Bot</Badge>
                    </div>
                    </TableCell>
                    <TableCell>
                    {bot.createdAt ? format(bot.createdAt.toDate(), 'd MMMM yyyy', { locale: tr }) : '-'}
                    </TableCell>
                    <TableCell className='text-right'>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='icon'>
                                    <MoreHorizontal className='h-4 w-4'/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Eylemler</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className='text-red-500 focus:text-red-500' onClick={() => setBotToDelete(bot)}>
                                        <Trash2 className='mr-2 h-4 w-4'/>
                                        <span>Botu Sil</span>
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
                {(!bots || bots.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                        Bot bulunamadı.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        </div>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Botu Silmek İstediğinizden Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
                Bu işlem geri alınamaz. {botToDelete?.fullName} adlı botun hesabı ve tüm verileri kalıcı olarak silinecektir.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBotToDelete(null)}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBot} className='bg-destructive hover:bg-destructive/90'>Sil</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
     </AlertDialog>
  );
}
