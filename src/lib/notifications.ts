
'use client';

import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { useFirebase } from '@/firebase/provider';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps } from 'firebase/app';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

// Ensure Firebase is initialized
if (!getApps().length) {
    initializeApp(firebaseConfig);
}

// Function to check if notification is supported
export const isNotificationSupported = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        return false;
    }
    try {
        const supported = await isSupported();
        return supported;
    } catch (e) {
        console.error("Error checking notification support:", e);
        // Fallback for some WebViews where isSupported() might fail but basic APIs exist.
        return true;
    }
};

export const requestNotificationPermission = async () => {
    const supported = await isNotificationSupported();
    if (!supported) {
        console.log('Firebase Messaging is not supported in this browser.');
        return null;
    }

    try {
        const messaging = getMessaging();
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('Notification permission granted.');
            const fcmToken = await getToken(messaging, { vapidKey: 'BAMb49b5Bi3M6MwKz8PZMoYTtLOheAfAiXc4nhxbYwCBll-nKVZdpC4v3PoGP44JjuAXzBzXS8sPoJMtyC_bcb0' });
            if (fcmToken) {
                return { permission, fcmToken };
            } else {
                console.log('No registration token available. Request permission to generate one.');
                return { permission, fcmToken: null };
            }
        } else {
            console.log('Unable to get permission to notify.');
            return { permission, fcmToken: null };
        }
    } catch (error) {
        console.error('An error occurred while requesting permission. ', error);
        return null;
    }
};

export const saveTokenToFirestore = async (firestore: any, user: any, fcmToken: string) => {
    if (!user || !firestore) return;
    try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, {
            fcmTokens: arrayUnion(fcmToken)
        });
        console.log('FCM token saved to Firestore.');
    } catch (error) {
        console.error('Error saving FCM token to Firestore: ', error);
    }
};

export const removeTokenFromFirestore = async (firestore: any, user: any, fcmToken: string) => {
    if (!user || !firestore) return;
    try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, {
            fcmTokens: arrayRemove(fcmToken)
        });
        console.log('FCM token removed from Firestore.');
    } catch (error) {
        console.error('Error removing FCM token from Firestore: ', error);
    }
};

export const useNotificationHandler = (toast: (options: any) => void) => {
    const { firebaseApp } = useFirebase();

    useEffect(() => {
        const checkSupportAndListen = async () => {
            if (firebaseApp && await isNotificationSupported()) {
                const messaging = getMessaging(firebaseApp);
                const unsubscribe = onMessage(messaging, (payload) => {
                    console.log('Foreground message received. ', payload);
                    toast({
                        title: payload.notification?.title,
                        description: payload.notification?.body,
                    });
                });
                return () => unsubscribe();
            }
        };

        const unsubscribePromise = checkSupportAndListen();

        return () => {
            unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
        };
    }, [firebaseApp, toast]);
};

// This function needs to be called from a component that uses the useUser hook
export const manageNotificationPermission = async (firestore: any, user: any) => {
    const permissionResult = await requestNotificationPermission();
    if (permissionResult?.permission === 'granted' && permissionResult.fcmToken) {
        await saveTokenToFirestore(firestore, user, permissionResult.fcmToken);
    }
};
