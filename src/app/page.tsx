
'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { motion } from 'framer-motion';
import googleLogo from '@/img/googlelogin.png';
import { langTr } from '@/languages/tr';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useAuth, useFirestore, useUser } from '@/firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

export default function WelcomePage() {
  const t = langTr;
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, userProfile, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // This effect now ONLY handles redirecting authenticated and *profile-complete* users.
  // The AppShell handles all other routing logic.
  useEffect(() => {
    if (!isUserLoading && user && userProfile) {
        router.replace('/anasayfa');
    }
  }, [user, userProfile, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    if (!auth || !firestore) {
        toast({
            title: t.common.error,
            description: t.login.errors.authServiceError,
            variant: "destructive"
        });
        setIsGoogleLoading(false);
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const signedInUser = result.user;

        const userDocRef = doc(firestore, "users", signedInUser.uid);
        const userDoc = await getDoc(userDocRef);

        // If user document doesn't exist, create a minimal one.
        if (!userDoc.exists()) {
            const initialProfileData = {
                uid: signedInUser.uid,
                email: signedInUser.email || '',
                fullName: signedInUser.displayName || '',
                images: signedInUser.photoURL ? [{ url: signedInUser.photoURL, public_id: '' }] : [],
                profilePicture: signedInUser.photoURL || '',
            };
            await setDoc(userDocRef, initialProfileData, { merge: true });
        }

        // Regardless of whether they are new or returning, send them to the main app.
        // AppShell will handle redirecting to /kayit-ol if the profile is incomplete.
        router.push("/anasayfa");

    } catch (error: any) {
        console.error("Google Sign-In Error:", error);
        toast({
            title: t.login.errors.googleLoginFailedTitle,
            description: error.message || t.login.errors.googleLoginFailed,
            variant: "destructive",
        });
    } finally {
        setIsGoogleLoading(false);
    }
  };

  if (isUserLoading || (user && userProfile)) {
      return (
           <div className="flex h-dvh items-center justify-center">
             <Icons.logo width={48} height={48} className="animate-spin" />
           </div>
      );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-500 to-purple-600 text-white">
      <main className="flex flex-1 flex-col items-center p-8 text-center">
        <div className="flex-1 flex flex-col justify-center items-center">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2.5,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
            className="mb-8"
          >
            <Icons.logo width={256} height={256} />
          </motion.div>
           <div className="w-40 h-px bg-gradient-to-r from-red-500 to-blue-500 mb-8"></div>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="text-xs text-white/90">
            <p dangerouslySetInnerHTML={{ __html: t.welcome.agreement.replace('<1>', '<a href="/tos" class="underline">').replace('</1>', '</a>').replace('<3>', '<a href="/privacy" class="underline">').replace('</3>', '</a>').replace('<5>', '<a href="/cookies" class="underline">').replace('</5>', '</a>') }} />
          </div>

          <div className="space-y-3">
             <Button
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                variant="outline"
                className="w-full h-12 rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30 text-base font-semibold justify-start pl-6 backdrop-blur-sm"
              >
                {isGoogleLoading ? (
                   <Icons.logo width={24} height={24} className="animate-spin mr-4" />
                ) : (
                   <Image src={googleLogo} alt="Google logo" width={24} height={24} className="mr-4" />
                )}
                {t.welcome.continueWithGoogle}
              </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
