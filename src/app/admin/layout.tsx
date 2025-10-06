
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Home, Users, Settings } from 'lucide-react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from '@/components/ui/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, isUserLoading } = useUser();
  const router = useRouter();

  if (isUserLoading) {
    return <div className="flex h-screen items-center justify-center"><Icons.logo className="h-12 w-12 animate-pulse" /></div>;
  }

  if (!userProfile?.isAdmin) {
    // This is a fallback, AppShell should already handle redirection.
    router.replace('/anasayfa');
    return null;
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
                    <SidebarMenuItem>
                        <Link href="/admin/dashboard" className='w-full'>
                            <SidebarMenuButton tooltip="Dashboard">
                                <Home />
                                <span>Yönetim Paneli</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                         <Link href="/admin/users" className='w-full'>
                            <SidebarMenuButton tooltip="Users">
                                <Users />
                                <span>Kullanıcılar</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <header className="flex h-12 items-center gap-2 border-b bg-background p-2 md:p-4">
                <SidebarTrigger className='md:hidden'/>
                <h1 className='text-lg font-semibold ml-2'>Yönetim Paneli</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4">
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
