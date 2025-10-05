
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
import { Loader2 } from 'lucide-react';

export default function WelcomePage() {
  const t = langTr;
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    // This effect now ONLY handles redirecting authenticated users from public routes.
    // The AppShell handles protecting routes for unauthenticated users.
    if (!isUserLoading && user) {
        // A logged-in user should not be on the welcome page, send them to the main app page.
        router.replace('/anasayfa');
    }
  }, [user, isUserLoading, router]);

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

        // Check if the user document exists AND if it has the 'gender' field.
        // The 'gender' field is a good indicator that the user has completed the signup process.
        if (userDoc.exists() && userDoc.data()?.gender) { 
            // User profile is complete, log them in by sending to main page
            router.push("/anasayfa");
        } else {
            // New user or incomplete profile, redirect to signup.
            
            // Store Google data to pre-fill the signup form.
            const googleData = {
                email: signedInUser.email,
                name: signedInUser.displayName,
                profilePicture: signedInUser.photoURL,
                uid: signedInUser.uid,
            };
            
            // If the document doesn't exist at all, create a basic one.
            if (!userDoc.exists()) {
                const initialProfileData = {
                    uid: signedInUser.uid,
                    email: signedInUser.email || '',
                    fullName: signedInUser.displayName || '',
                    images: signedInUser.photoURL ? [signedInUser.photoURL] : [],
                    profilePicture: signedInUser.photoURL || '',
                };
                await setDoc(userDocRef, initialProfileData, { merge: true });
            }

            // Use sessionStorage to pass this info to the registration page.
            sessionStorage.setItem('googleSignupData', JSON.stringify(googleData));
            // Force redirect to the registration page.
            router.push("/kayit-ol");
        }

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

  // While checking user auth or if user is found, show a loader.
  // This prevents the welcome page from flashing before a redirect.
  if (isUserLoading || user) {
      return (
           <div className="flex h-dvh items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin" />
           </div>
      );
  }

  // Only render the welcome page if the user is not logged in.
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
                   <Loader2 className="mr-4 h-5 w-5 animate-spin" />
                ) : (
                   <Image src={googleLogo} alt="Google logo" width={24} height={24} className="mr-4" />
                )}
                {t.welcome.continueWithGoogle}
              </Button>
               <Link href="/login" className="w-full h-12 rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30 text-base font-semibold justify-start pl-6 backdrop-blur-sm inline-flex items-center">
                    <Icons.logo width={24} height={24} className="mr-4" />
                    {t.welcome.continueWithEmail}
              </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
