
'use client';

import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, updateDoc, query, where } from 'firebase/firestore';
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
import { MoreHorizontal, ShieldOff, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AdminAdminsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const adminsCollectionRef = useMemo(
    () => (firestore ? query(collection(firestore, 'users'), where('isAdmin', '==', true)) : null),
    [firestore]
  );
  const { data: admins, isLoading } = useCollection<UserProfile>(adminsCollectionRef);

  const handleToggleAdmin = async (user: UserProfile) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', user.uid);
    try {
      await updateDoc(userDocRef, { isAdmin: false });
      toast({
        title: 'Başarılı',
        description: `${user.fullName} kullanıcısının admin yetkisi kaldırıldı.`,
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: `İşlem sırasında bir hata oluştu: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Icons.logo className="h-12 w-12 animate-pulse" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Yöneticiler ({admins?.length || 0})</CardTitle>
          <CardDescription>Sistemde yönetici yetkisine sahip kullanıcıların listesi.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Yönetici</TableHead>
                <TableHead className="hidden sm:table-cell">E-posta</TableHead>
                <TableHead className="hidden md:table-cell">Kayıt Tarihi</TableHead>
                <TableHead className='text-right'>Eylemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins && admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={admin.profilePicture} />
                        <AvatarFallback>{admin.fullName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className='flex flex-col'>
                        <span className="font-medium">{admin.fullName}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{admin.email}</TableCell>
                  <TableCell className="hidden md:table-cell min-w-[150px]">
                    {admin.createdAt ? format(admin.createdAt.toDate(), 'd MMMM yyyy', { locale: tr }) : '-'}
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
                        <DropdownMenuItem onClick={() => handleToggleAdmin(admin)} className='text-red-500 focus:text-red-500'>
                          <ShieldOff className='mr-2 h-4 w-4' />
                          <span>Admin Yetkisini Kaldır</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {(!admins || admins.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Yönetici bulunamadı.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
