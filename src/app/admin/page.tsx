'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';

/**
 * This is the root page for the /admin route.
 * Its sole purpose is to redirect the user to the main admin dashboard.
 */
export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  // Render a loading indicator while the redirect is in progress.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Icons.logo className="h-16 w-16 animate-pulse" />
    </div>
  );
}
