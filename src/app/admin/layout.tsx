
'use client';

import { useEffect } from 'react';
import { useUser } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import { Home, Users, Settings, Smartphone, Server, ShieldCheck, Bot, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarGroup, SidebarGroupLabel, SidebarSeparator } from '@/components/ui/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) {
      return;
    }
    if (!userProfile?.isAdmin) {
      router.replace('/anasayfa');
    }
  }, [userProfile, isUserLoading, router]);

  if (isUserLoading || !userProfile?.isAdmin) {
    return <div className="flex h-screen items-center justify-center"><Icons.logo className="h-12 w-12 animate-pulse" /></div>;
  }

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarContent>
                <SidebarHeader>
                    <div className="flex items-center gap-2">
                        <Icons.logo className="h-7 w-auto" />
                        <h2 className="text-lg font-semibold">Admin Paneli</h2>
                    </div>
                </SidebarHeader>
                <SidebarMenu>
                    <SidebarGroup>
                        <SidebarGroupLabel>Sistem Kontrolü</SidebarGroupLabel>
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Dashboard" asChild>
                                <Link href="/admin/dashboard">
                                    <Home />
                                    <span>Genel Bakış</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Kullanıcılar" asChild>
                               <Link href="/admin/users">
                                    <Users />
                                    <span>Kullanıcılar</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Botlar" asChild>
                               <Link href="/admin/bots">
                                    <Bot />
                                    <span>Botlar</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Sistem Mesajları" asChild>
                               <Link href="/admin/system-messages">
                                    <MessageSquare />
                                    <span>Sistem Mesajları</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarGroup>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <SidebarInset className="overflow-y-auto">
            <header className="flex h-12 items-center gap-2 border-b bg-background p-2 md:p-4 sticky top-0 z-10">
                <SidebarTrigger className='md:hidden'/>
                <h1 className='text-lg font-semibold ml-2'>Yönetim Paneli</h1>
            </header>
            <main className="flex-1 p-4">
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
