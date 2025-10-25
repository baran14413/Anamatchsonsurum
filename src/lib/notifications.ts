
'use client';

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useFirebase } from '@/firebase/provider';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps } from 'firebase/app';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

// Firebase'in başlatıldığından emin ol
if (!getApps().length) {
    try {
      initializeApp(firebaseConfig);
    } catch(e) {
      console.error("Firebase zaten başlatılmış.");
    }
}

// WebView içindeki JavaScript arayüzü için tip tanımı
declare global {
  interface Window {
    AndroidWrapper?: {
      purchase: (productId: string) => void;
      registerFCMToken: (token: string) => void;
    };
  }
}

/**
 * Web'de bildirimlerin desteklenip desteklenmediğini kontrol eder.
 */
export const isNotificationSupported = (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

/**
 * Web için bildirim izni ister ve FCM token'ı alır.
 * @returns {Promise<{permission: NotificationPermission, fcmToken: string | null} | null>} İzin durumu ve token.
 */
export const requestNotificationPermission = async () => {
    if (!isNotificationSupported()) {
        console.log('Firebase Messaging bu tarayıcıda desteklenmiyor.');
        return null;
    }

    try {
        const messaging = getMessaging();
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('Bildirim izni verildi.');
            // publicVapidKey'i buraya ekleyin
            const fcmToken = await getToken(messaging, { vapidKey: 'BAMb49b5Bi3M6MwKz8PZMoYTtLOheAfAiXc4nhxbYwCBll-nKVZdpC4v3PoGP44JjuAXzBzXS8sPoJMtyC_bcb0' });
            if (fcmToken) {
                 // Eğer WebView içindeysek, token'ı native tarafa gönder
                if (window.AndroidWrapper && typeof window.AndroidWrapper.registerFCMToken === 'function') {
                    window.AndroidWrapper.registerFCMToken(fcmToken);
                }
                return { permission, fcmToken };
            }
        }
        return { permission, fcmToken: null };
    } catch (error) {
        console.error('İzin istenirken bir hata oluştu: ', error);
        return null;
    }
};

/**
 * Alınan FCM token'ını kullanıcının Firestore belgesine kaydeder.
 * @param firestore Firestore instance'ı.
 * @param user Oturum açmış kullanıcı objesi.
 * @param fcmToken Kaydedilecek FCM token.
 */
export const saveTokenToFirestore = async (firestore: any, user: any, fcmToken: string) => {
    if (!user || !firestore) return;
    try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, {
            fcmTokens: arrayUnion(fcmToken)
        });
        console.log('FCM token Firestore\'a kaydedildi.');
    } catch (error) {
        console.error('FCM token Firestore\'a kaydedilirken hata: ', error);
    }
};


export const useNotificationHandler = (toast: (options: any) => void) => {
    const { firebaseApp, firestore, user } = useFirebase();

    useEffect(() => {
        if (!firebaseApp || !user) return;

        // Sadece PWA/Web ortamında çalışacak onMessage listener'ı
        if (!Capacitor.isNativePlatform() && isNotificationSupported()) {
            const messaging = getMessaging(firebaseApp);
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Ön planda mesaj alındı. ', payload);
                toast({
                    title: payload.notification?.title,
                    description: payload.notification?.body,
                });
            });
            return () => unsubscribe();
        }

    }, [firebaseApp, firestore, user, toast]);
};
