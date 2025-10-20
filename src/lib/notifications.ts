
'use client';

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useFirebase } from '@/firebase/provider';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps } from 'firebase/app';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token } from '@capacitor/push-notifications';

// Ensure Firebase is initialized
if (!getApps().length) {
    try {
      initializeApp(firebaseConfig);
    } catch(e) {
      console.error("Firebase already initialized.")
    }
}

// Function to check if notification is supported
export const isNotificationSupported = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }
    // A more reliable check for PWA/WebView context is the presence of the core APIs.
    return 'serviceWorker' in navigator &&
           'PushManager' in window &&
           'Notification' in window;
};

export const requestNotificationPermission = async () => {
    const supported = isNotificationSupported();
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
    const { firebaseApp, firestore, user } = useFirebase();

    useEffect(() => {
        if (!firebaseApp) return;

        const setupListeners = async () => {
            if (Capacitor.isNativePlatform()) {
                // Handle mobile push notifications
                PushNotifications.addListener('registration', async (token: Token) => {
                    console.log('Push registration success, token: ' + token.value);
                    await saveTokenToFirestore(firestore, user, token.value);
                });

                PushNotifications.addListener('registrationError', (error: any) => {
                    console.error('Error on registration: ' + JSON.stringify(error));
                });

                PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Push received: ' + JSON.stringify(notification));
                     toast({
                        title: notification.title,
                        description: notification.body,
                    });
                });

            } else if (isNotificationSupported()) {
                // Handle web push notifications
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

        const unsubscribePromise = setupListeners();

        return () => {
            if (Capacitor.isNativePlatform()) {
                PushNotifications.removeAllListeners();
            } else {
                 unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
            }
        };

    }, [firebaseApp, firestore, user, toast]);
};
