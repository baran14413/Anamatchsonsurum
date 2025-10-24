
'use client';

import { useEffect } from 'react';
import { useUser } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import { Home, Users, Settings, Smartphone, Server, ShieldCheck, Bot, MessageSquare, LogOut, Heart, BarChart, Bug, UserCog } from 'lucide-react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarGroup, SidebarGroupLabel, SidebarSeparator } from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) {
      return; // Don't do anything until user status is resolved
    }

    const hasAdminAccess = sessionStorage.getItem('admin_access') === 'granted';

    // If user is not logged in at all, redirect to home
    if (!user) {
      router.replace('/');
      return;
    }

    // If user is logged in, but not an admin AND doesn't have the session pass, redirect
    if (!userProfile?.isAdmin && !hasAdminAccess) {
      router.replace('/anasayfa');
    }
    
  }, [user, userProfile, isUserLoading, router]);

  // While user data is loading, show a loading indicator.
  if (isUserLoading) {
    return <div className="flex h-screen items-center justify-center"><Icons.logo className="h-12 w-12 animate-pulse" /></div>;
  }

  // If loading is complete, render the admin layout.
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
                <ScrollArea className="flex-1">
                    <SidebarMenu>
                        <SidebarGroup>
                            <SidebarGroupLabel>Ana Menü</SidebarGroupLabel>
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
                        </SidebarGroup>
                        <SidebarSeparator />
                        <SidebarGroup>
                            <SidebarGroupLabel>İçerik & Etkileşim</SidebarGroupLabel>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Eşleşmeler" asChild>
                                   <Link href="/admin/dashboard"> {/* Placeholder */}
                                        <Heart />
                                        <span>Eşleşmeler</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                             <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Raporlar" asChild>
                                   <Link href="/admin/dashboard"> {/* Placeholder */}
                                        <Bug />
                                        <span>Raporlar</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                             <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Duyurular" asChild>
                                   <Link href="/admin/system-messages">
                                        <MessageSquare />
                                        <span>Duyurular</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarGroup>
                        <SidebarSeparator />
                        <SidebarGroup>
                            <SidebarGroupLabel>Sistem</SidebarGroupLabel>
                             <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Analiz" asChild>
                                   <Link href="/admin/dashboard"> {/* Placeholder */}
                                        <BarChart />
                                        <span>Analiz</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Adminler" asChild>
                                   <Link href="/admin/dashboard"> {/* Placeholder */}
                                        <UserCog />
                                        <span>Adminler</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                             <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Ayarlar" asChild>
                                   <Link href="/admin/dashboard"> {/* Placeholder */}
                                        <Settings />
                                        <span>Ayarlar</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarGroup>
                    </SidebarMenu>
                </ScrollArea>
                <SidebarFooter>
                    <Button variant="ghost" className='w-full justify-start'>
                        <LogOut className='mr-2 h-4 w-4' />
                        Çıkış Yap
                    </Button>
                </SidebarFooter>
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
             <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                 <SidebarTrigger className="md:hidden" />
                 {/* You can add a breadcrumb or title here if needed */}
            </header>
            <main className="flex-1 p-4 pt-0 md:p-6 md:pt-0 overflow-auto">
                 {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminLayoutContent>
            {children}
        </AdminLayoutContent>
    )
}
