import { initializeApp, getApps, App, cert, credential } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let db: Firestore | undefined;

if (!getApps().length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            adminApp = initializeApp({
                credential: cert(serviceAccount)
            });
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            adminApp = initializeApp({
                credential: credential.applicationDefault()
            });
        } else {
             // Bu, sunucu tarafı işlevlerin çalışmayacağı anlamına gelir.
            console.warn("Firebase Admin SDK başlatılamadı. FIREBASE_SERVICE_ACCOUNT_KEY veya GOOGLE_APPLICATION_CREDENTIALS ortam değişkenleri ayarlanmamış.");
        }
    } catch (e) {
        console.error("Firebase Admin SDK başlatılırken kritik bir hata oluştu:", e);
    }
} else {
    adminApp = getApps()[0];
}

if (adminApp) {
    db = getFirestore(adminApp);
}

export { adminApp, db };
