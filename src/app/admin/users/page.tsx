
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
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

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<UserProfile>(usersCollectionRef);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Icons.logo className="h-12 w-12 animate-pulse" /></div>;
  }

  return (
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={user.profilePicture} />
                    <AvatarFallback>{user.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.isOnline ? 'default' : 'secondary'}>
                    {user.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {/* Note: Firestore timestamp needs to be converted.
                      Assuming a 'createdAt' field exists. If not, this will be blank. */}
                  {user.lastSeen ? format(user.lastSeen.toDate(), 'd MMMM yyyy', { locale: tr }) : '-'}
                </TableCell>
              </TableRow>
            ))}
             {(!users || users.length === 0) && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                    Kullanıcı bulunamadı.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
