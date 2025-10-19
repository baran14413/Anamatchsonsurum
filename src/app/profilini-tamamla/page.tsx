
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
        if (!isUserLoading && user && userProfile?.gender) {
            router.replace('/anasayfa');
        }
    }, [isUserLoading, user, userProfile, router]);
    
    // This page is now primarily for users who have an account but haven't finished signup.
    // The main entry point is now /login which uses the same form.
    if (isUserLoading || (user && userProfile?.gender)) {
        return (
            <div className="flex h-dvh items-center justify-center">
                <Icons.logo className="h-12 w-12 animate-pulse" />
            </div>
        );
    }
    
    return <ProfileCompletionForm />;
}
