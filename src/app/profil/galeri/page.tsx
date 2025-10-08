
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';

// This page is now deprecated as its content is merged into the main profile page.
// We redirect the user to the profile page to avoid confusion or errors.
export default function GalleryRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/profil');
    }, [router]);

    return (
        <div className="flex h-dvh w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Icons.logo width={48} height={48} className="animate-pulse" />
                <p>Yönlendiriliyor...</p>
            </div>
        </div>
    );
}
