
'use client';

import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { useFirebase } from '@/firebase/provider';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps } from 'firebase/app';

// Ensure Firebase is initialized
if (!getApps().length) {
    initializeApp(firebaseConfig);
}

// Function to check if notification is supported
export const isNotificationSupported = () => {
    return isSupported();
};

export const requestNotificationPermission = async () => {
    if (!isNotificationSupported()) {
        console.log('Firebase Messaging is not supported in this browser.');
        return null;
    }

    try {
        const messaging = getMessaging();
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('Notification permission granted.');
            const fcmToken = await getToken(messaging, { vapidKey: 'BBRyH4L_Z-Y-9LhYmY2Qp8fQz2eE8fX_jY_6bJzXo_k9Y_9jHhJ_o_P_wZ_kHjFjE_l_G_h_J' });
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
        if (!firebaseApp || !isNotificationSupported()) return;

        const messaging = getMessaging(firebaseApp);
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received. ', payload);
            toast({
                title: payload.notification?.title,
                description: payload.notification?.body,
            });
        });

        return () => unsubscribe();
    }, [firebaseApp, toast]);
};

// This function needs to be called from a component that uses the useUser hook
export const manageNotificationPermission = async (firestore: any, user: any) => {
    const permissionResult = await requestNotificationPermission();
    if (permissionResult?.permission === 'granted' && permissionResult.fcmToken) {
        await saveTokenToFirestore(firestore, user, permissionResult.fcmToken);
    }
};
