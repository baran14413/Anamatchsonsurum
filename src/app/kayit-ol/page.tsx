
'use client';

import SignupForm from "@/components/signup-form";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignupPage() {
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
        // This check is for users who try to access /kayit-ol directly
        // while already being logged in but without going through the Google sign-in flow
        // which sets the sessionStorage item.
        const googleData = sessionStorage.getItem('googleSignupData');
        if (auth.currentUser && !googleData) {
            // If user is logged in but didn't come from Google sign-in on welcome page,
            // they are probably trying to re-register. Send them to the main page.
            router.replace('/anasayfa');
        }
    }, [auth, router]);

  return <SignupForm />;
}
