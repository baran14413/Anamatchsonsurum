import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let db: Firestore | undefined;

if (getApps().length === 0) {
  try {
    // In a Firebase hosting environment (like App Hosting),
    // initializeApp() will automatically use the available service account.
    adminApp = initializeApp();
  } catch (e) {
    console.error("Firebase Admin SDK otomatik başlatılamadı. Ortam değişkenlerinin doğru ayarlandığından emin olun.", e);
  }
} else {
  adminApp = getApps()[0];
}

if (adminApp) {
  db = getFirestore(adminApp);
}

export { adminApp, db };
