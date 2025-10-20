
'use client';

import { useEffect } from 'react';
import { useUser } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import { Home, Users, Settings, Smartphone, Server, ShieldCheck, Bot, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarGroup, SidebarGroupLabel, SidebarSeparator } from '@/components/ui/sidebar';
import AppShell from '@/components/app-shell';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { userProfile, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // We only want to check for admin status once the user loading is complete.
    if (!isUserLoading) {
      // If the user is loaded and they are not an admin, redirect them.
      if (!userProfile?.isAdmin) {
        router.replace('/anasayfa');
      }
    }
    // The dependency array ensures this effect runs when loading status or profile changes.
  }, [userProfile, isUserLoading, router]);

  // While user data is loading, show a loading indicator.
  if (isUserLoading) {
    return <div className="flex h-screen items-center justify-center"><Icons.logo className="h-12 w-12 animate-pulse" /></div>;
  }

  // After loading, if the user is still not an admin (e.g., they logged out or never were an admin),
  // render null to avoid a flash of content before the redirect effect kicks in.
  if (!userProfile?.isAdmin) {
    return null;
  }
  
  // If loading is complete and the user is an admin, render the admin layout.
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
            <main className="flex-1 p-4">
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppShell>
            <AdminLayoutContent>
                {children}
            </AdminLayoutContent>
        </AppShell>
    )
}
