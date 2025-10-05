
'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { motion } from 'framer-motion';
import googleLogo from '@/img/googlelogin.png';
import { langTr } from '@/languages/tr';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function WelcomePage() {
  const t = langTr;
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
        const user = result.user;

        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data()?.gender) { 
            // User profile is complete, log them in
            router.push("/anasayfa");
        } else {
            // New user or incomplete profile, redirect to signup
            
            // Prepare data to pass to the signup page
            const googleData = {
                email: user.email,
                name: user.displayName,
                profilePicture: user.photoURL,
                uid: user.uid,
            };
            
            // If the document doesn't exist, create it with initial info
            // This ensures the UID is in our system before proceeding to signup
            if (!userDoc.exists()) {
                const initialProfileData = {
                    uid: user.uid,
                    email: user.email || '',
                    fullName: user.displayName || '',
                    images: user.photoURL ? [user.photoURL] : [],
                    profilePicture: user.photoURL || '',
                };
                await setDoc(userDocRef, initialProfileData, { merge: true });
            }

            // Store data in session storage to pass to the signup page
            sessionStorage.setItem('googleSignupData', JSON.stringify(googleData));
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
