
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

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [userToBan, setUserToBan] = useState<UserProfile | null>(null);

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), where('isBot', 'not-in', [true])) : null),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<UserProfile>(usersCollectionRef);

  const handleToggleAdmin = async (user: UserProfile) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', user.id);
    const newAdminStatus = !user.isAdmin;
    try {
      await updateDoc(userDocRef, { isAdmin: newAdminStatus });
      toast({
        title: 'Başarılı',
        description: `${user.fullName} kullanıcısının admin yetkisi ${newAdminStatus ? 'verildi' : 'alındı'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: `İşlem sırasında bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    }
  };
  
  const handleBanUser = async () => {
    if (!firestore || !userToBan) return;
    try {
        // Here you would typically call a serverless function to delete the user from Firebase Auth
        // For now, we just delete their Firestore document.
        await deleteDoc(doc(firestore, 'users', userToBan.id));
        toast({
            title: 'Kullanıcı Yasaklandı',
            description: `${userToBan.fullName} başarıyla sistemden yasaklandı.`
        });
    } catch(error: any) {
         toast({
            title: 'Hata',
            description: `Kullanıcı yasaklanırken bir hata oluştu: ${error.message}`,
            variant: 'destructive',
        });
    } finally {
        setUserToBan(null);
    }
  }


  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Icons.logo className="h-12 w-12 animate-pulse" /></div>;
  }

  return (
     <AlertDialog>
        <div className="space-y-6">
        <h1 className="text-2xl font-bold">Kullanıcılar</h1>
        <div className="rounded-lg border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>İsim</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead className='text-right'>Eylemler</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users && users.map((user) => (
                <TableRow key={user.id}>
                    <TableCell>
                    <Avatar>
                        <AvatarImage src={user.profilePicture} />
                        <AvatarFallback>{user.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                    <div className='flex items-center gap-2'>
                        <Badge variant={user.isOnline ? 'default' : 'secondary'}>
                        {user.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                        </Badge>
                        {user.isAdmin && <Badge variant='destructive' className='gap-1'><Shield className='h-3 w-3'/> Admin</Badge>}
                    </div>
                    </TableCell>
                    <TableCell>
                    {user.createdAt ? format(user.createdAt.toDate(), 'd MMMM yyyy', { locale: tr }) : '-'}
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
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem onClick={() => handleToggleAdmin(user)}>
                                    <Shield className='mr-2 h-4 w-4' />
                                    <span>{user.isAdmin ? 'Admin Yetkisini Al' : 'Admin Yap'}</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className='text-red-500 focus:text-red-500' onClick={() => setUserToBan(user)}>
                                        <Trash2 className='mr-2 h-4 w-4'/>
                                        <span>Kullanıcıyı Yasakla</span>
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
                {(!users || users.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                        Gerçek kullanıcı bulunamadı.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        </div>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcıyı Yasaklamak İstediğinizden Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
                Bu işlem geri alınamaz. {userToBan?.fullName} adlı kullanıcının hesabı ve tüm verileri kalıcı olarak silinecek ve uygulamaya erişimi engellenecektir.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToBan(null)}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBanUser} className='bg-destructive hover:bg-destructive/90'>Yasakla</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
     </AlertDialog>
  );
}
