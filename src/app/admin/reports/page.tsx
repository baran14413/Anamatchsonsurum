

'use client';

import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
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
import { UserProfile, Report } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, UserX, CheckCircle, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Define an extended type for the hydrated report
interface HydratedReport extends Report {
  reporterProfile?: UserProfile;
  reportedProfile?: UserProfile;
}


export default function AdminReportsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const reportsQuery = useMemo(
    () => (firestore ? query(collection(firestore, 'reports'), orderBy('timestamp', 'desc')) : null),
    [firestore]
  );
  const { data: reports, isLoading: isLoadingReports } = useCollection<Report>(reportsQuery);
  const usersQuery = useMemo(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const [hydratedReports, setHydratedReports] = useState<HydratedReport[]>([]);

  useEffect(() => {
    if (reports && users) {
      const userMap = new Map(users.map(u => [u.uid, u]));
      const newHydratedReports: HydratedReport[] = reports.map(report => ({
        ...report,
        reporterProfile: userMap.get(report.reporterId),
        reportedProfile: userMap.get(report.reportedId),
      }));
      setHydratedReports(newHydratedReports);
    }
  }, [reports, users]);
  
  const handleUpdateReportStatus = async (reportId: string, status: Report['status']) => {
    if (!firestore) return;
    const reportRef = doc(firestore, 'reports', reportId);
    try {
        await updateDoc(reportRef, { status });
        toast({ title: 'Rapor Güncellendi', description: `Rapor durumu "${status}" olarak değiştirildi.`});
    } catch (error: any) {
        toast({ title: 'Hata', description: error.message, variant: 'destructive'});
    }
  };

  const handleBanUser = async (userToBan: UserProfile | undefined) => {
    if (!firestore || !userToBan) return;
    try {
        await deleteDoc(doc(firestore, 'users', userToBan.uid));
        // Also delete auth user in a real app
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
    }
  }

  const isLoading = isLoadingReports || isLoadingUsers;
  
  const getStatusVariant = (status: Report['status']) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'resolved': return 'default';
      case 'banned': return 'secondary';
      default: return 'secondary';
    }
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Raporları</CardTitle>
          <CardDescription>Kullanıcılar tarafından gönderilen şikayetleri ve raporları yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Raporlanan</TableHead>
                <TableHead className="hidden md:table-cell">Raporlayan</TableHead>
                <TableHead>Sebep</TableHead>
                <TableHead className="hidden md:table-cell">Tarih</TableHead>
                <TableHead className="hidden sm:table-cell">Durum</TableHead>
                <TableHead className='text-right'>Eylemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Icons.logo className="h-8 w-8 animate-pulse mx-auto" />
                  </TableCell>
                </TableRow>
              )}
              {hydratedReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={report.reportedProfile?.profilePicture} />
                            <AvatarFallback>{report.reportedProfile?.fullName?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{report.reportedProfile?.fullName || 'Bilinmiyor'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{report.reporterProfile?.fullName || 'Bilinmiyor'}</TableCell>
                   <TableCell className="max-w-[200px] truncate">{report.reason}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {report.timestamp ? formatDistanceToNow(report.timestamp.toDate(), { locale: tr, addSuffix: true }) : '-'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={getStatusVariant(report.status)} className={cn(report.status === 'resolved' && 'bg-green-500 hover:bg-green-600')}>
                      {report.status === 'resolved' && <CheckCircle className="mr-1 h-3 w-3" />}
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <MoreHorizontal className='h-4 w-4'/>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleUpdateReportStatus(report.id, 'resolved')}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            <span>Çözüldü Olarak İşaretle</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateReportStatus(report.id, 'pending')}>
                            <Trash2 className="mr-2 h-4 w-4 text-yellow-500" />
                            <span>Beklemede Olarak İşaretle</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { handleBanUser(report.reportedProfile); handleUpdateReportStatus(report.id, 'banned'); }}>
                            <UserX className="mr-2 h-4 w-4 text-red-500" />
                            <span>Kullanıcıyı Yasakla</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && hydratedReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Henüz hiç rapor bulunmuyor.
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
