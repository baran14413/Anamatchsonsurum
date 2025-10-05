
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { UserProfile } from '@/lib/types';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  userProfile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  userProfile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth || !firestore) {
      setIsUserLoading(false);
      setUserError(new Error("Auth or Firestore service not provided."));
      return;
    }

    let profileUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        // If user logs out, clean up everything
        if (!firebaseUser) {
          profileUnsubscribe?.();
          setUser(null);
          setUserProfile(null);
          setIsUserLoading(false);
          return;
        }

        // If user is logged in, set the auth user and start listening to their profile
        setUser(firebaseUser);

        // Kill previous profile listener if it exists
        profileUnsubscribe?.(); 
        
        const profileDocRef = doc(firestore, 'users', firebaseUser.uid);
        
        profileUnsubscribe = onSnapshot(
          profileDocRef,
          (docSnap) => {
            if (docSnap.exists() && docSnap.data()?.gender) {
              setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
            } else {
              // User exists in auth, but no complete profile in DB
              setUserProfile(null);
            }
            setIsUserLoading(false);
          },
          (error) => {
            console.error("FirebaseProvider: Profile onSnapshot error:", error);
            setUserError(error);
            setUserProfile(null);
            setIsUserLoading(false);
          }
        );
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        profileUnsubscribe?.();
        setUserError(error);
        setUser(null);
        setUserProfile(null);
        setIsUserLoading(false);
      }
    );

    return () => {
      authUnsubscribe();
      profileUnsubscribe?.();
    };
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user,
      userProfile,
      isUserLoading,
      userError,
    };
  }, [firebaseApp, firestore, auth, user, userProfile, isUserLoading, userError]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

const useFirebase = (): Omit<FirebaseContextState, 'areServicesAvailable'> => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }
  return context;
};

export const useAuth = (): Auth => useFirebase().auth!;
export const useFirestore = (): Firestore => useFirebase().firestore!;
export const useFirebaseApp = (): FirebaseApp => useFirebase().firebaseApp!;

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}

export const useUser = (): UserHookResult => {
  const { user, userProfile, isUserLoading, userError } = useFirebase();
  return { user, userProfile, isUserLoading, userError };
};
