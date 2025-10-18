'use client';

import { useUser } from '@/firebase/provider';
import ProfileCompletionForm from "@/components/signup-form";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Icons } from '@/components/icons';

export default function ProfileCompletionPage() {
    const { user, isUserLoading, userProfile } = useUser();
    const router = useRouter();

    useEffect(() => {
        // This effect handles redirection for already-completed users trying to access this page.
        if (!isUserLoading && user && userProfile?.gender) {
            router.replace('/anasayfa');
        }
    }, [isUserLoading, user, userProfile, router]);
    
    // If the user object is loading, or if the user is already fully registered, show a loader.
    // This prevents a flash of the form for users who should be redirected.
    if (isUserLoading || (user && userProfile?.gender)) {
        return (
            <div className="flex h-dvh items-center justify-center">
                <Icons.logo className="h-12 w-12 animate-pulse" />
            </div>
        );
    }
    
    // If there's no user and it's not loading, they can start the signup process.
    return <ProfileCompletionForm />;
}
