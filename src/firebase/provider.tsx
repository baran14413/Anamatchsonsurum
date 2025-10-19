
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { UserProfile } from '@/lib/types';
import { initializeFirebase } from '@/firebase'; // Import initializeFirebase
import { Storage } from 'firebase/storage';

interface FirebaseProviderProps {
  children: ReactNode;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: Storage | null;
  user: User | null;
  userProfile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  auth: Auth | null;
  userProfile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
}) => {
  const [services, setServices] = useState<{ firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore; storage: Storage; } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    // Initialize Firebase on the client side, once per component mount.
    const firebaseServices = initializeFirebase();
    if (firebaseServices.firebaseApp && firebaseServices.auth && firebaseServices.firestore && firebaseServices.storage) {
      setServices(firebaseServices as { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore; storage: Storage });
    }
  }, []);

  useEffect(() => {
    if (!services) {
      // Still waiting for services to initialize
      return;
    }
    
    const { auth, firestore } = services;

    let profileUnsubscribe: (() => void) | undefined;
    
    const authUnsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        // Clean up previous listeners
        profileUnsubscribe?.();

        if (firebaseUser) {
            setUser(firebaseUser);
            
            // Set user online upon login
            const userDocRef = doc(firestore, 'users', firebaseUser.uid);
            setDoc(userDocRef, { isOnline: true }, { merge: true });

            // Listen for profile changes
            profileUnsubscribe = onSnapshot(userDocRef, 
                (docSnap) => {
                    if (docSnap.exists()) {
                        const profileData = { id: docSnap.id, ...docSnap.data() } as UserProfile;
                        setUserProfile(profileData);
                    } else {
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

        } else {
            // User logs out
            if (user) { 
                 const userDocRef = doc(firestore, 'users', user.uid);
                 setDoc(userDocRef, { isOnline: false, lastSeen: serverTimestamp() }, { merge: true });
            }
            setUser(null);
            setUserProfile(null);
            setIsUserLoading(false);
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserError(error);
        setUser(null);
        setUserProfile(null);
        setIsUserLoading(false);
      }
    );

    return () => {
      authUnsubscribe();
      profileUnsubscribe?.();
       if (user) { 
          const userDocRef = doc(firestore, 'users', user.uid);
          setDoc(userDocRef, { isOnline: false, lastSeen: serverTimestamp() }, { merge: true });
       }
    };
  }, [services, user]); 

  const contextValue = useMemo((): FirebaseContextState => {
    const areServicesAvailable = !!services;
    return {
      areServicesAvailable,
      firebaseApp: services?.firebaseApp || null,
      firestore: services?.firestore || null,
      auth: services?.auth || null,
      storage: services?.storage || null,
      user,
      userProfile,
      isUserLoading: !services || isUserLoading, // Still loading if services aren't ready
      userError,
    };
  }, [services, user, userProfile, isUserLoading, userError]);

  if (!services) {
    return null;
  }

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): Omit<FirebaseContextState, 'areServicesAvailable'> => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.storage) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }
  return context;
};

export const useFirestore = (): Firestore => useFirebase().firestore!;
export const useAuth = (): Auth => useFirebase().auth!;
export const useFirebaseApp = (): FirebaseApp => useFirebase().firebaseApp!;
export const useUserProfile = (): UserProfile | null => useFirebase().userProfile;

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}

export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);
   if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  const { user, auth, userProfile, isUserLoading, userError } = context;
  return { user, auth, userProfile, isUserLoading, userError };
};
