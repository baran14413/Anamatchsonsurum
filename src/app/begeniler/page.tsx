
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This page is now a redirector to the unified matches/likes page.
export default function BegenilerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/eslesmeler');
  }, [router]);

  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
