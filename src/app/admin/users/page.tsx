
'use client';

import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, query, serverTimestamp, increment } from 'firebase/firestore';
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
import { format, add } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Bot, Shield, Trash2, Gem, Star } from 'lucide-react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [userToBan, setUserToBan] = useState<UserProfile | null>(null);
  const [userToManage, setUserToManage] = useState<UserProfile | null>(null);

  const allUsersCollectionRef = useMemo(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: allUsers, isLoading } = useCollection<UserProfile>(allUsersCollectionRef);

  const users = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(user => user.isBot !== true);
  }, [allUsers]);

  const handleToggleAdmin = async (user: UserProfile) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', user.uid);
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
        await deleteDoc(doc(firestore, 'users', userToBan.uid));
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

  const handleGrantGold = async (duration: 'weekly' | 'monthly' | 'yearly' | 'permanent' | 'remove') => {
      if (!firestore || !userToManage) return;

      const userDocRef = doc(firestore, 'users', userToManage.uid);
      let expiryDate: Date | null = new Date();
      let updateData: any = {};

      if (duration === 'remove') {
          updateData = {
              membershipType: 'free',
              goldMembershipExpiresAt: null
          };
      } else {
          updateData.membershipType = 'gold';
          if (duration === 'weekly') {
              expiryDate = add(new Date(), { weeks: 1 });
          } else if (duration === 'monthly') {
              expiryDate = add(new Date(), { months: 1 });
          } else if (duration === 'yearly') {
              expiryDate = add(new Date(), { years: 1 });
          } else { // permanent
              expiryDate = null; // No expiry for permanent
          }
          updateData.goldMembershipExpiresAt = expiryDate;
      }
      
      try {
          await updateDoc(userDocRef, updateData);
          toast({
              title: 'Üyelik Güncellendi',
              description: `${userToManage.fullName} kullanıcısının Gold üyeliği başarıyla güncellendi.`
          });
      } catch (error: any) {
           toast({
              title: 'Hata',
              description: `Üyelik güncellenirken bir hata oluştu: ${error.message}`,
              variant: 'destructive',
          });
      } finally {
          setUserToManage(null);
      }
  }

  const handleGrantSuperLikes = async (amount: number) => {
    if (!firestore || !userToManage) return;

    const userDocRef = doc(firestore, 'users', userToManage.uid);
    try {
        await updateDoc(userDocRef, {
            superLikeBalance: increment(amount)
        });
        toast({
            title: 'Super Like Eklendi',
            description: `${userToManage.fullName} kullanıcısına ${amount} Super Like başarıyla eklendi.`
        });
    } catch (error: any) {
        toast({
            title: 'Hata',
            description: `Super Like eklenirken bir hata oluştu: ${error.message}`,
            variant: 'destructive',
        });
    } finally {
        setUserToManage(null);
    }
  }


  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Icons.logo className="h-12 w-12 animate-pulse" /></div>;
  }

  return (
     <AlertDialog>
       <Dialog open={!!userToManage} onOpenChange={(isOpen) => !isOpen && setUserToManage(null)}>
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Kullanıcılar ({users.length})</h1>
            <div className="rounded-lg border overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[80px]">Avatar</TableHead>
                    <TableHead>İsim</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Üyelik</TableHead>
                    <TableHead>Super Like</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead className='text-right'>Eylemler</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users && users.map((user) => {
                      const isGold = user.membershipType === 'gold';
                      let expiryDate: string | null = null;
                      if (isGold && user.goldMembershipExpiresAt) {
                        try {
                           expiryDate = format(user.goldMembershipExpiresAt.toDate(), 'd MMM yyyy', { locale: tr });
                        } catch (e) {
                          if (user.goldMembershipExpiresAt instanceof Date) {
                             expiryDate = format(user.goldMembershipExpiresAt, 'd MMM yyyy', { locale: tr });
                          }
                        }
                      }
                      
                      return (
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
                              <div className='flex items-center gap-2 min-w-max'>
                                <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => setUserToManage(user)}>
                                    <Gem className={isGold ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground hover:text-yellow-500'} />
                                </Button>
                                {isGold && <span className='text-xs text-muted-foreground'>{expiryDate || 'Kalıcı'}</span>}
                              </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                                <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => setUserToManage(user)}>
                                    <Star className={(user.superLikeBalance || 0) > 0 ? 'text-blue-500 fill-blue-500' : 'text-muted-foreground hover:text-blue-500'} />
                                </Button>
                                <span className='text-sm font-medium'>{user.superLikeBalance || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                          <div className='flex items-center gap-2'>
                              <Badge variant={user.isOnline ? 'default' : 'secondary'}>
                              {user.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                              </Badge>
                              {user.isAdmin && <Badge variant='destructive' className='gap-1'><Shield className='h-3 w-3'/> Admin</Badge>}
                          </div>
                          </TableCell>
                          <TableCell className="min-w-[150px]">
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
                                      <DropdownMenuItem onClick={() => setUserToManage(user)}>
                                        <Gem className='mr-2 h-4 w-4' />
                                        <span>Üyelik & Bakiye</span>
                                      </DropdownMenuItem>
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
                      );
                    })}
                    {(!users || users.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
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

        <DialogContent>
            <DialogHeader>
                <DialogTitle>{userToManage?.fullName} için Üyelik & Bakiye Yönetimi</DialogTitle>
                <DialogDescription>
                    Kullanıcıya Gold üyelik vermek veya Super Like bakiyesi eklemek için bir seçenek seçin.
                </DialogDescription>
            </DialogHeader>
            <div className='py-4 space-y-6'>
                <div>
                    <h3 className='font-semibold mb-2'>Gold Üyelik</h3>
                    <div className='grid grid-cols-2 gap-4'>
                        <Button onClick={() => handleGrantGold('weekly')}>Haftalık</Button>
                        <Button onClick={() => handleGrantGold('monthly')}>Aylık</Button>
                        <Button onClick={() => handleGrantGold('yearly')}>Yıllık</Button>
                        <Button onClick={() => handleGrantGold('permanent')}>Kalıcı</Button>
                         {userToManage?.membershipType === 'gold' && (
                            <Button variant="destructive" className="col-span-2" onClick={() => handleGrantGold('remove')}>
                                Üyeliği Kaldır
                            </Button>
                        )}
                    </div>
                </div>
                
                <div>
                    <h3 className='font-semibold mb-2'>Super Like Bakiye Ekle</h3>
                     <div className='grid grid-cols-3 gap-4'>
                        <Button variant="outline" onClick={() => handleGrantSuperLikes(5)}>+5 Super Like</Button>
                        <Button variant="outline" onClick={() => handleGrantSuperLikes(25)}>+25 Super Like</Button>
                        <Button variant="outline" onClick={() => handleGrantSuperLikes(60)}>+60 Super Like</Button>
                    </div>
                </div>
            </div>
             <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Kapat</Button>
                  </DialogClose>
            </DialogFooter>
        </DialogContent>
     </Dialog>
     </AlertDialog>
  );
}
